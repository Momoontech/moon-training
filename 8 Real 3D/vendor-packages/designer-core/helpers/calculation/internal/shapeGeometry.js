import { calculateValue } from '../../../components/Value/calculate.js';
import { Box2 } from '../../math/Box2.js';
import '../../math/plane/unitBoxCorners.js';
import '../../math/plane/projectUnitBoxToFootprint2D.js';
import { Vector2 } from '../../math/Vector2.js';

/**
 * Geometry primitives for the calculation layer.
 *
 * A core `ShapeValue.get()` returns an `InterpretedShape` whose curve points
 * still carry `x`/`y` as `IValue<number>` (literal or formula) — there is no
 * tessellated point list, no `ShapeUtils.area`, no built geometry (unlike the
 * moon-vesta scene which read Three.js `Shape.extractPoints()` / `ShapeUtils`).
 * So we evaluate each point through `calculateValue` (using the shape's own
 * options, which carry the owning node id) and compute area / bounds / length
 * from the resulting polyline.
 *
 * Straight (`lineTo`/`moveTo`) segments are exact. `arcTo` / `bezierCurveTo`
 * are sampled — an accepted v1 approximation; cabinet panels are overwhelmingly
 * rectangular (line-only), so the common case is exact.
 */
const DEG2RAD = Math.PI / 180;
const ARC_SEGMENTS = 12;
const BEZIER_SEGMENTS = 12;
const isLinePoint = (p) => !('type' in p) || p.type === undefined || p.type === 'lineTo' || p.type === 'moveTo';
/**
 * Tessellate ONE curve point into the 2D sub-points of the segment that reaches it from `prev`:
 * lineTo/moveTo → a single endpoint; arcTo → `ARC_SEGMENTS + 1` sampled points; bezierCurveTo →
 * `BEZIER_SEGMENTS` sampled points (from `prev`). Shared by `shapePoints` (flat outline) and
 * `shapeEdgeLengths` (per-edge length).
 */
const segmentPoints = (p, prev, core, options) => {
    if (isLinePoint(p)) {
        const line = p;
        return [new Vector2(calculateValue(line.x, core, options), calculateValue(line.y, core, options))];
    }
    if (p.type === 'arcTo') {
        const cx = calculateValue(p.center.x, core, options);
        const cy = calculateValue(p.center.y, core, options);
        const radius = calculateValue(p.radius, core, options);
        const radiusY = p.radiusY ? calculateValue(p.radiusY, core, options) : radius;
        const clockwise = !!calculateValue(p.clockwise, core, options);
        const start = calculateValue(p.startAngle, core, options) * DEG2RAD;
        let end = calculateValue(p.endAngle, core, options) * DEG2RAD;
        // Match Three.js absellipse sweep direction (approximate).
        if (!clockwise && end < start)
            end += Math.PI * 2;
        if (clockwise && end > start)
            end -= Math.PI * 2;
        const out = [];
        for (let s = 0; s <= ARC_SEGMENTS; s += 1) {
            const angle = start + (end - start) * (s / ARC_SEGMENTS);
            out.push(new Vector2(cx + radius * Math.cos(angle), cy + radiusY * Math.sin(angle)));
        }
        return out;
    }
    if (p.type === 'bezierCurveTo') {
        const cpx = calculateValue(p.controlPoint1.x, core, options);
        const cpy = calculateValue(p.controlPoint1.y, core, options);
        const ex = calculateValue(p.x, core, options);
        const ey = calculateValue(p.y, core, options);
        const out = [];
        for (let s = 1; s <= BEZIER_SEGMENTS; s += 1) {
            const t = s / BEZIER_SEGMENTS;
            const mt = 1 - t;
            out.push(new Vector2(mt * mt * prev.x + 2 * mt * t * cpx + t * t * ex, mt * mt * prev.y + 2 * mt * t * cpy + t * t * ey));
        }
        return out;
    }
    return [];
};
/**
 * Evaluate a shape into a flat list of 2D points (curves sampled). Holes are
 * ignored for area/bounds — matching vesta, which took the outer `points.shape`.
 */
const shapePoints = (core, shape) => {
    const interpreted = shape.get();
    const options = shape.getOptions();
    const curve = interpreted?.curve ?? [];
    const points = [];
    for (let i = 0; i < curve.length; i += 1) {
        const p = curve[i];
        const exists = p.exists === undefined ? 1 : calculateValue(p.exists, core, options);
        if (!exists)
            continue;
        const prev = points[points.length - 1] ?? new Vector2(0, 0);
        points.push(...segmentPoints(p, prev, core, options));
    }
    return points;
};
/**
 * Per-edge lengths, one per curve point, aligned with the panel's `edgeMaterialIds`.
 * Edge `i` = `curvePoint[i] → curvePoint[(i+1)%n]`; its length is the tessellated length of the
 * segment REACHING `curvePoint[(i+1)%n]` (straight for lines, summed sub-segments for arc/bezier).
 * Does NOT skip `exists === 0` points, so indices stay aligned with the fixed-length
 * `edgeMaterialIds` array (unlike `shapePoints`, which inflates arcs/beziers and skips hidden points).
 */
const shapeEdgeLengths = (core, shape) => {
    const curve = shape.get()?.curve ?? [];
    const n = curve.length;
    if (n === 0)
        return [];
    const options = shape.getOptions();
    // segs[k] = tessellated sub-points of the segment reaching curvePoint[k]; its last element is
    // curvePoint[k]'s endpoint.
    const segs = [];
    let prev = new Vector2(0, 0);
    for (let k = 0; k < n; k += 1) {
        const sub = segmentPoints(curve[k], prev, core, options);
        segs.push(sub);
        if (sub.length)
            prev = sub[sub.length - 1];
    }
    const endpoint = (k) => segs[k][segs[k].length - 1] ?? new Vector2(0, 0);
    const lengths = [];
    for (let i = 0; i < n; i += 1) {
        // Edge i's polyline: prev endpoint, then the destination segment's sampled points.
        const poly = [endpoint(i), ...segs[(i + 1) % n]];
        let len = 0;
        for (let j = 1; j < poly.length; j += 1)
            len += poly[j].distanceTo(poly[j - 1]);
        lengths.push(len);
    }
    return lengths;
};
/** Signed polygon area via the shoelace formula (positive = CCW). */
const signedArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i += 1) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return area / 2;
};
/**
 * Absolute polygon area of a shape. Rounded to 1e-4 to match vesta's
 * `Math.abs(Math.round(1e4 * ShapeUtils.area(...)) * 1e-4)`.
 */
const shapeArea = (core, shape) => {
    const points = shapePoints(core, shape);
    if (points.length < 3)
        return 0;
    return Math.abs(Math.round(1e4 * signedArea(points)) * 1e-4);
};
/** Axis-aligned bounding size (width x, height y) of a shape's polygon. */
const shapeBounds = (core, shape) => {
    const points = shapePoints(core, shape);
    if (points.length === 0)
        return { width: 0, height: 0 };
    const box = new Box2().setFromPoints(points);
    const size = new Vector2();
    box.getSize(size);
    return { width: size.x, height: size.y };
};

export { shapeArea, shapeBounds, shapeEdgeLengths, shapePoints };
