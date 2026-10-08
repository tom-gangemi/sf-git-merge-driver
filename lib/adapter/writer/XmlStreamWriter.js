import { once } from 'node:events';
import { ANCESTOR_CONFLICT_MARKER, LOCAL_CONFLICT_MARKER, OTHER_CONFLICT_MARKER, SEPARATOR, } from '../../constant/conflictConstant.js';
import { SALESFORCE_EOL } from '../../constant/metadataConstant.js';
import { CDATA_PROP_NAME, NAMESPACE_ROOT, XML_COMMENT_PROP_NAME, XML_DECL, XML_INDENT, } from '../../constant/parserConstant.js';
import { isConflictBlock, } from '../../types/conflictBlock.js';
const TEXT_KEY = '#text';
const ATTR_PREFIX = '@_';
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
// XML-spec escapes pinned by the 15-cdata-closing and 19-btb-comments
// fixtures and mirror the current pipeline (orderedJs2Xml.js:86, 94-95).
const escapeCommentBody = (value) => value.replace(/--/g, '- -').replace(/-$/, '- ');
const escapeCdataBody = (value) => value.replace(/\]\]>/g, ']]]]><![CDATA[>');
// Values are emitted inside double quotes. A source attribute written with
// single quotes may legally hold a raw `"`, which would otherwise close the
// quote and let the rest of the value be read as markup. `&` is deliberately
// left alone: the parser never decodes entities on the way in, so re-encoding
// it here would corrupt values that already carry them.
// No "does it contain one?" fast path: skipping a replace that would not
// have matched is behaviourally invisible, so the branch could never be
// killed by a test.
const escapeAttrValue = (value) => value.replace(/"/g, '&quot;').replace(/</g, '&lt;');
// Hot path called once per element. The previous map().join('') form
// allocated an intermediate array of formatted strings; this push-and-
// concat loop avoids that allocation.
const attrsToString = (attrs) => {
    let s = '';
    for (let i = 0; i < attrs.length; i++) {
        const a = attrs[i];
        s += ` ${a[0]}="${escapeAttrValue(a[1])}"`;
    }
    return s;
};
// Declared here rather than next to writeRoot because writeConflict and
// writeChildren both use it as a default parameter value.
const EMPTY_ATTRS = [];
const buildConflictMarkers = (config) => {
    const size = config.conflictMarkerSize;
    return {
        local: `${SALESFORCE_EOL}${LOCAL_CONFLICT_MARKER.repeat(size)} ${config.localConflictTag}`,
        ancestor: `${ANCESTOR_CONFLICT_MARKER.repeat(size)} ${config.ancestorConflictTag}`,
        separator: SEPARATOR.repeat(size),
        other: `${OTHER_CONFLICT_MARKER.repeat(size)} ${config.otherConflictTag}`,
    };
};
const writeText = (st, value) => {
    st.buf += st.endedWithGt ? `${getIndent(st.depth)}${value}` : value;
    st.endedWithGt = false;
};
const writeCdata = (st, value) => {
    st.buf += st.endedWithGt
        ? `${getIndent(st.depth)}<![CDATA[${value}]]>`
        : `<![CDATA[${value}]]>`;
    st.endedWithGt = true;
};
const writeComment = (st, value) => {
    st.buf += `<!--${value}-->`;
    st.endedWithGt = true;
};
// `buildConflictMarkers` normalises a side with no content to a bare `{}`
// (see ConflictMarkerBuilder's `hasNoContent`), and `buildConflictBlock`
// wraps a non-array value as a single-element array — so "no content" on
// a conflict side is `[{}]`, not `[]`. Without this check, `[{}]` fell
// through to `writeChildren`, which iterates one object with zero own
// keys and appends nothing — leaving the marker for that side glued to
// the very next line with no newline in between (e.g. `||||||| base=======`).
// No separate `content.length === 0` check: `[].every(...)` is vacuously
// true, so an empty array already satisfies `.every()` on its own — a
// dedicated empty-array branch would never change the result.
const isBlankConflictSide = (content) => content.every(item => isObject(item) && Object.keys(item).length === 0);
const writeConflictContent = (st, content, markers, rootAttrs) => {
    // Empty side: emit the EOL placeholder so the marker pair stays on
    // its own line, matching the byte layout of the previous pipeline.
    // A blank side opens no element, so it never carries rootAttrs.
    if (isBlankConflictSide(content)) {
        writeText(st, SALESFORCE_EOL);
        return;
    }
    // Non-empty: iteration is identical to writeChildren (first-seen /
    // insertion-order recursion into writeElement). Delegate instead of
    // inlining the same loop — the two paths produce byte-equivalent
    // output; the conflict path inherits first-seen order through the
    // shared writeChildren.
    writeChildren(st, content, markers, rootAttrs);
};
const writeConflict = (st, block, markers, 
// Only a conflict block occupying the whole document receives the root
// attributes; nested conflict content is not a document root, so every
// other call site falls back to the default.
rootAttrs = EMPTY_ATTRS) => {
    // A conflict block can be the very first thing ever written (e.g. one
    // side deletes the whole file while the other edits it). The "first
    // top-level element" indent suppression is meant for a normal open tag
    // right after the XML declaration, not for content nested inside a
    // conflict side — consume it here so the first real element inside
    // block.ancestor/other still gets its newline+indent instead of gluing
    // onto the marker line above it.
    st.isFirstTopLevelAfterDecl = false;
    writeText(st, markers.local);
    writeConflictContent(st, block.local, markers, rootAttrs);
    writeText(st, markers.ancestor);
    writeConflictContent(st, block.ancestor, markers, rootAttrs);
    writeText(st, markers.separator);
    writeConflictContent(st, block.other, markers, rootAttrs);
    writeText(st, markers.other);
};
// Root attributes (xmlns* and every other attribute of the source root)
// reach the wire on whichever element occupies the root slot. Insertion order of the bucket is the
// source order the parser saw, so it is preserved verbatim.
const buildRootAttrs = (rootAttributes) => {
    const keys = Object.keys(rootAttributes);
    const built = new Array(keys.length);
    for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        built[k] = [key.slice(ATTR_PREFIX.length), String(rootAttributes[key])];
    }
    return built;
};
// Walk the compact merged tree and append serialized XML directly into
// `st.buf`. Replaces the old `emit()` + `formatChunks()` generator pair:
// one recursive function, no chunk objects, no generator state machines,
// no `for...of` over generators. Profile attributed ~40 % of serialize
// CPU to that pipeline.
const writeRoot = (st, compactRoot, rootAttributes, markers) => {
    st.buf += XML_DECL;
    // The root slot: whichever element opens the document carries the
    // root attributes, then the slot is spent. A whole-document ConflictBlock
    // spends it too — each of its non-blank sides renders a document root.
    let rootAttrs = buildRootAttrs(rootAttributes);
    for (let i = 0; i < compactRoot.length; i++) {
        const item = compactRoot[i];
        if (isConflictBlock(item)) {
            writeConflict(st, item, markers, rootAttrs);
            rootAttrs = EMPTY_ATTRS;
            continue;
        }
        // A top-level scalar opens no element, so it leaves the slot unspent
        // for the element that follows it.
        if (!isObject(item)) {
            writeText(st, String(item));
            continue;
        }
        const keys = Object.keys(item);
        for (let j = 0; j < keys.length; j++) {
            const tagName = keys[j];
            if (tagName === NAMESPACE_ROOT)
                continue;
            writeElement(st, tagName, item[tagName], rootAttrs, markers);
            rootAttrs = EMPTY_ATTRS;
        }
    }
};
// An element renders empty when every child produces no output. The only
// such child is empty text (`{ '#text': '' }`) — the shape a `''` or
// attr-only body collapses to in splitAttrsAndChildren, and what both
// `<tag/>` and `<tag></tag>` parse to via CompactXmlParser. An element with no
// children is empty too (`[].every` is vacuously true). `sf project retrieve`
// self-closes every empty element, so the writer matches that wire form.
const isEmptyElementBody = (children) => children.every(child => isObject(child) && child[TEXT_KEY] === '');
const writeElement = (st, name, body, extraAttrs, markers) => {
    if (name === TEXT_KEY) {
        writeText(st, String(body));
        return;
    }
    if (name === XML_COMMENT_PROP_NAME) {
        writeComment(st, escapeCommentBody(String(body)));
        return;
    }
    if (name === CDATA_PROP_NAME) {
        const cdataStr = Array.isArray(body) ? body.join('') : String(body);
        writeCdata(st, escapeCdataBody(cdataStr));
        return;
    }
    if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
        if (isConflictBlock(body)) {
            writeConflict(st, body, markers);
            return;
        }
    }
    const { attrs, children } = splitAttrsAndChildren(body);
    // Avoid the [...extraAttrs, ...attrs] allocation when extraAttrs is
    // empty (the common case — only the first top-level open tag carries
    // any extras). attrsToString itself handles concatenation.
    const attrStr = extraAttrs === EMPTY_ATTRS
        ? attrsToString(attrs)
        : attrsToString(extraAttrs) + attrsToString(attrs);
    const indent = st.isFirstTopLevelAfterDecl ? '' : getIndent(st.depth);
    st.isFirstTopLevelAfterDecl = false;
    // Empty elements self-close (`<tag/>`): `sf project retrieve` never emits
    // the expanded `<tag></tag>` form, so the merge output converges to its
    // byte shape. The trailing `>` leaves endedWithGt=true for the parent,
    // identical to the close-tag path below.
    if (isEmptyElementBody(children)) {
        st.buf += `${indent}<${name}${attrStr}/>`;
        st.endedWithGt = true;
        return;
    }
    st.buf += `${indent}<${name}${attrStr}>`;
    const parentDepth = st.depth;
    st.depth = parentDepth + 1;
    st.endedWithGt = false;
    writeChildren(st, children, markers);
    if (st.endedWithGt) {
        st.buf += `${getIndent(parentDepth)}</${name}>`;
    }
    else {
        st.buf += `</${name}>`;
    }
    st.depth = parentDepth;
    // Close-tag emission always leaves endedWithGt=true for the parent
    // frame regardless of the body's terminating chunk, so there is no
    // need to capture-and-restore the caller's value here.
    st.endedWithGt = true;
};
// Emit a (key, value) pair from a multi-key wrapper child by applying the
// parser-shape array-unfolding that splitAttrsAndChildren already applies
// on object bodies: an array value means N repeated `<tagName>` siblings,
// one per entry. Required because canonical merger output uses single-key
// wrappers, so a multi-key wrapper in writeChildren is always a
// parser-shape leak from a pass-through path (e.g. KeyedArrayMergeNode
// unmatched entries). Without this unfold the writer would invoke
// writeElement once with the array body, collapsing repeats into a
// single element with concatenated text content.
//
// Empty arrays still emit one empty element (matches the AncestorOnlyStrategy
// `{name: []}` contract); writeElement self-closes it as `<name/>`.
const writeUnfoldedChild = (st, tagName, value, markers) => {
    if (Array.isArray(value) &&
        value.length > 0 &&
        tagName !== CDATA_PROP_NAME &&
        tagName !== XML_COMMENT_PROP_NAME) {
        for (let i = 0; i < value.length; i++) {
            writeElement(st, tagName, value[i], EMPTY_ATTRS, markers);
        }
        return;
    }
    writeElement(st, tagName, value, EMPTY_ATTRS, markers);
};
const writeChildren = (st, children, markers, 
// Non-empty only when these children ARE a conflict side's content and
// that side occupies the document root; the head child then opens the
// side's root element. The multi-key branch below never receives them:
// a conflict side's head is always a single-key wrapper.
rootAttrs = EMPTY_ATTRS) => {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const attrs = i === 0 ? rootAttrs : EMPTY_ATTRS;
        if (isConflictBlock(child)) {
            writeConflict(st, child, markers, attrs);
            continue;
        }
        if (!isObject(child)) {
            writeText(st, String(child));
            continue;
        }
        const keys = Object.keys(child);
        if (keys.length === 1) {
            // Canonical merger output: single-key wrapper. Treat the value as
            // the body of one `<tagName>` element (writer semantic). An inner
            // parser-shape multi-key object is handled by the next recursion
            // into writeChildren via splitAttrsAndChildren / the multi-key
            // branch below.
            const tagName = keys[0];
            writeElement(st, tagName, child[tagName], attrs, markers);
            continue;
        }
        for (let j = 0; j < keys.length; j++) {
            const tagName = keys[j];
            writeUnfoldedChild(st, tagName, child[tagName], markers);
        }
    }
};
const splitAttrsAndChildren = (body) => {
    if (body === null || body === undefined) {
        return { attrs: [], children: [] };
    }
    if (typeof body !== 'object') {
        return { attrs: [], children: [{ [TEXT_KEY]: body }] };
    }
    if (Array.isArray(body)) {
        return { attrs: [], children: body };
    }
    const attrs = [];
    const childTags = [];
    for (const key of Object.keys(body)) {
        const value = body[key];
        if (key.startsWith(ATTR_PREFIX)) {
            attrs.push([key.slice(ATTR_PREFIX.length), String(value)]);
        }
        else if (Array.isArray(value) &&
            key !== CDATA_PROP_NAME &&
            key !== XML_COMMENT_PROP_NAME) {
            // Regular array values are the "repeated child element" pattern.
            // CDATA and comment arrays carry content, not repeated elements
            // (the parser splits CDATA segments on `]]>`; we keep the array
            // intact so emitElement can re-join with the escape pattern).
            for (const entry of value)
                childTags.push({ [key]: entry });
        }
        else {
            childTags.push({ [key]: value });
        }
    }
    return { attrs, children: childTags };
};
// Indent cache: depth is bounded (realistic Salesforce profiles reach
// depth 4–5). String.repeat is cheap but memoising once saves
// thousands of allocations on large documents.
const indentCache = [];
const getIndent = (depth) => {
    let cached = indentCache[depth];
    if (cached === undefined) {
        cached = `\n${XML_INDENT.repeat(depth)}`;
        indentCache[depth] = cached;
    }
    return cached;
};
// Design §6.3.3 line-state machine: strip horizontal whitespace before
// a marker on the same line (pass 1), drop whitespace-only lines
// (pass 2). Newline belongs to the line it terminates.
class ConflictLineFilter {
    buf = '';
    markers;
    constructor(config) {
        this.markers = [
            LOCAL_CONFLICT_MARKER.repeat(config.conflictMarkerSize),
            ANCESTOR_CONFLICT_MARKER.repeat(config.conflictMarkerSize),
            SEPARATOR.repeat(config.conflictMarkerSize),
            OTHER_CONFLICT_MARKER.repeat(config.conflictMarkerSize),
        ];
    }
    push(chunk) {
        // Always called from writeTo with FLUSH_BYTES (16 KiB) slices of the
        // serialized document, which contain at least one newline in any
        // realistic XML output (indent newlines come at every element). The
        // previous "no-newline fast path" went dead once the per-chunk
        // generator pipeline was replaced by buffered serialization.
        const out = [];
        let working = chunk;
        while (true) {
            const nl = working.indexOf('\n');
            if (nl < 0) {
                this.buf += working;
                break;
            }
            this.buf += working.slice(0, nl);
            this.flushLine(out, true);
            working = working.slice(nl + 1);
        }
        return out.join('');
    }
    end() {
        // Always flush the tail: in the normal flow the document ends
        // mid-line (e.g., `</Root>` with no trailing newline), so buf
        // carries residual content. flushLine is a no-op when buf is
        // empty (blank-line branch drops it), so this stays correct.
        const out = [];
        this.flushLine(out, false);
        return out.join('');
    }
    flushLine(out, withNewline) {
        let line = this.buf;
        this.buf = '';
        // Pass 1: strip horizontal whitespace directly before a marker on
        // this line. Mirrors ConflictMarkerFormatter.indentRegex semantics.
        const leadingWs = /^([ \t]+)(.*)$/.exec(line);
        if (leadingWs !== null &&
            this.markers.some(m => leadingWs[2].startsWith(m))) {
            line = leadingWs[2];
        }
        // Pass 2: drop whitespace-only lines (including their '\n').
        if (/^[ \t]*$/.test(line))
            return;
        out.push(withNewline ? `${line}\n` : line);
    }
}
// Rewrite LF → target EOL at byte level. Kept orthogonal per §6.3.4.
const applyEol = (piece, eol) => eol === '\n' ? piece : piece.replace(/\r?\n/g, eol);
// Flush threshold for the write-side accumulator. Matches the default
// Node stream high-water-mark (16 KiB); batching up to that means we
// call `out.write` at most once per high-water-mark window instead of
// once per emitted chunk. Each `out.write` emits `'data'`, runs the
// high-water-mark check, and may schedule a drain — per-call overhead
// that dominates serialize CPU on small documents when the sink is
// already in memory. A larger batch would amortise more but would also
// inflate peak working set; 16 KiB is the smallest size that keeps
// `write` cheap AND preserves streaming semantics.
const FLUSH_BYTES = 16 * 1024;
// Single trailing newline appended to every non-empty document so the merge
// driver's byte output matches `sf project retrieve` (metadata XML ends in a
// newline). applyEol rewrites it to the target EOL.
const TRAILING_NEWLINE = '\n';
export class XmlStreamWriter {
    config;
    constructor(config) {
        this.config = config;
    }
    async writeTo(out, ordered, rootAttributes, eol = '\n', hasConflict = true) {
        if (ordered.length === 0)
            return;
        // Pipelined: each formatted string flows emit → format → (filter) →
        // accumulator → eol → out.write. The accumulator batches filter
        // output into FLUSH_BYTES windows before calling out.write — without
        // it, a document emitting N chunks pays N `out.write()` calls.
        //
        // When the merge produced no conflicts, the ConflictLineFilter has
        // nothing to do (its only job is to clean indentation and blank
        // lines around marker tokens, none of which are emitted). Skipping
        // it removes ~20 % of serialize CPU on conflict-free documents
        // (newline scan + two regexes per line).
        const markers = buildConflictMarkers(this.config);
        const st = {
            buf: '',
            depth: 0,
            endedWithGt: false,
            isFirstTopLevelAfterDecl: true,
        };
        writeRoot(st, ordered, rootAttributes, markers);
        // Trailing newline: `sf project retrieve` (via source-deploy-retrieve)
        // writes metadata XML ending in a newline, so we converge to that byte
        // shape (see TRAILING_NEWLINE). Appended to the finished document AFTER
        // the conflict filter has flushed the closing tag (the filter still ends
        // mid-line, as before), and applyEol rewrites it to the target EOL. The
        // `ordered.length === 0` short-circuit above means an empty document
        // still emits nothing.
        // For the conflict-free hot path, the entire document is built in
        // st.buf as a single string; one applyEol pass + at most one
        // out.write. The intermediate FLUSH_BYTES batching matters only
        // when ConflictLineFilter is in play (it splits chunks line-by-line
        // and we re-emit incrementally).
        if (!hasConflict) {
            const final = applyEol(`${st.buf}${TRAILING_NEWLINE}`, eol);
            if (!out.write(final)) {
                await once(out, 'drain');
            }
            return;
        }
        // Conflict path: re-stream st.buf through the line filter in
        // FLUSH_BYTES windows so we don't buffer the entire document twice
        // (once in st.buf, once in the filter).
        const filter = new ConflictLineFilter(this.config);
        let batch = '';
        const flush = async () => {
            const final = applyEol(batch, eol);
            batch = '';
            if (!out.write(final)) {
                await once(out, 'drain');
            }
        };
        for (let i = 0; i < st.buf.length; i += FLUSH_BYTES) {
            // Empty-filter-output is permitted (a slice that became all-blank
            // after pass-2 drops returns ''); appending '' is a cheap no-op
            // and keeps the loop branch-free.
            batch += filter.push(st.buf.slice(i, i + FLUSH_BYTES));
            if (batch.length >= FLUSH_BYTES)
                await flush();
        }
        batch += filter.end();
        batch += TRAILING_NEWLINE;
        await flush();
    }
}
//# sourceMappingURL=XmlStreamWriter.js.map