import { Node } from '../../../components/Node';
import { CalculationEntryBase } from '../../../declarations/calculation';
import { CoreDesigner } from '../../../designer-core';
/** Read a node's `name` property, or '' if the node carries no `properties` map. */
export declare const nodeName: (node: Node) => string;
/**
 * Common identity fields for a calculation line. `itemId` is the nearest
 * ancestor `Item` (via `getOptionalParentItem`) — the core analogue of vesta's
 * `getSceneObject(id).getItem()`; falls back to the direct parent when the node
 * is not under an Item (e.g. isolated unit-test nodes). `itemNumber` starts empty
 * and is assigned during per-project grouping.
 */
export declare const baseEntry: (core: CoreDesigner, node: Node) => CalculationEntryBase;
