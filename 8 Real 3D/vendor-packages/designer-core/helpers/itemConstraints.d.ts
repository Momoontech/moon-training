import { Item } from '../components/Node/components/Item';
import { WallItemSide, PlaneSide } from './itemMeasurements';
export interface WallConstraints {
    kind: 'wall';
    visibleSides: readonly WallItemSide[];
    readOnlySides: readonly WallItemSide[];
    pinnedValues: Partial<Record<WallItemSide, number>>;
}
export interface PlaneConstraints {
    kind: 'plane';
    visibleSides: readonly PlaneSide[];
    readOnlySides: readonly PlaneSide[];
    pinnedValues: Partial<Record<PlaneSide, number>>;
}
export type ItemConstraints = WallConstraints | PlaneConstraints;
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
export declare const resolveItemConstraints: (item: Item) => ItemConstraints;
