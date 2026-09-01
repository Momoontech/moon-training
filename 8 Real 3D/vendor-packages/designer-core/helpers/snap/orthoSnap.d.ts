import { Vector2 } from '../math';
export type OrthoSnapResult = {
    position: Vector2;
    /** true when both axes were locked to the same corner */
    isCornerSnap: boolean;
};
/**
 * Computes the orthogonal snap result for a cursor against a single reference point.
 *
 * Returns null when the cursor is outside tolerance on both axes.
 *
 * Priority (mirrors the legacy axisAlignedCornersSnap behaviour):
 *   corner snap  — same reference locks both X and Y (highest priority, handled by caller)
 *   axis snap    — only one axis is within tolerance
 */
export declare const orthoSnapToPoint: (cursor: Vector2, reference: Vector2, tolerance: number) => {
    snapX: number | null;
    snapY: number | null;
};
