import { CeilingType } from '../declarations/SurfaceSettings';
/** A knot of a room's base-wall profile: `x` along the base wall, `y` its height. */
export interface BasePoint {
    x: number;
    y: number;
}
/**
 * The base-wall profile a room should hold for its ceiling type. Sloped carries its two
 * ends; cathedral and other keep every edited knot, with only the far end re-anchored to
 * the base wall's length; any other ceiling carries no profile.
 */
export declare const nextRoomBasePoints: (ceilingType: CeilingType, existing: BasePoint[], length: number, roomHeight: number) => BasePoint[];
