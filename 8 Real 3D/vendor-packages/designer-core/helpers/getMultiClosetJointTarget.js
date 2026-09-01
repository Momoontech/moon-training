import getOptionalNode from '../components/Node/helpers/getOptionalNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import getPart from '../components/Node/helpers/getPart.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import { MULTI_CLOSET_JOINT_PART_SIDES, isMultiClosetJointPartType } from '../declarations/Part.js';
import { MultiClosetsJointType } from '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getPropertyValue from './getPropertyValue.js';

const OPPOSITE = { Left: 'Right', Right: 'Left' };
/** Joint variant → the PascalCase token embedded in the matching `PartType`. */
const JOINT_VARIANT_TOKEN = {
    [MultiClosetsJointType.bridge]: 'Bridge',
    [MultiClosetsJointType.cornerCorner]: 'CornerCorner',
    [MultiClosetsJointType.cornerDiagonal]: 'CornerDiagonal'
};
/**
 * Resolve a multiCloset joint part to the Item + side whose `JointType`
 * attribute drives the joint — always the "joined-to" (vertical) Item `B`.
 *
 * Two multiClosets meet face-to-side: the prober `A` (horizontal) abuts the
 * receiver `B` (vertical) front face. The neighbour sweep records this as
 * `B.{facingSide}JointMultiClosetNeighborId = A` while `A.{s}MultiClosetNeighborId = B`
 * (see `designer3d/helpers/effects.ts → runMultiClosetNeighborSweep`). The bridge
 * gap on `A`'s side and the corner joint on `B`'s side are both gated by
 * `B.{facingSide}JointType` (see `Node/helpers/effects.ts`), so BOTH the joint
 * part on `A` and the one on `B` resolve to the same `(B, facingSide)`.
 *
 * Given a joint part on owning Item `P` and the part's side `s` (from its
 * `partType`):
 *  - if `P.{s}JointMultiClosetNeighborId` is set → `P` IS the receiver `B`,
 *    facing side `s` → `(P, s)`.
 *  - else `P` is the prober `A` → `B = P.{s}MultiClosetNeighborId`, facing side
 *    `opposite(s)` → `(B, opposite(s))`.
 *
 * Returns `null` when no joint relationship is resolvable (no neighbour linked).
 */
const getMultiClosetJointTarget = (core, partId) => {
    if (!partId)
        return null;
    const part = getPart(core, partId);
    const side = MULTI_CLOSET_JOINT_PART_SIDES[part.partType.get()];
    if (!side)
        return null;
    const owner = getParentItem(core, partId);
    // P is the vertical receiver B when a joint neighbour is linked on this side.
    const ownJointNeighborId = getPropertyValue(owner, `${side}JointMultiClosetNeighborId`);
    if (ownJointNeighborId) {
        return { itemId: owner.id, side };
    }
    // Otherwise P is the horizontal prober A; B is its side neighbour and the
    // controlled attribute lives on B's opposite (facing) side.
    const sideNeighborId = getPropertyValue(owner, `${side}MultiClosetNeighborId`);
    if (!sideNeighborId)
        return null;
    const neighbor = getOptionalNode(core, sideNeighborId);
    if (!neighbor)
        return null;
    return { itemId: neighbor.id, side: OPPOSITE[side] };
};
/**
 * Resolve the joint `Part` that is active for the joint described by `target`
 * once its type is `jointType` — i.e. the part that should carry the selection
 * outline after a type switch.
 *
 * The active part moves between closets with the variant: a **bridge** renders
 * on the prober `A` (`target.itemId`'s facing-side joint neighbour) at `A`'s
 * face opposite the joint; **corner** joints render on the receiver `B`
 * (`target.itemId`) at its facing side. Joint parts are direct children of the
 * owning Item. Returns `null` for `none` or when nothing resolves.
 */
const getActiveMultiClosetJointPartId = (core, target, jointType) => {
    if (jointType === MultiClosetsJointType.none)
        return null;
    const { itemId, side } = target;
    let ownerId = itemId;
    let ownerSide = side;
    if (jointType === MultiClosetsJointType.bridge) {
        const receiver = getOptionalNode(core, itemId);
        const proberId = receiver
            ? getPropertyValue(receiver, `${side}JointMultiClosetNeighborId`)
            : undefined;
        if (!proberId)
            return null;
        ownerId = proberId;
        ownerSide = OPPOSITE[side];
    }
    // PartType values mirror `${side}${Variant}MultiClosetJointPart` (side lowercased).
    const partType = `${ownerSide.toLowerCase()}${JOINT_VARIANT_TOKEN[jointType]}MultiClosetJointPart`;
    if (!isMultiClosetJointPartType(partType))
        return null;
    const owner = getOptionalNode(core, ownerId);
    if (!owner)
        return null;
    for (const childId of owner.children.get()) {
        const child = getOptionalNode(core, childId);
        if (child?.type === NodeType.Part && child.partType.get() === partType) {
            return child.id;
        }
    }
    return null;
};

export { getActiveMultiClosetJointPartId, getMultiClosetJointTarget };
