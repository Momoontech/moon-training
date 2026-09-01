import { AngularUnits, LinearUnits } from '../declarations';
/**
 * Maximum supported linear dimension: **100 km**. Beyond this, values approach
 * the float-precision / exponential-notation regime and are meaningless for a
 * furniture / room designer. The stored unit is inches;
 * {@link displayLabelToParentValue} clamps committed values to this ceiling, and
 * the typing regexes above keep keystrokes well below the overflow regime.
 */
export declare const MAX_DIMENSION_MM = 100000000;
export declare const MAX_DIMENSION_INCHES: number;
export declare const roundWithNSigns: (value: number | string, n: number) => number;
export declare const roundForUi: (t: string | number, currentUnits: LinearUnits, particularUnits?: LinearUnits) => string | number;
export declare const getUnitsRegex: (units: LinearUnits) => RegExp;
export declare const checkLabel: (startValue: string | number, units: LinearUnits, prevValue: string, toFixedWithUnits?: boolean, emptyValueAllowed?: boolean) => string;
export declare const convertUnits: (value: number, units: LinearUnits) => string;
export declare const formatInputLabel: (inchesValue: number, units: LinearUnits, prevDisplay: string, toFixedWithUnits: boolean, emptyValueAllowed: boolean) => string;
export declare const getUnitsData: (units: LinearUnits) => string[];
export declare const isEmptyOrZeroLikeDisplay: (trimmed: string) => boolean;
/** Blur text is in display units; parent `value` is stored length in inches. */
export declare const displayLabelToParentValue: (trimmed: string, prevValue: string, units: LinearUnits) => number;
/**
 * Round an angle value (already expressed in `units`) for UI: deg → 1 decimal,
 * rad → 2 decimals. Angles are always numeric (unlike linear values, whose input
 * field can hold a raw string), so this takes `number` — no string coercion.
 */
export declare const roundAngleForUi: (value: number, units: AngularUnits) => number;
export declare const getAngularUnitsRegex: (units: AngularUnits) => RegExp;
/** Internal degree value → display units (deg passthrough, deg → rad). */
export declare const convertAngleUnits: (degValue: number, units: AngularUnits) => number;
/** Display-units value → internal degree value (deg passthrough, rad → deg). */
export declare const displayAngleToParentValue: (displayValue: number, units: AngularUnits) => number;
/** Format an internal degree angle as a display string in `units`, rounded per the M3D-294 rule. */
export declare const formatAngleLabel: (degValue: number, units: AngularUnits) => string;
/** Unit suffix for an angle input (`°` for degrees, `rad` for radians). */
export declare const getAngularUnitsData: (units: AngularUnits) => string;
