/**
 * Clamped piecewise-linear interpolation of `points.y` keyed by `x`.
 *
 * - When `x` is below the first knot, returns the first knot's `y`.
 * - When `x` is above the last knot, returns the last knot's `y`.
 * - When the array is empty, returns `0`.
 *
 * Assumes `points` are sorted by ascending `x`.
 */
const evalProfileH = (points, x) => {
    if (points.length === 0)
        return 0;
    if (points.length === 1)
        return points[0].y;
    if (x <= points[0].x)
        return points[0].y;
    if (x >= points[points.length - 1].x)
        return points[points.length - 1].y;
    // Find the segment containing x. Linear scan is fine for the small N
    // expected for cathedral profiles (typically < 20 knots).
    for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        if (x >= a.x && x <= b.x) {
            const dx = b.x - a.x;
            if (dx === 0)
                return a.y;
            const t = (x - a.x) / dx;
            return a.y + t * (b.y - a.y);
        }
    }
    return points[points.length - 1].y;
};
/**
 * Returns the `x` values of all knots whose `x` lies STRICTLY inside
 * the open interval `(xMin, xMax)`. Used to insert kinks into wall
 * top profiles and to drive the boundaries between ceiling facets.
 *
 * Assumes `points` are sorted by ascending `x`.
 */
const getKnotsInRange = (points, xMin, xMax) => {
    const lo = Math.min(xMin, xMax);
    const hi = Math.max(xMin, xMax);
    const out = [];
    for (let i = 0; i < points.length; i += 1) {
        const x = points[i].x;
        if (x > lo && x < hi)
            out.push(x);
    }
    return out;
};

export { evalProfileH, getKnotsInRange };
