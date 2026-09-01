/**
 * Sutherland–Hodgman polygon clipping against a vertical strip
 * `xMin <= x <= xMax`. Input polygon may be non-convex; the clip
 * region is convex (an axis-aligned strip) so the algorithm is correct.
 *
 * Returns an empty array when the polygon does not intersect the strip
 * (defensive — should not happen after profile extension).
 */
const clipPolygonToStrip = (polygon, xMin, xMax) => {
    if (polygon.length < 3)
        return [];
    if (xMax <= xMin)
        return [];
    // Pass 1: clip against x >= xMin (keep vertices with x >= xMin).
    const afterMin = clipAgainstHalfPlane(polygon, (p) => p.x >= xMin, (a, b) => intersectVertical(a, b, xMin));
    if (afterMin.length === 0)
        return [];
    // Pass 2: clip against x <= xMax.
    const afterMax = clipAgainstHalfPlane(afterMin, (p) => p.x <= xMax, (a, b) => intersectVertical(a, b, xMax));
    return afterMax;
};
const clipAgainstHalfPlane = (input, inside, intersect) => {
    const output = [];
    for (let i = 0; i < input.length; i += 1) {
        const current = input[i];
        const previous = input[(i - 1 + input.length) % input.length];
        const currentInside = inside(current);
        const previousInside = inside(previous);
        if (currentInside) {
            if (!previousInside) {
                output.push(intersect(previous, current));
            }
            output.push(current);
        }
        else if (previousInside) {
            output.push(intersect(previous, current));
        }
    }
    return output;
};
const intersectVertical = (a, b, x) => {
    const dx = b.x - a.x;
    if (dx === 0) {
        // Both endpoints have the same x. Defensive — caller filters by inside flag.
        return { x, y: a.y };
    }
    const t = (x - a.x) / dx;
    return { x, y: a.y + t * (b.y - a.y) };
};

export { clipPolygonToStrip };
