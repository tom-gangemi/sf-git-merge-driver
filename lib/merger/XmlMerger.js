import { __decorate } from "tslib";
import { CompactXmlParser } from '../adapter/parser/CompactXmlParser.js';
import { XmlStreamWriter } from '../adapter/writer/XmlStreamWriter.js';
import { log } from '../utils/LoggingDecorator.js';
import { Logger } from '../utils/LoggingService.js';
import { JsonMerger } from './JsonMerger.js';
// Every root attribute — the xmlns* declarations and any other, such as
// `xsi:schemaLocation` — lives in a bucket parsed separately from `content`
// (see scanDocument's bucketRootAttrs) and never reaches MergeOrchestrator,
// so it needs its own three-way resolution instead of inheriting one for
// free. Per key: unchanged-on-one-side defers to whatever the other side
// did (add, change or remove); both sides agreeing (including both
// removing it) keeps that agreement. An attribute value has no way to carry
// zdiff3 markers without producing invalid XML (`xmlns="<<<<<<< ours..."`),
// so a genuine three-way divergence — all three different, no pair
// agreeing — can't become a real conflict; it keeps `local` (protects the
// developer's own change from being silently overwritten by `other`,
// unlike the previous `Object.assign({}, ancestor, local, other)` which
// always let `other` win even when only `local` had changed) and logs so
// the discarded alternative isn't completely invisible.
const resolveRootAttributeValue = (key, ancestor, local, other) => {
    if (ancestor === local)
        return other; // only other changed (added/edited/removed)
    if (ancestor === other)
        return local; // only local changed
    if (local === other)
        return local; // both changed to the same value
    // Genuine three-way divergence, no pair agreeing: keep local and log —
    // see the function-level comment for why this can't become a real
    // conflict.
    Logger.warn(`root attribute divergence on ${key}; keeping local`, {
        ancestor,
        local,
        other,
    });
    return local;
};
const mergeRootAttributes = (ancestor, local, other) => {
    const keys = new Set([
        ...Object.keys(ancestor),
        ...Object.keys(local),
        ...Object.keys(other),
    ]);
    const result = {};
    for (const key of keys) {
        const resolved = resolveRootAttributeValue(key, ancestor[key], local[key], other[key]);
        if (resolved !== undefined)
            result[key] = resolved;
    }
    return result;
};
// A side that dropped the whole file carries an empty root-attribute bucket
// for the trivial reason that it has no root element to carry them on — not
// because it removed them. Reading that emptiness as a removal erases an
// attribute (typically the xmlns) the surviving side still declares. The ancestor is never
// substituted: a rootless ancestor is the "file added on both sides" case,
// where an empty bucket genuinely means the attribute did not exist before.
// `content` is empty exactly when the document has no root element.
const rootAttributesOf = (side, ancestor) => Object.keys(side.content).length > 0
    ? side.rootAttributes
    : ancestor.rootAttributes;
// When the JSON merge yields no output but BOTH live sides (ours and theirs)
// still carry the root element, rebuild it as an empty element
// (<Root/>) so an empty-bodied root round-trips instead of blanking the
// file — a blank file is never valid Salesforce metadata (e.g. an identity
// merge of <SharingRules xmlns="..."/>, which parses to { SharingRules: '' }
// and collapses to no output). Requiring the root on BOTH live sides is
// deliberate: if either side dropped the file entirely (empty document, no
// root key) the deletion stands and nothing is emitted — the driver must
// never resurrect a file a side deleted, nor invent a root from the side
// that left it untouched. The parser guarantees each content object holds at
// most the single root key, so the two live sides' root tags match.
const preserveEmptyRoot = (local, other) => {
    const [localRoot] = Object.keys(local);
    const [otherRoot] = Object.keys(other);
    return localRoot !== undefined && otherRoot !== undefined
        ? [{ [localRoot]: '' }]
        : [];
};
export class XmlMerger {
    parser;
    writer;
    jsonMerger;
    constructor(config) {
        this.parser = new CompactXmlParser();
        this.writer = new XmlStreamWriter(config);
        this.jsonMerger = new JsonMerger(config);
    }
    async mergeThreeWay(ancestor, ours, theirs, out, eol = '\n') {
        // allSettled guarantees every parseStream promise terminates (by
        // success OR failure) before we rethrow. Matches the fd-release
        // pattern documented in MergeDriver.ts and protects Windows from
        // ENOTEMPTY on still-open handles.
        const results = await Promise.allSettled([
            this.parser.parseStream(ancestor),
            this.parser.parseStream(ours),
            this.parser.parseStream(theirs),
        ]);
        const failure = results.find(r => r.status === 'rejected');
        if (failure)
            throw failure.reason;
        const [anc, local, other] = results.map(r => r.value);
        const rootAttributes = mergeRootAttributes(anc.rootAttributes, rootAttributesOf(local, anc), rootAttributesOf(other, anc));
        const mergedResult = this.jsonMerger.mergeThreeWay(anc.content, local.content, other.content);
        const output = mergedResult.output.length > 0
            ? mergedResult.output
            : preserveEmptyRoot(local.content, other.content);
        // writeTo short-circuits on an empty array, so no guard is needed here:
        // an empty merge result emits zero bytes either way.
        await this.writer.writeTo(out, output, rootAttributes, eol, mergedResult.hasConflict);
        return { hasConflict: mergedResult.hasConflict };
    }
}
__decorate([
    log('XmlMerger')
], XmlMerger.prototype, "mergeThreeWay", null);
//# sourceMappingURL=XmlMerger.js.map