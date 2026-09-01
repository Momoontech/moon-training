import { Part } from '../components/Node/components/Part';
import { Command } from '../components/commands/core/Command';
import { CoreDesigner } from '../designer-core';
export type PartSizeAxis = 'width' | 'height' | 'depth';
export interface PartSizeLimits {
    width: {
        min: number;
        max: number;
    };
    height: {
        min: number;
        max: number | null;
    };
    depth: {
        min: number;
        max: number;
    };
}
export declare const getPartSizeLimits: (core: CoreDesigner, part: Part) => PartSizeLimits;
/**
 * Build a command to resize a Part (section) on a single axis.
 *
 * Uses SetNodeVectorComponentCommand (single axis) instead of
 * SetNodeVector3Command (all 3 axes) to preserve formulas on untouched axes.
 * Part sizes often reference the parent Item via formula tokens like
 * `productSize.z` — overwriting all axes would destroy those links.
 *
 * Width: clamped to WIDTH.MIN and available space in parent multi-closet.
 * Height: no upper bound (just > 0).
 * Depth: clamped to DEPTH.MIN / DEPTH.MAX.
 */
export declare const setPartSize: (core: CoreDesigner, part: Part, axis: PartSizeAxis, val: number) => Command | null;
