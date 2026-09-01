/**
 * Euclidean distance from a 2D point to the closest point on a finite line
 * segment a→b. If a and b coincide, returns the plain point-to-point distance.
 */
function pointToSegmentDistance(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0)
        return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / abLenSq;
    if (t < 0)
        t = 0;
    else if (t > 1)
        t = 1;
    const cx = a.x + t * abx;
    const cy = a.y + t * aby;
    return Math.hypot(p.x - cx, p.y - cy);
}

export { pointToSegmentDistance };
