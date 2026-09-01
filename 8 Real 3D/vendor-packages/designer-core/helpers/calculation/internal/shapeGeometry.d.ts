import { CoreDesigner } from '../../../designer-core';
import ShapeValue from '../../../components/ShapeValue';
import { Vector2 } from '../../math';
/**
 * Evaluate a shape into a flat list of 2D points (curves sampled). Holes are
 * ignored for area/bounds — matching vesta, which took the outer `points.shape`.
 */
export declare const shapePoints: (core: CoreDesigner, shape: ShapeValue) => Vector2[];
/**
 * Per-edge lengths, one per curve point, aligned with the panel's `edgeMaterialIds`.
 * Edge `i` = `curvePoint[i] → curvePoint[(i+1)%n]`; its length is the tessellated length of the
 * segment REACHING `curvePoint[(i+1)%n]` (straight for lines, summed sub-segments for arc/bezier).
 * Does NOT skip `exists === 0` points, so indices stay aligned with the fixed-length
 * `edgeMaterialIds` array (unlike `shapePoints`, which inflates arcs/beziers and skips hidden points).
 */
export declare const shapeEdgeLengths: (core: CoreDesigner, shape: ShapeValue) => number[];
/**
 * Absolute polygon area of a shape. Rounded to 1e-4 to match vesta's
 * `Math.abs(Math.round(1e4 * ShapeUtils.area(...)) * 1e-4)`.
 */
export declare const shapeArea: (core: CoreDesigner, shape: ShapeValue) => number;
/** Axis-aligned bounding size (width x, height y) of a shape's polygon. */
export declare const shapeBounds: (core: CoreDesigner, shape: ShapeValue) => {
    width: number;
    height: number;
};
/**
 * Total length of a shape's polyline (sum of consecutive segment lengths, not
 * wrapped) — the core analogue of vesta summing `contour.getLength()`.
 */
export declare const contourLength: (core: CoreDesigner, shape: ShapeValue) => number;
