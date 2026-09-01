export type ProfilePoint = {
    x: number;
    y: number;
};
/**
 * Clamped piecewise-linear interpolation of `points.y` keyed by `x`.
 *
 * - When `x` is below the first knot, returns the first knot's `y`.
 * - When `x` is above the last knot, returns the last knot's `y`.
 * - When the array is empty, returns `0`.
 *
 * Assumes `points` are sorted by ascending `x`.
 */
export declare const evalProfileH: (points: ProfilePoint[], x: number) => number;
/**
 * Returns the `x` values of all knots whose `x` lies STRICTLY inside
 * the open interval `(xMin, xMax)`. Used to insert kinks into wall
 * top profiles and to drive the boundaries between ceiling facets.
 *
 * Assumes `points` are sorted by ascending `x`.
 */
export declare const getKnotsInRange: (points: ProfilePoint[], xMin: number, xMax: number) => number[];
