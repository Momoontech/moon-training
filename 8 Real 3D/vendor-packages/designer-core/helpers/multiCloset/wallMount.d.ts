import { Command } from '../../components/commands/core/Command';
import type { Node } from '../../components/Node';
import { CoreDesigner } from '../../designer-core';
/**
 * Re-parent a just-dropped multiCloset from the floor `MountPlane` onto the `MountLine` of the
 * `Wall2D` its back was snapped flush against during the drag. Returns `[]` — meaning "leave it
 * on the floor" — in every other case, including the DETACH direction: `dragOnMountPlane`
 * already re-parented the closet to the floor mid-drag, so a closet dragged away from its wall
 * needs no command at all.
 *
 * The wall is not re-derived here. It is whatever the last successful planar frame witnessed
 * (see {@link getWallAttach}), which is what keeps "attached" and "visually snapped" in
 * agreement — `resolveCollisionSnap` and `nudge` run AFTER the flush snap and can leave the
 * closet a hair off the wall, so a drop-time contact test would refuse closets the user just
 * watched snap into place.
 *
 * Why this exists: `getItemLocalXClearances` — and through it `fitItemToSizeX`, the "fit to
 * size" that runs on the first drop of a catalog closet — branches on
 * `getOptionalParentWall2D`. Only a closet in the wall's parent chain fits to the WALL's span
 * (`getWallItemClearances`) instead of to the room polygon (`getPlanarItemClearances`).
 *
 * Scope is `base` / `tall` only. `adjustPosition(MountSurface.Line)` pins `y = 0` and
 * `itemConstraints` gives `MountLine` children `WALL_HORIZONTAL` (height read-only, pinned to
 * 0), so an `upper` closet would be dropped to the floor and lose its height field. Supporting
 * it means relaxing both first.
 */
export declare const buildMultiClosetWallMountCommands: (core: CoreDesigner, node: Node) => Command[];
