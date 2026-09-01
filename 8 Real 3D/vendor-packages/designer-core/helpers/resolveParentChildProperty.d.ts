import type { CoreDesigner } from '..';
import { childrenProperties, singleChildProperties } from '../components/Node/helpers/childrenProperties';
import { UUID } from '../declarations';
export type ResolveParentChildPropertyResult = {
    parentId: UUID;
    childProperty: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number];
    /** Present when `childProperty` is a list on the parent: index of `nodeId` in that list. */
    index?: number;
};
/**
 * Finds which property on the parent holds `nodeId`, using the same rules as
 * `removeNodeRecursive` in CreateNodeCommand (children list scan, then single-child scan).
 */
export declare function resolveParentChildProperty(core: CoreDesigner, nodeId: UUID): ResolveParentChildPropertyResult;
