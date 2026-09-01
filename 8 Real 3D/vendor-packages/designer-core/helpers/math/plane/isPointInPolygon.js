/**
 * Ray-casting point-in-polygon test (even-odd rule).
 *
 * Returns true when `point` lies strictly inside the closed polygon defined by
 * `polygon` (ordered vertices). A polygon with fewer than 3 vertices is
 * treated as empty and always returns false.
 */
function isPointInPolygon(point, polygon) {
    if (polygon.length < 3)
        return false;
    let inside = false;
    const { x, y } = point;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

export { isPointInPolygon };
