import { CoreDesigner } from '..';
import { MultiClosetJointSide, MultiClosetsJointType, UUID } from '../declarations';
export interface MultiClosetJointTarget {
    /** The "joined-to" (vertical) Item whose facing-side joint type the UI controls. */
    itemId: UUID;
    /** The facing side of that Item — selects the `Left/RightJointType` attribute. */
    side: MultiClosetJointSide;
}
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
export declare const getMultiClosetJointTarget: (core: CoreDesigner, partId: UUID | undefined) => MultiClosetJointTarget | null;
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
export declare const getActiveMultiClosetJointPartId: (core: CoreDesigner, target: MultiClosetJointTarget, jointType: MultiClosetsJointType) => UUID | null;
