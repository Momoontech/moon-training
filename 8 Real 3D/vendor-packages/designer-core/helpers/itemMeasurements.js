import getNode from '../components/Node/helpers/getNode.js';
import getParentRoom from '../components/Node/helpers/getParentRoom.js';
import getParentRoomSegment from '../components/Node/helpers/getParentRoomSegment.js';
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import SetNodeVector3Command from '../components/commands/SetNodeVector3Command.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import { VectorProps } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import { CeilingType } from '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getAttributeValue from './getAttributeValue.js';
import { resolveItemConstraints } from './itemConstraints.js';
import { computeSegmentLength } from './segmentMeasurements.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const readVec3 = (item, prop) => ({
    x: item[prop].x.get(),
    y: item[prop].y.get(),
    z: item[prop].z.get()
});
// ---------------------------------------------------------------------------
// Wall measurements
// ---------------------------------------------------------------------------
const getWallItemMeasurements = (core, item) => {
    const constraints = resolveItemConstraints(item);
    if (constraints.kind === 'plane')
        return null;
    const posX = item.position.x.get();
    const posY = item.position.y.get();
    const sizeX = item.size.x.get();
    const sizeY = item.size.y.get();
    const segment = getParentRoomSegment(core, item.id);
    const wallLength = computeSegmentLength(core, segment);
    const room = getParentRoom(core, item.id);
    //TODO needs to be considered which logic do we need for non-flat
    if (getAttributeValue(room, 'CeilingType') !== CeilingType.Flat)
        return null;
    const roomHeight = getAttributeValue(room, 'WallHeight');
    const isVisible = (side) => constraints.visibleSides.includes(side);
    const isPinned = (side) => side in constraints.pinnedValues;
    const isReadOnly = (side) => constraints.readOnlySides.includes(side) || isPinned(side);
    const measure = (side, value, max, min) => {
        if (!isVisible(side))
            return { value: null, max: null, min: null, readOnly: true };
        if (isPinned(side))
            return { value: constraints.pinnedValues[side], max, min, readOnly: true };
        return { value, max, min, readOnly: isReadOnly(side) };
    };
    return {
        left: measure('left', Math.round(posX), wallLength != null ? Math.max(0, Math.round(wallLength - sizeX)) : null, 0),
        right: measure('right', wallLength != null ? Math.round(wallLength - posX - sizeX) : null, wallLength != null ? Math.max(0, Math.round(wallLength - sizeX)) : null, 0),
        down: measure('down', Math.round(posY), roomHeight != null ? Math.max(0, roomHeight - sizeY) : null, 0),
        width: {
            value: Math.round(sizeX),
            max: wallLength != null ? Math.max(0, Math.round(wallLength - posX)) : null,
            min: 0,
            readOnly: false
        },
        height: {
            value: Math.round(sizeY),
            max: roomHeight != null ? Math.max(0, roomHeight - posY) : null,
            min: 0,
            readOnly: false
        },
        constraints
    };
};
/**
 * Smallest wall length (inches) that still fully contains every wall-mounted
 * item on `segmentId` — i.e. `max(position.x + size.x)` over all `Item`s
 * parented to the segment's `Wall2D` mount slots (`MountPlane` / `MountLine`),
 * measured from the segment's `from` point. Returns `0` when the segment
 * carries no wall items (any positive length fits).
 *
 * A wall item keeps its wall-local `position.x` (offset from `from`) and
 * `size.x` fixed while the wall's length changes — it is pinned to the wall
 * frame, not to world space — so this value is exactly the minimum length the
 * wall may shrink to before the farthest item hangs past the `to` end (in the
 * air). The floorplan corner / segment drag-collision gates and the
 * wall-length dimension commit read it to refuse a shrink that would orphan a
 * mounted product. Symmetric in `from` / `to`: the constraint is on the
 * scalar length, so it holds regardless of which endpoint the gesture moves.
 *
 * Mirrors the per-axis bound `setWallItemSize` / `setWallItemPosition` already
 * enforce for a single item edit (`position.x + size.x <= wallLength`),
 * applied here across every item on the wall for the inverse operation
 * (resizing the wall, not the item).
 */
const getMaxWallItemExtent = (core, segmentId) => {
    const segment = getRoomSegment(core, segmentId);
    const wall2DId = segment.wall2D.get();
    if (!wall2DId)
        return 0;
    // Wall2D → mount slots (MountPlane / MountLine) → wall-mounted Items.
    // Both mount types expose `.children` via the shared `withChildren('children')`
    // builder step, so they are walked uniformly without type-narrowing.
    const wall2D = getNode(core, wall2DId);
    let maxExtent = 0;
    for (const mountId of wall2D.children.get()) {
        const mount = getNode(core, mountId);
        for (const childId of mount.children.get()) {
            const child = getNode(core, childId);
            if (child.type !== NodeType.Item)
                continue;
            const item = child;
            const extent = item.position.x.get() + item.size.x.get();
            if (extent > maxExtent)
                maxExtent = extent;
        }
    }
    return maxExtent;
};
// ---------------------------------------------------------------------------
// Command builders
// ---------------------------------------------------------------------------
const setWallItemSize = (core, item, axis, val) => {
    if (val <= 0)
        return null;
    const room = getParentRoom(core, item.id);
    if (getAttributeValue(room, 'CeilingType') !== CeilingType.Flat)
        return null;
    const roomHeight = getAttributeValue(room, 'WallHeight');
    if (axis === 'width') {
        const segment = getParentRoomSegment(core, item.id);
        if (segment) {
            const wallLength = computeSegmentLength(core, segment);
            if (wallLength != null && item.position.x.get() + val > wallLength)
                return null;
        }
    }
    else if (axis === 'height') {
        if (roomHeight == null)
            return null;
        if (item.position.y.get() + val > roomHeight)
            return null;
    }
    // depth (size.z) has no wall bounds to validate against
    const key = axis === 'width' ? 'x' : axis === 'height' ? 'y' : 'z';
    return new SetNodeVector3Command(item.id, VectorProps.size, { ...readVec3(item, VectorProps.size), [key]: val });
};
const setWallItemPosition = (core, item, side, val) => {
    if (val < 0)
        return null;
    const constraints = resolveItemConstraints(item);
    if (side in constraints.pinnedValues)
        return null;
    const pos = readVec3(item, VectorProps.position);
    const sizeX = item.size.x.get();
    const sizeY = item.size.y.get();
    if (side === 'left') {
        const segment = getParentRoomSegment(core, item.id);
        if (segment) {
            const wallLength = computeSegmentLength(core, segment);
            if (wallLength != null && val + sizeX > wallLength)
                return null;
        }
        return new SetNodeVector3Command(item.id, VectorProps.position, { ...pos, x: val });
    }
    if (side === 'right') {
        const segment = getParentRoomSegment(core, item.id);
        if (!segment)
            return null;
        const wallLength = computeSegmentLength(core, segment);
        if (wallLength == null)
            return null;
        const newX = wallLength - sizeX - val;
        if (newX < 0)
            return null;
        return new SetNodeVector3Command(item.id, VectorProps.position, { ...pos, x: newX });
    }
    if (side === 'down') {
        const room = getParentRoom(core, item.id);
        if (getAttributeValue(room, 'CeilingType') !== CeilingType.Flat)
            return null;
        const roomHeight = getAttributeValue(room, 'WallHeight');
        if (roomHeight == null)
            return null;
        if (val + sizeY > roomHeight)
            return null;
        return new SetNodeVector3Command(item.id, VectorProps.position, { ...pos, y: val });
    }
    return null;
};

export { getMaxWallItemExtent, getWallItemMeasurements, readVec3, setWallItemPosition, setWallItemSize };
