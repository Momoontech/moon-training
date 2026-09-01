/**
 * Determines if a sequence of points forms a counterclockwise (CCW) path on a plane.
 * Uses the signed area calculation (shoelace formula).
 *
 * @param points - Array of Vector2 points forming a closed polygon
 * @returns true if the path is counterclockwise, false if clockwise
 */
function isCCW(points) {
    if (points.length < 3) {
        return false; // Need at least 3 points to form a polygon
    }
    // Calculate signed area using shoelace formula
    // Area = 0.5 * Σ(x[i] * y[i+1] - x[i+1] * y[i])
    // For CCW check, we only need the sign, so skip the 0.5 multiplication
    let signedArea = 0;
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length]; // Wrap around to first point
        signedArea += current.x * next.y - next.x * current.y;
    }
    // Positive area means counterclockwise
    // Negative area means clockwise
    return signedArea > 0;
}

export { isCCW };
