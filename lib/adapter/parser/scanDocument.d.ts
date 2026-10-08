import type { NormalisedParseResult } from '../XmlParser.js';
export type ScanOutcome = {
    readonly kind: 'parsed';
    readonly result: NormalisedParseResult;
    readonly needsOracle: boolean;
} | {
    readonly kind: 'failed';
    readonly message: string;
};
export declare const scanDocument: (xml: string) => ScanOutcome;
