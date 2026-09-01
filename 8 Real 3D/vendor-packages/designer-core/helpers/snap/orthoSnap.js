/**
 * Computes the orthogonal snap result for a cursor against a single reference point.
 *
 * Returns null when the cursor is outside tolerance on both axes.
 *
 * Priority (mirrors the legacy axisAlignedCornersSnap behaviour):
 *   corner snap  — same reference locks both X and Y (highest priority, handled by caller)
 *   axis snap    — only one axis is within tolerance
 */
const orthoSnapToPoint = (cursor, reference, tolerance) => {
    const dx = Math.abs(cursor.x - reference.x);
    const dy = Math.abs(cursor.y - reference.y);
    return {
        snapX: dx <= tolerance ? reference.x : null,
        snapY: dy <= tolerance ? reference.y : null
    };
};

export { orthoSnapToPoint };
