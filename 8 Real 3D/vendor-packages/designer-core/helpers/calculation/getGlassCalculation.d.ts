import { Glass } from '../../components/Node/components/Glass';
import { GlassCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Glass → `{ glass }`.
 *
 * Core `Glass` carries `size` + `materialId` (no `shape`, no `grainDirection`),
 * so the area is the rectangular `size.x * size.y` (vesta derived it from the
 * glass polygon; core has no polygon here). Thickness comes from the resolved
 * glass material.
 */
export declare const getGlassCalculation: (core: CoreDesigner, node: Glass) => {
    glass: GlassCalculation;
};
