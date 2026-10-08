import type { Writable } from 'node:stream';
import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonArray, JsonObject } from '../../types/jsonTypes.js';
import type { XmlSerializer } from '../XmlSerializer.js';
export declare class XmlStreamWriter implements XmlSerializer {
    private readonly config;
    constructor(config: MergeConfig);
    writeTo(out: Writable, ordered: JsonArray, rootAttributes: JsonObject, eol?: '\n' | '\r\n', hasConflict?: boolean): Promise<void>;
}
