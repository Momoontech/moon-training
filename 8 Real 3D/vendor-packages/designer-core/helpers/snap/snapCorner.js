import getPoint from '../../components/Node/helpers/getPoint.js';
import getStage from '../../components/Node/helpers/getStage.js';
import { Vector2 } from '../math/Vector2.js';
import '../math/plane/unitBoxCorners.js';
import '../math/plane/projectUnitBoxToFootprint2D.js';
import { orthoSnapToPoint } from './orthoSnap.js';

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
const snapCornerWithGuides = (core, pointId, cursor) => {
    const snapSettings = core.projectSettings.roomSettings.snap;
    const tolerance = core.projectSettings.snapSensitivity.get();
    // ─── Shared snap state ────────────────────────────────────────────────────
    // Each snap type feeds into these via contribute(). The closest candidate
    // per axis wins; an exact-point match (cornerSnapPos) takes highest priority.
    let xSnapPos = null;
    let xSnapDist = Infinity;
    let ySnapPos = null;
    let ySnapDist = Infinity;
    let cornerSnapPos = null;
    let cornerSnapDist = Infinity;
    /**
     * Called by each snap type to register its candidates.
     *
     * @param snapX     Candidate X position, or null if this snap has no X contribution.
     * @param snapY     Candidate Y position, or null if this snap has no Y contribution.
     * @param exactPoint When both snapX and snapY come from the SAME reference point,
     *                   pass it here to register a corner-snap candidate (highest priority).
     */
    const contribute = (snapX, snapY, exactPoint) => {
        if (snapX !== null) {
            const d = Math.abs(cursor.x - snapX);
            if (d < xSnapDist) {
                xSnapPos = snapX;
                xSnapDist = d;
            }
        }
        if (snapY !== null) {
            const d = Math.abs(cursor.y - snapY);
            if (d < ySnapDist) {
                ySnapPos = snapY;
                ySnapDist = d;
            }
        }
        if (exactPoint !== undefined && snapX !== null && snapY !== null) {
            const d = cursor.distanceTo(exactPoint);
            if (d < cornerSnapDist) {
                cornerSnapPos = exactPoint;
                cornerSnapDist = d;
            }
        }
    };
    // ─── Ortho snap ───────────────────────────────────────────────────────────
    if (snapSettings.corner.ortho.get()) {
        const stage = getStage(core, core.currentStage.get());
        for (const cornerId of stage.points.get()) {
            if (cornerId === pointId)
                continue;
            const pt = getPoint(core, cornerId);
            const ref = new Vector2(pt.position.x.get(), pt.position.y.get());
            const { snapX, snapY } = orthoSnapToPoint(cursor, ref, tolerance);
            contribute(snapX, snapY, snapX !== null && snapY !== null ? ref : undefined);
        }
    }
    // ─── Grid snap (example of how to add a new type) ─────────────────────────
    // if (snapSettings.corner.grid.get()) {
    //   const { snapX, snapY } = gridSnapToPoint(cursor, gridSize, tolerance);
    //   contribute(snapX, snapY);
    // }
    // ─── Priority resolution ──────────────────────────────────────────────────
    // Cast to break TypeScript's overly-aggressive CFA narrowing: `let` variables
    // mutated only inside closures are narrowed to `null` (their initialiser type)
    // at any point outside the closure, making the truthy branch unreachable (`never`).
    // The explicit cast restores the declared `Vector2 | null` type for narrowing.
    const resolvedCorner = cornerSnapPos;
    if (resolvedCorner)
        return { position: resolvedCorner, guideX: resolvedCorner.x, guideY: resolvedCorner.y };
    if (xSnapPos !== null && ySnapPos !== null)
        return { position: new Vector2(xSnapPos, ySnapPos), guideX: xSnapPos, guideY: ySnapPos };
    if (xSnapPos !== null)
        return { position: new Vector2(xSnapPos, cursor.y), guideX: xSnapPos, guideY: null };
    if (ySnapPos !== null)
        return { position: new Vector2(cursor.x, ySnapPos), guideX: null, guideY: ySnapPos };
    return { position: cursor, guideX: null, guideY: null };
};
/** Convenience wrapper — returns only the snapped position. */
const snapCorner = (core, pointId, cursor) => snapCornerWithGuides(core, pointId, cursor).position;

export { snapCorner, snapCornerWithGuides };
