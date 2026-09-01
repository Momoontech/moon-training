import type Value from '../components/Value';
import { ICatalog, ICatalogClassifications } from './Catalogs';
import { V3Axes } from './InterpretedLine';
import { looksAPI, materials, models3DAPI } from './Loader';
export interface ICoreStorage {
    materials: materials;
    looks: looksAPI;
    models3D: models3DAPI;
    /**
     * Per-model geometric bounding box, keyed by the model's `modelId`
     * (`model3D._id`). Populated by the renderer (designer3d `loadModel3D`) after a
     * GLB loads and its AABB is measured; headless core leaves it empty. Read by the
     * `size` token fallback for Models that have no explicit `size` Value (hardware
     * pulls, legs, …), so pull-centering formulas (`defaultPullPositionX/Y`) can
     * offset by the real handle dimensions instead of `0`. The renderer keeps its
     * own source-keyed cache (with the loaded `Group`s); this core store holds only
     * the reactive `size`/`origin` Values, sharing the same instances so a single
     * `.set()` after measurement updates both.
     */
    models: {
        [modelId: string]: {
            size: Value<Record<V3Axes, number>>;
            origin: Value<Record<V3Axes, number>>;
        };
    };
    catalog: {
        master: Partial<ICatalog>;
        private: Partial<ICatalog>;
    };
    catalogClassifications: ICatalogClassifications;
}
