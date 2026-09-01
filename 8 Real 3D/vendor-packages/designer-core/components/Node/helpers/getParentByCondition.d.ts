import type { Node } from '..';
import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Walk up the parent chain from `nodeId` — inclusive of the node itself — and
 * return the first node that satisfies `condition`.
 *
 * Returns `undefined` when no node in the chain matches (the walk ends at a root
 * whose parent is null/absent). This is the shared loop behind the typed
 * ancestor lookups (e.g. {@link getSystemById}); pass a predicate to specialise
 * it instead of re-writing the `while` walk each time.
 */
declare const getParentByCondition: (core: CoreDesigner, nodeId: UUID, condition: (node: Node) => boolean) => Node | undefined;
export default getParentByCondition;
