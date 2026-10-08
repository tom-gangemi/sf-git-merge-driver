import type { Readable } from 'node:stream';
import type { NormalisedParseResult, XmlParser } from '../XmlParser.js';
export declare class CompactXmlParser implements XmlParser {
    parseString(xml: string): NormalisedParseResult;
    parseStream(source: Readable): Promise<NormalisedParseResult>;
}
