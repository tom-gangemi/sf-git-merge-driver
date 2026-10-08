import { ATTR_PREFIX, TEXT_TAG } from '../../constant/parserConstant.js';
// Stryker disable next-line ObjectLiteral: an empty bag reads as no attributes: for-in over undefined is a no-op
export const NO_ATTRS = Object.freeze({
    attrs: Object.freeze(Object.create(null)),
    hasAttrs: false,
});
// Per-open-element accumulator the scanner pushes on `<name` and pops
// on the matching close. `grouped` stays undefined until the first
// element, comment or CDATA child arrives, so a leaf — the dominant
// node shape in Salesforce metadata — never allocates a Map.
export class ElementFrame {
    name;
    attrs;
    hasAttrs;
    textBuf = '';
    grouped;
    constructor(name, { attrs, hasAttrs }) {
        this.name = name;
        this.attrs = attrs;
        this.hasAttrs = hasAttrs;
    }
    addText(text) {
        this.textBuf += text;
    }
    addChild(key, value) {
        if (this.grouped === undefined)
            this.grouped = new Map();
        const existing = this.grouped.get(key);
        if (existing === undefined) {
            this.grouped.set(key, [value]);
        }
        else {
            existing.push(value);
        }
    }
    toCompact() {
        if (!this.hasAttrs && this.grouped === undefined) {
            return this.textBuf;
        }
        const out = Object.create(null);
        this.writeAttrsInto(out);
        this.writeGroupedInto(out);
        this.writeTextInto(out);
        return out;
    }
    writeAttrsInto(out) {
        for (const k in this.attrs)
            out[`${ATTR_PREFIX}${k}`] = this.attrs[k];
    }
    writeGroupedInto(out) {
        if (this.grouped === undefined)
            return;
        for (const [tag, values] of this.grouped) {
            out[tag] = values.length === 1 ? values[0] : values;
        }
    }
    // An element with attributes but no children still carries `#text: ''`.
    writeTextInto(out) {
        if (this.textBuf !== '' || this.grouped === undefined) {
            out[TEXT_TAG] = this.textBuf;
        }
    }
}
//# sourceMappingURL=ElementFrame.js.map