import { Model } from '../components/Node/components/Model';
import Value from '../components/Value';
import { V3Axes } from '../declarations';
import { CoreDesigner } from '../designer-core';
export type ModelBBox = {
    size: Value<Record<V3Axes, number>>;
    origin: Value<Record<V3Axes, number>>;
};
/**
 * Get-or-create a Model node's bounding-box entry in the `models` store, keyed by
 * its `modelId` (`model3D._id`, resolved through the node's material). The store
 * is the shared source of truth for GLB dimensions: the renderer (designer3d
 * `loadModel3D`) measures the loaded model and `.set()`s its size/origin here.
 *
 * Get-or-creating a zero-defaulted entry — rather than returning a bare `0` — is
 * what lets the caller's computed subscribe to the `size` Value, so a formula
 * re-evaluates once the renderer publishes the real dimensions. Returns
 * `undefined` when the node has no resolvable modelId (nothing to size against,
 * e.g. a Model with no material), leaving the caller to fall back to `0`.
 */
export declare const getModelBBox: (core: CoreDesigner, node: Model) => ModelBBox | undefined;
export default getModelBBox;
