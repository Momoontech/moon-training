const buildBaseWallFrame = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
        return {
            origin: { x: from.x, y: from.y },
            axis: { x: 1, y: 0 },
            normal: { x: 0, y: 1 },
            length: 0
        };
    }
    const ax = dx / length;
    const ay = dy / length;
    return {
        origin: { x: from.x, y: from.y },
        axis: { x: ax, y: ay },
        normal: { x: -ay, y: ax },
        length
    };
};
/** World/floorplan-local 2D point → base-wall local coords. */
const toBaseCoords = (p, frame) => {
    const dx = p.x - frame.origin.x;
    const dy = p.y - frame.origin.y;
    return {
        x: dx * frame.axis.x + dy * frame.axis.y,
        y: dx * frame.normal.x + dy * frame.normal.y
    };
};
/** Base-wall local coords → floorplan-local 2D. */
const fromBaseCoords = (b, frame) => {
    return {
        x: frame.origin.x + b.x * frame.axis.x + b.y * frame.normal.x,
        y: frame.origin.y + b.x * frame.axis.y + b.y * frame.normal.y
    };
};

export { buildBaseWallFrame, fromBaseCoords, toBaseCoords };
