export type Vec2 = {
    x: number;
    y: number;
};
/**
 * 2D orthonormal frame attached to the base wall.
 *
 *   origin = the base wall's `from` point in floorplan-local 2D
 *           (i.e. using `Point.position.y.getTransformed()` for Y).
 *   axis   = unit vector along the wall, pointing from `from` to `to`.
 *   normal = `axis` rotated 90° CCW. With CCW-from-above room footprints
 *            in floorplan-local coords, this points into the room interior.
 */
export type BaseWallFrame = {
    origin: Vec2;
    axis: Vec2;
    normal: Vec2;
    /** Distance from `from` to `to` (length of the base wall along its axis). */
    length: number;
};
export declare const buildBaseWallFrame: (from: Vec2, to: Vec2) => BaseWallFrame;
/** World/floorplan-local 2D point → base-wall local coords. */
export declare const toBaseCoords: (p: Vec2, frame: BaseWallFrame) => Vec2;
/** Base-wall local coords → floorplan-local 2D. */
export declare const fromBaseCoords: (b: Vec2, frame: BaseWallFrame) => Vec2;
