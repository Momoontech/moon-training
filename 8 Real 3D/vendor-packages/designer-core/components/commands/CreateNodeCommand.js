import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType, RoomType } from '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getClosetSystemId, getSystemStatusCommandOnClosetRemoved } from '../../helpers/multiCloset/systemStatus.js';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties.js';
import createNode from '../Node/helpers/createNode.js';
import getNode from '../Node/helpers/getNode.js';

class CreateNodeCommand {
    objects;
    nodeId;
    parentId;
    childProperty;
    insertIndex;
    constructor(objects, nodeId, parentId, childProperty = 'children', 
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    insertIndex) {
        this.objects = objects;
        this.nodeId = nodeId;
        this.parentId = parentId;
        this.childProperty = childProperty;
        this.insertIndex = insertIndex;
    }
    execute(core) {
        const object = JSON.parse(JSON.stringify(this.objects[this.nodeId]));
        const childrenPropertiesValues = {};
        const singleChildPropertiesValues = {};
        //remove all children properties from node config, replacing by null or empty array, save children props for next access
        for (const prop of childrenProperties) {
            if (prop in object) {
                if (!childrenPropertiesValues[prop]) {
                    childrenPropertiesValues[prop] = [];
                }
                childrenPropertiesValues[prop] = [...object[prop]];
                object[prop] = [];
            }
        }
        for (const prop of singleChildProperties) {
            if (prop in object) {
                singleChildPropertiesValues[prop] = object[prop];
                object[prop] = null;
            }
        }
        //create node with all children properties empty
        const node = createNode({ ...object, parent: this.parentId }, core);
        //add node to its parentId
        if (this.parentId) {
            const parent = getNode(core, this.parentId);
            if (parent) {
                if (childrenProperties.includes(this.childProperty)) {
                    const siblings = parent[this.childProperty].get();
                    let next;
                    if (this.insertIndex !== undefined) {
                        const at = Math.max(0, Math.min(this.insertIndex, siblings.length));
                        next = [...siblings.slice(0, at), node.id, ...siblings.slice(at)];
                    }
                    else {
                        next = [...siblings, node.id];
                    }
                    parent[this.childProperty].set(next);
                }
                else {
                    parent[this.childProperty].set(node.id);
                }
            }
        }
        //recursively add children to node
        for (const prop of childrenProperties) {
            if (childrenPropertiesValues[prop]) {
                for (const child of childrenPropertiesValues[prop]) {
                    core.runCommandsAsTransaction(new CreateNodeCommand(this.objects, child, node.id, prop), '', false);
                }
            }
        }
        for (const prop of singleChildProperties) {
            if (singleChildPropertiesValues[prop]) {
                core.runCommandsAsTransaction(new CreateNodeCommand(this.objects, singleChildPropertiesValues[prop], node.id, prop), '', false);
            }
        }
        return true;
    }
    undo(core) {
        core.runCommandsAsTransaction(new RemoveNodeCommand(this.nodeId), '', false);
        return true;
    }
}
const removeNodeRecursive = (core, id) => {
    let objects = {};
    let childProperty = 'children';
    const node = getNode(core, id);
    objects[id] = node.toJSON();
    const parentId = node.parent.get();
    let parent = null;
    if (parentId) {
        parent = getNode(core, parentId);
    }
    for (let i = childrenProperties.length - 1; i >= 0; i -= 1) {
        const property = childrenProperties[i];
        if (property in node) {
            const children = node[property].get();
            if (children) {
                for (let i = 0; i < children.length; i += 1) {
                    const command = new RemoveNodeCommand(children[i]);
                    core.runCommandsAsTransaction(command, '', false);
                    objects = { ...objects, ...command.objects };
                }
            }
        }
        if (parent && property in parent && parent[property].get()) {
            if (parent[property].get().includes(id)) {
                childProperty = property;
            }
        }
    }
    for (let i = singleChildProperties.length - 1; i >= 0; i -= 1) {
        const property = singleChildProperties[i];
        if (property in node) {
            const child = node[property].get();
            if (child) {
                const command = new RemoveNodeCommand(child);
                core.runCommandsAsTransaction(command, '', false);
                objects = { ...objects, ...command.objects };
            }
        }
        if (parent && property in parent && parent[property].get()) {
            if (parent[property].get() === id) {
                childProperty = property;
            }
        }
    }
    if (parent && !childProperty)
        return { objects, parentId: parent.id, childProperty, result: false };
    // Cascade-remove the dependent `Room` (`roomType: reachInCloset`) owned by
    // a `reachInCloset` Item so the room never outlives its owner. The
    // dependent Room is a sibling under the Stage, not a child of the closet,
    // so it isn't picked up by the recursive child walk above. We dispatch
    // here — inside the same outer transaction that's removing the closet —
    // so both removals collapse into a single undo step. On undo, the closet
    // snapshot (already in `objects`) carries `roomId`, the closet is
    // recreated first, then the dependent Room is recreated by its own
    // `RemoveNodeCommand.undo`. The closet's effect tolerates the brief
    // window where its `roomId` references a not-yet-recreated Room.
    if (node.type === NodeType.Item && node.itemType.get() === ItemType.reachInCloset && node.roomId) {
        const dependentRoomId = node.roomId.get();
        if (dependentRoomId) {
            const command = new RemoveNodeCommand(dependentRoomId);
            core.runCommandsAsTransaction(command, '', false);
            objects = { ...objects, ...command.objects };
        }
    }
    // Cascade-remove the path `RoomSegment`s and the `Point`s they reference
    // when removing a dependent Room (`roomType: reachInCloset`). These nodes
    // are parented to the Stage (siblings of the Room), not children of it,
    // so the recursive child walk above leaves them orphaned — visible as
    // ghost walls and corner points after the owning closet is undone or
    // deleted. Unlike user-drawn rooms, a reach-in-closet room has dedicated
    // segments/points (provisioned together by
    // `createDependentRoomForReachInCloset`); they are never shared with
    // neighbouring rooms, so unconditional removal is safe. On undo the
    // segment + point snapshots are merged into the outer
    // `RemoveNodeCommand.objects`, and each cascaded `RemoveNodeCommand`'s
    // own `undo` recreates them inside the same restored undo step.
    if (node.type === NodeType.Room && 'roomType' in node && node.roomType.get() === RoomType.reachInCloset) {
        const path = node.path.get();
        const pointIds = new Set();
        for (let i = 0; i < path.length; i += 1) {
            try {
                const seg = getNode(core, path[i]);
                if (seg.type === NodeType.RoomSegment) {
                    // CCW polygon: each Point appears as `from` in exactly one segment.
                    pointIds.add(seg.from.get());
                }
            }
            catch {
                // Stale path reference (mid-rebuild / mid-undo) — skip.
            }
        }
        for (let i = 0; i < path.length; i += 1) {
            const command = new RemoveNodeCommand(path[i]);
            core.runCommandsAsTransaction(command, '', false);
            objects = { ...objects, ...command.objects };
        }
        for (const pointId of pointIds) {
            const command = new RemoveNodeCommand(pointId);
            core.runCommandsAsTransaction(command, '', false);
            objects = { ...objects, ...command.objects };
        }
    }
    node.dispose();
    return { objects, parentId, childProperty, result: true };
};
class RemoveNodeCommand {
    id;
    objects = {};
    childProperty = 'children';
    parentId;
    /**
     * Demotion applied when this removal emptied a multiCloset system, retained so `undo` can put
     * the system's previous status back. `null` whenever the removed node was not the last closet
     * of a system (which is every removal except a closet delete).
     */
    statusCommand = null;
    constructor(id) {
        this.id = id;
    }
    execute(core) {
        // Read the system assignment BEFORE the removal: `removeNodeRecursive` ends in
        // `node.dispose()` → `core.unregisterNode`, after which the node is unreachable.
        const systemId = getClosetSystemId(core, this.id);
        const { objects, parentId, childProperty, result } = removeNodeRecursive(core, this.id);
        this.objects = objects;
        this.parentId = parentId;
        this.childProperty = childProperty;
        // Now that the node is out of `core.nodeIds`, an empty `getNodesBySystem` genuinely means
        // this was the system's last closet — so the system goes back to `Draft`.
        this.statusCommand = systemId ? getSystemStatusCommandOnClosetRemoved(core, systemId) : null;
        if (this.statusCommand)
            core.runCommandsAsTransaction(this.statusCommand, '', false);
        return result;
    }
    undo(core) {
        core.runCommandsAsTransaction(new CreateNodeCommand(this.objects, this.id, this.parentId, this.childProperty), '', false);
        // Restore the status only after the closet is back. A system that had advanced past `Plot`
        // (e.g. `Design`) must return to that status, not to the `Plot` a re-add would produce.
        this.statusCommand?.undo(core);
        return true;
    }
}

export { CreateNodeCommand, RemoveNodeCommand };
