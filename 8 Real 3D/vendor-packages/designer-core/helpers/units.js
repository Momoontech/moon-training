import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import { AngularUnits, LinearUnits } from '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import { DEG2RAD, RAD2DEG } from './math/constants.js';

// Linear typing patterns. Decimals: inch → 4, mm → 1. The integer part is
// CAPPED (inch ≤ 7 digits, mm ≤ 9) so a typed value can't reach the float-
// precision / exponential-notation regime (~1e21 prints as "1e+21"); the caps
// cover the 100 km ceiling with margin (see MAX_DIMENSION_*). The fractional
// group REQUIRES the dot (`(\.\d{0,N})?`) — without it the trailing `\d{0,N}`
// would silently absorb extra integer digits and defeat the cap.
const regExInches = /^(-)?\d{1,7}(\.\d{0,4})?$/;
const regExMm = /^(-)?\d{1,9}(\.\d?)?$/;
// Angle typing patterns (M3D-294): degrees ≤ 1 decimal and ≤ 3 integer digits
// (angles are 1–359); radians ≤ 2 decimals and ≤ 1 integer digit (an interior
// angle is < 2π ≈ 6.28). Same dot-required structure so integer digits stay
// capped. Permissive enough for incremental typing (`45`, `45.`, `45.5`; `1`,
// `1.`, `1.57`).
const regExDeg = /^\d{0,3}(\.\d?)?$/;
const regExRad = /^\d{0,1}(\.\d{0,2})?$/;
/**
 * Maximum supported linear dimension: **100 km**. Beyond this, values approach
 * the float-precision / exponential-notation regime and are meaningless for a
 * furniture / room designer. The stored unit is inches;
 * {@link displayLabelToParentValue} clamps committed values to this ceiling, and
 * the typing regexes above keep keystrokes well below the overflow regime.
 */
const MAX_DIMENSION_MM = 100_000_000; // 100 km
const MAX_DIMENSION_INCHES = MAX_DIMENSION_MM / 25.4; // ≈ 3,937,007.874
const roundWithNSigns = (value, n) => Math.round(Number(value) * 10 ** n) / 10 ** n;
const roundForUi = (t, currentUnits, particularUnits) => {
    const hasDotEnd = typeof t === 'string' && Boolean(t.match(/^\d+\.$/));
    let result = 0;
    switch (particularUnits || currentUnits) {
        case LinearUnits.INCH:
            result = roundWithNSigns(t, 4);
            break;
        case LinearUnits.MM:
            result = roundWithNSigns(t, 1);
            break;
    }
    return hasDotEnd ? `${result}.` : result;
};
const getUnitsRegex = (units) => {
    switch (units) {
        case LinearUnits.MM:
            return regExMm;
        case LinearUnits.INCH:
        default:
            return regExInches;
    }
};
const checkLabel = (startValue, units, prevValue, toFixedWithUnits, emptyValueAllowed) => {
    const val = String(startValue);
    let newValue = String(startValue);
    const regEx = getUnitsRegex(units);
    if (val.match(regEx) ||
        (toFixedWithUnits && units && String(roundForUi(Math.abs(Number(newValue)), units)).match(regEx))) {
        if (String(val)[0] === '0' && String(val)[1] !== '.' && String(val).length > 1) {
            newValue = String(val).slice(1);
        }
        if (toFixedWithUnits && units) {
            newValue = String(roundForUi(Math.abs(Number(newValue)), units));
            newValue = !startValue && emptyValueAllowed ? '' : newValue;
            if (val[val.length - 1] === '.' && newValue[newValue.length - 1] !== '.' && val.length > newValue.length) {
                newValue = `${newValue}.`;
            }
            if (val.indexOf('.') >= 0 &&
                val[val.length - 1] === '0' &&
                val.length > newValue.length &&
                (newValue[newValue.length - 1] !== '0' || newValue === '0' || newValue.indexOf('.') < 0)) {
                const rest = val.indexOf('.') >= 0 ? val.slice(val.indexOf('.')) : '0';
                const trimmedRest = rest.slice(0, rest.length > 4 ? 4 : rest.length);
                const beforeDot = newValue.indexOf('.') > 0 ? newValue.slice(0, newValue.indexOf('.')) : newValue;
                newValue = (beforeDot + trimmedRest).match(regEx) ? beforeDot + trimmedRest : newValue;
            }
        }
        if (newValue[0] === '-') {
            newValue = newValue.slice(1);
        }
        return newValue;
    }
    return isNaN(Number(prevValue)) ? '0' : prevValue;
};
const convertUnits = (value, units) => {
    switch (units) {
        case LinearUnits.INCH:
            return String(value);
        case LinearUnits.MM:
            return String(roundWithNSigns(value * 25.4, 1));
        default:
            return '';
    }
};
const formatInputLabel = (inchesValue, units, prevDisplay, toFixedWithUnits, emptyValueAllowed) => {
    const convertedValue = convertUnits(Number(inchesValue), units);
    return checkLabel(convertedValue, units, prevDisplay, toFixedWithUnits, emptyValueAllowed);
};
const getUnitsData = (units) => {
    switch (units) {
        case LinearUnits.INCH:
            return ['"'];
        case LinearUnits.MM:
            return ['mm'];
        default:
            return [];
    }
};
const isEmptyOrZeroLikeDisplay = (trimmed) => {
    let t = trimmed.trim();
    if (t === '' || t === '.')
        return true;
    if (t.startsWith('-'))
        t = t.slice(1);
    if (t === '')
        return false;
    if (t[0] === '.') {
        let i = 1;
        while (i < t.length && t[i] === '0')
            i += 1;
        return i > 1 && i === t.length;
    }
    if (t[0] !== '0')
        return false;
    let i = 1;
    while (i < t.length && t[i] === '0')
        i += 1;
    if (i === t.length)
        return true;
    if (t[i] !== '.')
        return false;
    i += 1;
    while (i < t.length && t[i] === '0')
        i += 1;
    return i === t.length;
};
/** Blur text is in display units; parent `value` is stored length in inches. */
const displayLabelToParentValue = (trimmed, prevValue, units) => {
    if (isEmptyOrZeroLikeDisplay(trimmed))
        return Number(prevValue);
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n))
        return Number(prevValue);
    const inches = units === LinearUnits.MM ? n / 25.4 : n;
    // Clamp to the 100 km ceiling — the precise overflow guard (the typing regexes
    // only coarsely bound digit count). Lower bound is left to callers (they reject ≤ 0).
    return Math.min(inches, MAX_DIMENSION_INCHES);
};
// --- Angular units (M3D-294) ---------------------------------------------
// The angle UI works internally in degrees (corner-angle badges, AnglesUI
// geometry). These helpers mirror the linear ones above so display rounding,
// validation, and the deg↔display conversion all key off `AngularUnits`:
// degrees → 1 decimal place, radians → 2 decimal places.
/**
 * Round an angle value (already expressed in `units`) for UI: deg → 1 decimal,
 * rad → 2 decimals. Angles are always numeric (unlike linear values, whose input
 * field can hold a raw string), so this takes `number` — no string coercion.
 */
const roundAngleForUi = (value, units) => {
    switch (units) {
        case AngularUnits.RAD:
            return roundWithNSigns(value, 2);
        case AngularUnits.DEG:
        default:
            return roundWithNSigns(value, 1);
    }
};
const getAngularUnitsRegex = (units) => {
    switch (units) {
        case AngularUnits.RAD:
            return regExRad;
        case AngularUnits.DEG:
        default:
            return regExDeg;
    }
};
/** Internal degree value → display units (deg passthrough, deg → rad). */
const convertAngleUnits = (degValue, units) => units === AngularUnits.RAD ? degValue * DEG2RAD : degValue;
/** Display-units value → internal degree value (deg passthrough, rad → deg). */
const displayAngleToParentValue = (displayValue, units) => units === AngularUnits.RAD ? displayValue * RAD2DEG : displayValue;
/** Format an internal degree angle as a display string in `units`, rounded per the M3D-294 rule. */
const formatAngleLabel = (degValue, units) => String(roundAngleForUi(convertAngleUnits(degValue, units), units));
/** Unit suffix for an angle input (`°` for degrees, `rad` for radians). */
const getAngularUnitsData = (units) => (units === AngularUnits.RAD ? 'rad' : '°');

export { MAX_DIMENSION_INCHES, MAX_DIMENSION_MM, checkLabel, convertAngleUnits, convertUnits, displayAngleToParentValue, displayLabelToParentValue, formatAngleLabel, formatInputLabel, getAngularUnitsData, getAngularUnitsRegex, getUnitsData, getUnitsRegex, isEmptyOrZeroLikeDisplay, roundAngleForUi, roundForUi, roundWithNSigns };
