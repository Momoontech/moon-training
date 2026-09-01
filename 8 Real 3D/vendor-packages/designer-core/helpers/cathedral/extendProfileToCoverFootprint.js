/**
 * Returns a new profile with horizontal "wing" knots prepended/appended so the
 * profile spans `[xMin, xMax]`. The wings are flat — same `y` as the adjacent
 * end-knot — so they extend the cathedral with flat slabs that bridge any gap
 * between the user-supplied profile and the room footprint.
 *
 * Pure: never mutates `points`. Idempotent: if the profile already covers
 * `[xMin, xMax]` (or `points` is empty), returns the input array unchanged.
 */
const extendProfileToCoverFootprint = (points, xMin, xMax) => {
    if (points.length === 0)
        return points;
    const first = points[0];
    const last = points[points.length - 1];
    const needsHead = xMin < first.x;
    const needsTail = xMax > last.x;
    if (!needsHead && !needsTail)
        return points;
    const out = [];
    if (needsHead)
        out.push({ x: xMin, y: first.y });
    for (let i = 0; i < points.length; i += 1)
        out.push(points[i]);
    if (needsTail)
        out.push({ x: xMax, y: last.y });
    return out;
};

export { extendProfileToCoverFootprint };
