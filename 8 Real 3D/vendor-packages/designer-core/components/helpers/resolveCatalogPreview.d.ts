import { CatalogConfig } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
export type CatalogPreview = {
    image?: string;
    name?: string;
};
/**
 * Resolve a display thumbnail + name from a `CatalogConfig` (a path string, a
 * formula, a `source`-linked partial, or a full inline object), following the
 * `source` chain via {@link resolveCatalogConfig}. Mirrors the sales-client's
 * `resolvePreviewItem`.
 *
 * Never throws: for string/formula configs `resolveCatalogConfig` walks the
 * catalog tree with an unguarded `s = s[seg]`, so an invalid or not-yet-loaded
 * path throws a TypeError. Callers driving live UI (e.g. a drag-ghost
 * `useSignalEffect`, which does not re-subscribe after an effect throws) rely on
 * this degrading to the name-only fallback instead of throwing.
 */
export declare const resolveCatalogPreview: (core: CoreDesigner, value: CatalogConfig) => CatalogPreview;
