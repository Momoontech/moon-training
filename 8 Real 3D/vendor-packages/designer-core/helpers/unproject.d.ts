import { CoreDesigner } from '../designer-core';
import { Vector2, Vector3 } from './math';
export declare const coordinatesToNDC: (coord: Vector2, core: CoreDesigner) => Vector2;
export declare const unprojectNDC: (ndc: Vector2, core: CoreDesigner) => Vector3;
