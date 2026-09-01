import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import { ItemType, MountType } from '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getNode from '../components/Node/helpers/getNode.js';
import '../components/Node/components/AdjustableBox/index.js';
import '../components/Node/components/AdjustableExtrusion/index.js';
import '../components/Node/components/BoxContainer/index.js';
import '../components/Node/components/Carcass/index.js';
import '../components/Node/components/Ceiling2D/index.js';
import '../components/Node/components/Countertop/index.js';
import '../components/Node/components/CrownMolding/index.js';
import '../components/Node/components/Edgebanding/index.js';
import '../components/Node/components/Floor2D/index.js';
import '../components/Node/components/Frame/index.js';
import '../components/Node/components/FreeBoxContainer/index.js';
import '../components/Node/components/GateFrame/index.js';
import '../components/Node/components/Glass/index.js';
import '../components/Node/components/Image/index.js';
import '../components/Node/components/Item/index.js';
import '../components/Node/components/LaminateBox/index.js';
import '../components/Node/components/MiteredPanel/index.js';
import '../components/Node/BaseModel.js';
import '../components/Node/components/Molding/index.js';
import '../components/Node/components/MountLine/index.js';
import '../components/Node/components/MountPlane/index.js';
import '../components/Node/components/MountPoint/index.js';
import '../components/Node/components/Panel/index.js';
import '../components/Node/components/Part/index.js';
import '../components/Node/components/Point/index.js';
import '../components/Node/components/PointLight/index.js';
import '../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import './cathedral/computeCathedralContext.js';
import '../components/Node/components/ShapedBoxContainer/index.js';
import '../components/Node/components/SpotLight/index.js';
import '../components/Node/components/Tiles/index.js';
import '../components/Node/components/ToeKickPanel/index.js';
import '../components/Node/components/Valance/index.js';
import '../components/Node/components/Wall2D/index.js';
import '../components/Node/components/WindowFrame/index.js';
import '../components/Node/helpers/effects.js';
import '../components/Node/helpers/effects.reachInCloset.js';
import '../components/Node/helpers/effects.wallHole.js';
import '../components/Node/helpers/defaultHoleCurve.js';
import './multiCloset/contentPartTypes.js';
import '../components/Node/helpers/getResizableSides.js';
import '../components/Node/helpers/getSelectableNode.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

// ---------------------------------------------------------------------------
// Flyweight constraint objects (shared, never mutated)
// ---------------------------------------------------------------------------
const ALL_WALL_SIDES = ['left', 'right', 'down'];
const HORIZONTAL_ONLY = ['left', 'right'];
const ALL_PLANE_SIDES = ['left', 'right', 'back', 'front'];
/** Wall + MountLine: horizontal movement only, pinned to floor */
const WALL_HORIZONTAL = {
    kind: 'wall',
    visibleSides: HORIZONTAL_ONLY,
    readOnlySides: ['down'],
    pinnedValues: { down: 0 }
};
/** Wall + MountPlane: free movement on wall surface */
const WALL_FREE = {
    kind: 'wall',
    visibleSides: ALL_WALL_SIDES,
    readOnlySides: [],
    pinnedValues: {}
};
/** Floor or ceiling mount: free movement on plane */
const PLANE_FREE = {
    kind: 'plane',
    visibleSides: ALL_PLANE_SIDES,
    readOnlySides: [],
    pinnedValues: {}
};
// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------
/**
 * Determine placement constraints for an item based on its parent mount node.
 *
 * Detection:
 *   1. Gates / reach-in closets -> always wall-horizontal. Windows -> always
 *      wall-free.
 *   2. Read parent's mountSlotTypes to determine wall/floor/ceiling.
 *   3. Wall + MountLine -> wall-horizontal, Wall + MountPlane -> wall-free.
 *   4. Floor/ceiling -> plane-free (To Left, To Right, Backward, Forward).
 */
const resolveItemConstraints = (item) => {
    const type = item.itemType.get();
    if (!type)
        return PLANE_FREE;
    if (type === ItemType.gate || type === ItemType.reachInCloset)
        return WALL_HORIZONTAL;
    if (type === ItemType.window)
        return WALL_FREE;
    const parent = getNode(item.core, item.parent.get());
    if (!('mountSlotTypes' in parent))
        return PLANE_FREE;
    const raw = parent.mountSlotTypes;
    const slotTypes = typeof raw?.get === 'function' ? raw.get() : raw;
    if (!slotTypes)
        return PLANE_FREE;
    if (slotTypes.includes(MountType.wall)) {
        // MountLine → always horizontal (doors, base cabinets on wall edge)
        if (parent.type === NodeType.MountLine)
            return WALL_HORIZONTAL;
        // MountPlane + item can also mount on floor → floor-pinned (cabinet/drawer on wall)
        const mountTypes = item.mountTypes.get();
        if (mountTypes.includes(MountType.floor))
            return WALL_HORIZONTAL;
        // MountPlane + wall-only → free movement (TV, upper appliance, picture)
        return WALL_FREE;
    }
    return PLANE_FREE;
};

export { resolveItemConstraints };
