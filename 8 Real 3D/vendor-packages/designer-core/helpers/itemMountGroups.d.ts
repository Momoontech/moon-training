import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
/**
 * Mount groups — which products can obstruct which, for every intersection
 * test in the app (planar + wall clearances, "fit to space", and the whole
 * drag pipeline: snap, collision-resolve, nudge, SAT).
 *
 * There are two groups: **ceiling** and **everything else** (floor /
 * countertop / wall / line / point). A product only ever obstructs a product
 * in its own group.
 *
 * Why: every one of those tests works on the floor-plan projection — it drops
 * the vertical axis (or gates it loosely). On the plan, a recessed ceiling
 * light's 5" × 5" footprint overlaps whatever stands beneath it, so a closet
 * growing along a wall "collided" with a fixture eight feet above it and
 * stopped dead in open floor. Nothing mounted to the floor or a wall can reach
 * the ceiling plane, so the two groups simply never interact.
 *
 * This is a hard rule, not a per-call option: the previous version threaded an
 * opt-out through the clearance helpers, and every call site that forgot it
 * (the toolbar "Fit to space", the drag pipeline) kept the bug.
 */
/**
 * `true` when `nodeId` belongs to the ceiling group.
 *
 * The mount it is parented to is the ground truth — `MountPlane` /
 * `MountLine` parents are what the intersection tests already filter on. The
 * item's own `mountTypes` is consulted as a fallback: a product that declares
 * `ceiling` and declares neither `floor` nor `wall` is a ceiling fixture
 * wherever it ended up parented (RoomPlan's importer, for one, routes every
 * scanned object to a floor or wall plane — never to a ceiling one).
 *
 * Non-Item nodes and unresolvable ids answer `false`: they are not ceiling
 * fixtures, so they stay in the general group and behave exactly as before.
 */
export declare const isCeilingMountedNode: (core: CoreDesigner, nodeId: UUID) => boolean;
/**
 * `true` when the two nodes are in the same mount group and may therefore
 * obstruct one another. Use in any neighbor loop that decides whether a
 * sibling blocks the node under test.
 *
 * Prefer hoisting `isCeilingMountedNode(core, target)` out of a hot loop and
 * comparing against it per candidate — this form is for one-off checks.
 */
export declare const shareMountGroup: (core: CoreDesigner, nodeId: UUID, otherNodeId: UUID) => boolean;
