import type { JsonValue } from '../../types/jsonTypes.js';
import type { MergeNode } from './MergeNode.js';
export interface MergeNodeFactory {
    createNode(ancestor: JsonValue | undefined, local: JsonValue | undefined, other: JsonValue | undefined, attribute: string): MergeNode;
}
type Side = JsonValue | undefined;
export declare const isAttributedTrio: (ancestor: Side, local: Side, other: Side) => boolean;
declare class DefaultMergeNodeFactory implements MergeNodeFactory {
    createNode(ancestor: Side, local: Side, other: Side, attribute: string): MergeNode;
}
export declare const defaultNodeFactory: DefaultMergeNodeFactory;
export {};
