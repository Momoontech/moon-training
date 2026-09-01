import { Node } from '../../components/Node';
import { ItemCalculation, NodeCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Per-node calculation dispatcher: maps a node to its BOM slice (or, for an
 * `Item`, the item-level shell). Returns `null` for node types that emit no
 * calculation. No methods live on the Node classes — all logic is in these
 * standalone helpers, dispatched here by `node.type`.
 *
 * Phase-2 node types (Countertop / ToeKickPanel / Valance / CrownMolding /
 * Molding) return `null` for now — they need sibling merge-groups and built
 * geometry that core does not retain. Adding them later does not change the
 * public API or the category types.
 */
export declare const getCalculation: (core: CoreDesigner, node: Node) => NodeCalculation | ItemCalculation | null;
