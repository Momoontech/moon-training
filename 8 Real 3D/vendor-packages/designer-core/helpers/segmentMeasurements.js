import getPoint from '../components/Node/helpers/getPoint.js';
import SetValueCommand from '../components/commands/SetValueCommand.js';

/**
 * Compute the length of a room segment (distance between its two endpoints).
 */
const computeSegmentLength = (core, segment) => {
    const fromPoint = getPoint(core, segment.from.get());
    const toPoint = getPoint(core, segment.to.get());
    const dx = fromPoint.position.x.get() - toPoint.position.x.get();
    const dy = fromPoint.position.y.get() - toPoint.position.y.get();
    return Math.sqrt(dx * dx + dy * dy);
};
/**
 * Compute wall direction axes and length from a segment's endpoints.
 * Returns axis-aligned defaults with Infinity length if the segment
 * cannot be resolved (e.g. node has no parent room segment).
 */
const computeWallInfo = (core, segment) => {
    const fromPt = getPoint(core, segment.from.get());
    const toPt = getPoint(core, segment.to.get());
    const dx = toPt.position.x.get() - fromPt.position.x.get();
    // Point uses V2Axes where .y corresponds to the 3D z-axis
    const dz = toPt.position.y.get() - fromPt.position.y.get();
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
        return {
            wallAxes: {
                widthAxis: { x: dx / len, z: dz / len },
                depthAxis: { x: -dz / len, z: dx / len }
            },
            wallLength: len
        };
    }
    return {
        wallAxes: {
            widthAxis: { x: 1, z: 0 },
            depthAxis: { x: 0, z: 1 }
        },
        wallLength: 0
    };
};
/**
 * Create commands to resize a wall segment to a new length.
 * Scales the "from" point position relative to the fixed "to" point.
 * Returns null when the new length is invalid or the segment has zero length.
 */
const setSegmentLength = (core, segment, newLength) => {
    if (newLength <= 0)
        return [];
    const fromPoint = getPoint(core, segment.from.get());
    const toPoint = getPoint(core, segment.to.get());
    const toX = toPoint.position.x.get();
    const toY = toPoint.position.y.get();
    const dx = fromPoint.position.x.get() - toX;
    const dy = fromPoint.position.y.get() - toY;
    const currentLen = Math.sqrt(dx * dx + dy * dy);
    if (currentLen === 0)
        return [];
    const scale = newLength / currentLen;
    return [
        new SetValueCommand(fromPoint.position.x, toX + dx * scale),
        new SetValueCommand(fromPoint.position.y, toY + dy * scale)
    ];
};

export { computeSegmentLength, computeWallInfo, setSegmentLength };
