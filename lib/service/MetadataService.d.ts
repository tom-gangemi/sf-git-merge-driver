import type { JsonValue } from '../types/jsonTypes.js';
export declare class MetadataService {
    static getKeyFieldExtractor(metadataType: string): ((el: JsonValue) => string) | undefined;
    static isOrderedAttribute(attribute: string): boolean;
    static isTextArrayAttribute(attribute: string): boolean;
}
