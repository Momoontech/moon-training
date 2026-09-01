import Value from './index.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import { V3Axes, VectorProps } from '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
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
import '../../helpers/id.js';
import '../Node/components/AdjustableBox/index.js';
import '../Node/components/AdjustableExtrusion/index.js';
import '../Node/components/BoxContainer/index.js';
import '../Node/components/Carcass/index.js';
import '../Node/components/Ceiling2D/index.js';
import '../Node/components/Countertop/index.js';
import '../Node/components/CrownMolding/index.js';
import '../Node/components/Edgebanding/index.js';
import '../Node/components/Floor2D/index.js';
import '../Node/components/Frame/index.js';
import '../Node/components/FreeBoxContainer/index.js';
import '../Node/components/GateFrame/index.js';
import '../Node/components/Glass/index.js';
import '../Node/components/Image/index.js';
import '../Node/components/Item/index.js';
import '../Node/components/LaminateBox/index.js';
import '../Node/components/MiteredPanel/index.js';
import '../Node/BaseModel.js';
import '../Node/components/Molding/index.js';
import '../Node/components/MountLine/index.js';
import '../Node/components/MountPlane/index.js';
import '../Node/components/MountPoint/index.js';
import '../Node/components/Panel/index.js';
import '../Node/components/Part/index.js';
import '../Node/components/Point/index.js';
import '../Node/components/PointLight/index.js';
import '../Node/components/RawPanel/index.js';
import '@preact/signals-react';
import '../../helpers/cathedral/computeCathedralContext.js';
import getNode from '../Node/helpers/getNode.js';
import '../Node/components/ShapedBoxContainer/index.js';
import '../Node/components/SpotLight/index.js';
import '../Node/components/Tiles/index.js';
import '../Node/components/ToeKickPanel/index.js';
import '../Node/components/Valance/index.js';
import '../Node/components/Wall2D/index.js';
import '../Node/components/WindowFrame/index.js';
import getParentItem from '../Node/helpers/getParentItem.js';
import '../../helpers/math/plane/unitBoxCorners.js';
import '../../helpers/math/plane/projectUnitBoxToFootprint2D.js';
import getOptionalParentRoom from '../Node/helpers/getOptionalParentRoom.js';
import '../commands/core/Command.js';
import '../../helpers/getMultiClosetJointTarget.js';
import SetNodeAttributeValueCommand from '../commands/SetNodeAttributeValueCommand.js';
import SetValueCommand from '../commands/SetValueCommand.js';
import SetNodePropertyValueCommand from '../commands/SetNodePropertyValueCommand.js';
import SetNodeVector3Command from '../commands/SetNodeVector3Command.js';
import SetProjectAttributeValueCommand from '../commands/SetProjectAttributeValueCommand.js';

/**
 * Walk a `projectSetting.<path>` from `core.projectSettings`. The tree mixes
 * `Value` wrappers, `Map`s, and plain holders; three leaf shapes:
 *   1. parent is a `Value<object>` — spread + set the whole shape.
 *   2. parent is a `Map` whose entry is a `Value<T>` — set that Value.
 *   3. parent is a plain holder whose property is a `Value<T>` — set it.
 */
const buildProjectSettingWrite = (core, path, raw) => {
    if (path.length === 0)
        return null;
    let cursor = core.projectSettings;
    for (let i = 0; i < path.length - 1; i++) {
        if (cursor instanceof Value)
            cursor = cursor.get();
        if (cursor == null)
            return null;
        if (cursor instanceof Map) {
            cursor = cursor.get(path[i]);
            continue;
        }
        if (typeof cursor !== 'object')
            return null;
        cursor = cursor[path[i]];
    }
    const leafKey = path[path.length - 1];
    if (cursor instanceof Value) {
        const current = cursor.get();
        if (current == null || typeof current !== 'object' || Array.isArray(current))
            return null;
        return new SetValueCommand(cursor, { ...current, [leafKey]: raw });
    }
    if (cursor instanceof Map) {
        const leaf = cursor.get(leafKey);
        if (leaf instanceof Value) {
            return new SetValueCommand(leaf, raw);
        }
        return null;
    }
    if (typeof cursor === 'object' && cursor !== null) {
        const leaf = cursor[leafKey];
        if (leaf instanceof Value) {
            return new SetValueCommand(leaf, raw);
        }
    }
    return null;
};
/**
 * Symmetric write counterpart to `evaluateToken`. Returns `null` for read-only
 * token types (operator/constant/position/formula). Callers wrap the result in
 * `core.runCommandsAsTransaction` for undo/redo integrity.
 */
const writeToken = (token, raw, { core, options }) => {
    const nodeId = options.nodeId;
    switch (token.type) {
        case 'attribute': {
            if (!nodeId)
                return null;
            return new SetNodeAttributeValueCommand(nodeId, token.value, raw);
        }
        case 'property': {
            if (!nodeId)
                return null;
            return new SetNodePropertyValueCommand(nodeId, token.value, raw);
        }
        case 'roomAttribute': {
            if (!nodeId)
                return null;
            const room = getOptionalParentRoom(core, nodeId);
            if (!room)
                return null;
            return new SetNodeAttributeValueCommand(room.id, token.value, raw);
        }
        case 'productAttribute': {
            if (!nodeId)
                return null;
            const item = getParentItem(core, nodeId);
            if (!item)
                return null;
            return new SetNodeAttributeValueCommand(item.id, token.value, raw);
        }
        case 'projectAttribute':
            return new SetProjectAttributeValueCommand(token.value, raw);
        case 'projectSetting':
            return buildProjectSettingWrite(core, token.value, raw);
        // Writes the whole vector (not just the named axis) — `updateWallItemHolesEffect`
        // and other regenerators fire on the `SetNodeVector3Command` event; a per-axis
        // `SetValueCommand` leaves stale cutout geometry.
        case 'size': {
            if (!nodeId)
                return null;
            const node = getNode(core, nodeId);
            if (!('size' in node) || !node.size)
                return null;
            // CrownMolding carries an intentional 2D (x/y) size — no `.z` to read.
            if (!(V3Axes.z in node.size))
                return null;
            const val = typeof raw === 'number' ? raw : parseFloat(String(raw));
            if (!Number.isFinite(val))
                return null;
            return new SetNodeVector3Command(nodeId, VectorProps.size, {
                x: node.size.x.get(),
                y: node.size.y.get(),
                z: node.size.z.get(),
                [token.value]: val
            });
        }
        default:
            return null;
    }
};

export { writeToken };
