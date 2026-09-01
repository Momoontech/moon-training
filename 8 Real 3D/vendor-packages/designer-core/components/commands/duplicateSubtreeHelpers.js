import { generateId } from '../../helpers/id.js';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties.js';

/**
 * Collects `toJSON()` for every node reachable from `rootId` via `childrenProperties` and
 * `singleChildProperties` only (same graph as CreateNodeCommand / RemoveNodeCommand).
 *
 * References to nodes outside this set (e.g. Room.path / holes → Stage-owned segments) are
 * unchanged in the serialized configs.
 */
function collectSubtreeObjects(core, rootId) {
    const objects = {};
    const visit = (id) => {
        if (id in objects) {
            return;
        }
        const node = core.nodes.get(id);
        if (!node) {
            return;
        }
        objects[id] = node.toJSON();
        for (const prop of childrenProperties) {
            if (prop in node) {
                const children = node[prop].get();
                if (children?.length) {
                    for (const childId of children) {
                        visit(childId);
                    }
                }
            }
        }
        for (const prop of singleChildProperties) {
            if (prop in node) {
                const child = node[prop].get();
                if (child) {
                    visit(child);
                }
            }
        }
    };
    visit(rootId);
    return objects;
}
/** Replaces any string value that appears as a key in `oldToNew` with the mapped UUID. */
function remapConfigUuidsDeep(value, oldToNew) {
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value === 'string') {
        const mapped = oldToNew.get(value);
        return mapped !== undefined ? mapped : value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => remapConfigUuidsDeep(item, oldToNew));
    }
    if (typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = remapConfigUuidsDeep(v, oldToNew);
        }
        return out;
    }
    return value;
}
function remapSubtreeToNewIds(objects, sourceRootId) {
    const oldIds = Object.keys(objects);
    if (oldIds.length === 0 || !(sourceRootId in objects)) {
        return null;
    }
    const oldToNew = new Map();
    for (const oid of oldIds) {
        oldToNew.set(oid, generateId());
    }
    const newRootId = oldToNew.get(sourceRootId);
    if (!newRootId) {
        return null;
    }
    const newObjects = {};
    for (const oldId of oldIds) {
        const newId = oldToNew.get(oldId);
        const cloned = JSON.parse(JSON.stringify(objects[oldId]));
        const remapped = remapConfigUuidsDeep(cloned, oldToNew);
        remapped.uuid = newId;
        newObjects[newId] = remapped;
    }
    return { objects: newObjects, newRootId };
}

export { collectSubtreeObjects, remapConfigUuidsDeep, remapSubtreeToNewIds };
