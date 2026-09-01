import { UUID } from '../../declarations';
import { ItemCalculation, NodeCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
export interface CollectedCalculations {
    /** Item uuid → item shell whose `calculations` list is filled during the walk. */
    perItemById: Map<UUID, ItemCalculation>;
    /** Flat list of every emitted node slice, for project-level grouping. */
    perProject: NodeCalculation[];
    /** Closet / multiCloset item ids — their parts are reported in `perPart`, not here. */
    closetItemIds: UUID[];
}
/**
 * Walk the scene subtree from `core.rootId` (via `traverseNode`, NOT the flat
 * `core.nodes` map) and collect a calculation slice per buildable node.
 *
 * `traverseNode` visits a node before its children, so an `Item` is always in
 * `perItemById` before its descendants are routed into it via `getOptionalParentItem`.
 * Closet / multiCloset items (and their subtrees) are excluded here — their ids are
 * returned for the `perPart` pass. HideInCalculation items are excluded entirely.
 */
export declare const collectNodeCalculations: (core: CoreDesigner) => CollectedCalculations;
