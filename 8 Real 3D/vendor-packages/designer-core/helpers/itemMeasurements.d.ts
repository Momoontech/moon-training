import { Item } from '../components/Node/components/Item';
import { Command } from '../components/commands/core/Command';
import { UUID, VectorProps } from '../declarations';
import { CoreDesigner } from '../designer-core';
import { ItemConstraints } from './itemConstraints';
export type WallItemSide = 'left' | 'right' | 'down';
export type PlaneSide = 'left' | 'right' | 'back' | 'front';
export type ItemSide = WallItemSide | PlaneSide;
export type WallItemSizeAxis = 'width' | 'height' | 'depth';
export interface MeasurementValue {
    value: number | null;
    max: number | null;
    min: number | null;
    readOnly: boolean;
}
export interface WallItemMeasurements {
    left: MeasurementValue;
    right: MeasurementValue;
    down: MeasurementValue;
    width: MeasurementValue;
    height: MeasurementValue;
    constraints: ItemConstraints;
}
export declare const readVec3: (item: Item, prop: VectorProps.position | VectorProps.size) => {
    x: number;
    y: number;
    z: number;
};
export declare const getWallItemMeasurements: (core: CoreDesigner, item: Item) => WallItemMeasurements | null;
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
export declare const getMaxWallItemExtent: (core: CoreDesigner, segmentId: UUID) => number;
export declare const setWallItemSize: (core: CoreDesigner, item: Item, axis: WallItemSizeAxis, val: number) => Command | null;
export declare const setWallItemPosition: (core: CoreDesigner, item: Item, side: WallItemSide, val: number) => Command | null;
