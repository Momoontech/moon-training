import { ProfilePoint } from './profileH';
/**
 * Returns a new profile with horizontal "wing" knots prepended/appended so the
 * profile spans `[xMin, xMax]`. The wings are flat — same `y` as the adjacent
 * end-knot — so they extend the cathedral with flat slabs that bridge any gap
 * between the user-supplied profile and the room footprint.
 *
 * Pure: never mutates `points`. Idempotent: if the profile already covers
 * `[xMin, xMax]` (or `points` is empty), returns the input array unchanged.
 */
export declare const extendProfileToCoverFootprint: (points: ProfilePoint[], xMin: number, xMax: number) => ProfilePoint[];
