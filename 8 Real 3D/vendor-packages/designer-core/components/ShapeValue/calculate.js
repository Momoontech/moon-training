import { getMonitor } from '../../helpers/monitor.js';
import { importFromCatalog } from '../helpers/importFromCatalog.js';
import { isInterpretedShape } from '../helpers/isInterpretedShape.js';
import { isInterpretedValue } from '../helpers/isInterpretedValue.js';
import { calculateValue } from '../Value/calculate.js';
import { importSourceFromCatalog } from '../helpers/importSourceFromCatalog.js';

// const calculateCurvePoint = (
//   json: InterpretedCurvePoint,
//   path: Path,
//   core: CoreDesigner,
//   options: ValueOptionsType
// ) => {
//   const exists = calculateValue<number>(json.exists || 1, core, options);
//   if (!exists) {
//     return;
//   }
//   if (!json.type || json.type === 'moveTo') {
//     const x = calculateValue<number>(json.x, core, options);
//     const y = calculateValue<number>(json.y, core, options);
//     path.moveTo(x, y);
//   } else if (json.type === 'lineTo') {
//     const x = calculateValue<number>(json.x, core, options);
//     const y = calculateValue<number>(json.y, core, options);
//     path.lineTo(x, y);
//   } else if (json.type === 'arcTo') {
//     /* elliptic or circular arc*/
//     const centerX = calculateValue<number>(json.center.x, core, options);
//     const centerY = calculateValue<number>(json.center.y, core, options);
//     const radius = calculateValue<number>(json.radius, core, options);
//     const radiusY = json.radiusY ? calculateValue<number>(json.radiusY, core, options) : radius;
//     const rotation = json.rotation ? calculateValue<number>(json.rotation, core, options) : 0;
//     const startAngle = MathUtils.DEG2RAD * calculateValue<number>(json.startAngle, core, options);
//     const endAngle = MathUtils.DEG2RAD * calculateValue<number>(json.endAngle, core, options);
//     const clockwise = !!calculateValue<number>(json.clockwise, core, options);
//     path.absellipse(centerX, centerY, radius, radiusY, startAngle, endAngle, clockwise, rotation);
//   } else if (json.type === 'bezierCurveTo') {
//     /* Quadratic Bezier*/
//     path.quadraticCurveTo(
//       calculateValue<number>(json.controlPoint1.x, core, options),
//       calculateValue<number>(json.controlPoint1.y, core, options),
//       calculateValue<number>(json.x, core, options),
//       calculateValue<number>(json.y, core, options)
//     );
//   }
//   /* else if ( json.type === 'cubicBezierCurveTo' ) { // Cubic Bezier
//     const point = Reflect.apply( calculateVector2, this, [json] );
//     const controlPoint1 = Reflect.apply( calculateVector2, this, [json.controlPoint1] );
//     const controlPoint2 = Reflect.apply( calculateVector2, this, [json.controlPoint2] );
//     path.bezierCurveTo( controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, point.x, point.y );
//   }*/
// };
// const calculateCurve = (curve: InterpretedCurve, path: Path, core: CoreDesigner, options: ValueOptionsType) => {
//   for (let i = 0; i < curve.length; i += 1) {
//     calculateCurvePoint(curve[i], path, core, options);
//   }
// };
// const createShape = (core: CoreDesigner, value: InterpretedShape, options: ValueOptionsType): Shape => {
//   const shape = new Shape();
//   calculateCurve(value.curve, shape, core, options);
//   if (value.holes) {
//     for (let i = 0; i < (value.holes || []).length; i += 1) {
//       const path = new Path();
//       calculateCurve(value.holes[i], path, core, options);
//       shape.holes.push(path);
//     }
//   }
//   return shape;
// };
const calculateShape = (value, core, options) => {
    // `importFromCatalog` throws on any unresolvable path, and all three catalog
    // branches below can reach it. This runs inside `ShapeValue`'s `computed()`, where
    // a throw re-throws on every read and permanently breaks any effect subscribed to
    // it — so a missing entry degrades to the same empty shape an unrecognised value
    // already falls back to, rather than taking the subscription down with it.
    try {
        if (isInterpretedValue(value)) {
            return importFromCatalog(core, calculateValue(value, core, options));
            // return createShape(
            //   core,
            //   importFromCatalog(core, calculateValue(value, core, options) as unknown as string) as InterpretedShape,
            //   options
            // );
        }
        else if (isInterpretedShape(value)) {
            return value;
            // return createShape(core, value, options);
        }
        else if (typeof value === 'string') {
            return importFromCatalog(core, value);
            // return createShape(core, importFromCatalog(core, value) as InterpretedShape, options);
        }
        else if (typeof value === 'object' && value !== null && 'source' in value) {
            // Handle shapes with source and optional holes/curve overrides
            const resolved = importSourceFromCatalog(core, value, options);
            const valueWithShape = value;
            // If the value has holes or curve defined, use them; otherwise use resolved
            const result = {
                curve: valueWithShape.curve || resolved.curve || [],
                holes: valueWithShape.holes || resolved.holes
            };
            return result;
        }
    }
    catch (error) {
        getMonitor().warn('calculateShape: catalog resolution failed, returning empty Shape as fallback.', value, error);
        return { curve: [] };
    }
    getMonitor().warn('calculateShape: Unable to calculate shape, returning empty Shape as fallback.', value);
    return { curve: [] };
};

export { calculateShape };
