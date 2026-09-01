const getBoundingBox = (points) => {
    if (points.length === 0)
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
};
/**
 * Type guard to check if rulerLines has wall view structure (top/bottom/left/right properties)
 */
const isWallRulerLines = (rulerLines) => {
    return (typeof rulerLines === 'object' &&
        rulerLines !== null &&
        ('top' in rulerLines || 'bottom' in rulerLines || 'left' in rulerLines || 'right' in rulerLines));
};
/**
 * Convert shape by offsetting it inward/outward.
 * Placeholder: returns the same points; can be implemented with polygon offset logic later.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertShape = (points, _thickness) => points;
/**
 * Create ruler sizes based on view type and dimensions
 * Calculates the margin sizes needed for rulers based on the view type
 */
const createRulerSizes = ({ fontSize = 12, rulerLines, dimensions, viewType }) => {
    const extendedViewType = viewType;
    if (extendedViewType === '3d') {
        return {
            left: 0,
            right: 0,
            bottom: 0,
            top: 0
        };
    }
    const wallLikeViews = ['wall', 'island', 'column', 'islandbase'];
    if (wallLikeViews.includes(extendedViewType)) {
        if (isWallRulerLines(rulerLines)) {
            const wallRulerLines = rulerLines;
            return {
                left: (wallRulerLines.left?.length || 0) * fontSize * 2,
                right: (wallRulerLines.right?.length || 0) * fontSize * 2.5,
                bottom: (wallRulerLines.bottom?.length || 0) * fontSize * 2.5,
                top: (wallRulerLines.top?.length || 0) * fontSize * 2
            };
        }
    }
    if (!dimensions?.root?.walls) {
        return { left: 0, right: 0, top: 0, bottom: 0 };
    }
    const { root: { walls } } = dimensions;
    const wallsArray = Object.keys(walls);
    Math.max(...wallsArray.map((key) => (rulerLines[key]?.length || 0) * 100));
    const points = wallsArray.map((key) => ({
        x: walls[key].leftBottom.u,
        y: walls[key].leftBottom.v
    }));
    const insidePoints = convertShape(points);
    const box = getBoundingBox(points);
    const insideBox = getBoundingBox(insidePoints);
    return {
        left: insideBox.minX - box.minX,
        right: box.maxX - insideBox.maxX,
        bottom: box.maxY - insideBox.maxY,
        top: insideBox.minY - box.minY
    };
};

export { createRulerSizes };
