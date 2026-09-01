import { IObjects, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Collects `toJSON()` for every node reachable from `rootId` via `childrenProperties` and
 * `singleChildProperties` only (same graph as CreateNodeCommand / RemoveNodeCommand).
 *
 * References to nodes outside this set (e.g. Room.path / holes → Stage-owned segments) are
 * unchanged in the serialized configs.
 */
export declare function collectSubtreeObjects(core: CoreDesigner, rootId: UUID): IObjects;
/** Replaces any string value that appears as a key in `oldToNew` with the mapped UUID. */
export declare function remapConfigUuidsDeep(value: unknown, oldToNew: ReadonlyMap<UUID, UUID>): unknown;
export declare function remapSubtreeToNewIds(objects: IObjects, sourceRootId: UUID): {
    objects: IObjects;
    newRootId: UUID;
} | null;
