import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Is `nodeId` inside the subtree rooted at `parentId`?
 *
 * Walks the parent chain UP from `nodeId` and returns `true` as soon as it
 * reaches `parentId`. The check is STRICT (a node is not its own descendant):
 * `isSubtreeNode(core, x, x)` is `false`. To treat the node as part of its own
 * subtree, short-circuit at the call site (`nodeId === parentId || isSubtreeNode(...)`).
 *
 * Returns `false` — never throws — when `nodeId` is missing/unknown or when the
 * walk reaches a root (parent null/absent) without hitting `parentId`. This is
 * the inverse-direction companion to the typed `getParent*` lookups: instead of
 * finding an ancestor, it answers whether a specific ancestor is present.
 *
 * Relies on the scene-graph tree invariant (no cycles), matching the shared
 * {@link getParentByCondition} walk it builds on.
 */
declare const isSubtreeNode: (core: CoreDesigner, nodeId: UUID, parentId: UUID) => boolean;
export default isSubtreeNode;
