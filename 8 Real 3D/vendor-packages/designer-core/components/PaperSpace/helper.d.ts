import { dimensions, IMarginSizes, IRulerLines, viewType } from '../../declarations';
type TCreateRulerSizesProps = {
    fontSize?: number;
    rulerLines: IRulerLines;
    dimensions: dimensions;
    viewType: viewType;
};
/**
 * Create ruler sizes based on view type and dimensions
 * Calculates the margin sizes needed for rulers based on the view type
 */
export declare const createRulerSizes: ({ fontSize, rulerLines, dimensions, viewType }: TCreateRulerSizesProps) => IMarginSizes;
export {};
