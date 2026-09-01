/**
 * Constrain `value` to the inclusive range `[min, max]`.
 *
 * Assumes `min <= max` (the common contract, matching Three.js `MathUtils.clamp`).
 * If they are passed inverted, `max` wins — `Math.min` is applied last.
 *
 * @param value - the number to clamp
 * @param min - lower bound (inclusive)
 * @param max - upper bound (inclusive)
 * @returns `value` limited to `[min, max]`
 */
export declare function clamp(value: number, min: number, max: number): number;
