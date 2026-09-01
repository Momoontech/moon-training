import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
import { Vector2 } from '../math';
/**
 * Snapped position plus guide-line coordinates for visual feedback.
 *
 * guideX — world X of the vertical guide line   (non-null when X axis is snapped)
 * guideY — world Y of the horizontal guide line (non-null when Y axis is snapped)
 */
export type SnapGuideData = {
    position: Vector2;
    guideX: number | null;
    guideY: number | null;
};
/**
 * Applies all enabled corner snaps and returns the best snapped position
 * together with guide-line coordinates for rendering snap helpers.
 *
 * Each snap type runs independently inside its own `if (enabled)` block and
 * contributes candidates via `contribute()`. The priority resolution at the
 * bottom is shared and unchanged regardless of which snap types are active.
 *
 * Priority (explicit, not distance-based):
 *   1. Corner snap   — both axes align to the SAME reference → exact point
 *   2. Intersection  — X from one source, Y from another → their intersection
 *   3. Single axis   — only X or only Y aligned → that axis only
 *   4. No snap       — cursor unchanged
 *
 * Coordinate space — raw signal values:
 *   cursor.x = v3.x, cursor.y = v3.z  (written to SetNodeVector2Command)
 *   position.x/y.get() returns the raw signal value (no TransformedValue transform).
 *
 * Adding a new snap type:
 *   1. Add its settings to RoomSnapSettings / roomSettingsType / RoomSettings
 *   2. Implement the math in a dedicated file under helpers/snap/
 *   3. Add an `if (snapSettings.corner.<newSnap>.get()) { ... contribute(...) }` block below
 */
export declare const snapCornerWithGuides: (core: CoreDesigner, pointId: UUID, cursor: Vector2) => SnapGuideData;
/** Convenience wrapper — returns only the snapped position. */
export declare const snapCorner: (core: CoreDesigner, pointId: UUID, cursor: Vector2) => Vector2;
