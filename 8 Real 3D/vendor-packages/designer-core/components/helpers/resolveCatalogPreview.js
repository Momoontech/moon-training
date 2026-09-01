import { resolveCatalogConfig } from './resolveCatalogConfig.js';

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
const resolveCatalogPreview = (core, value) => {
    // For a string drag, the last path segment is the natural no-image fallback
    // name (object/formula drags have no path to split — see name resolution below).
    const pathFallback = typeof value === 'string' ? (value.split('/').pop() ?? value) : undefined;
    const entry = resolveCatalogConfig(core, value);
    if (!entry) {
        return { name: pathFallback ?? 'Item' };
    }
    const image = entry['image'];
    const catalogPath = entry['catalogPath'];
    const name = entry['name'] ??
        entry['contentName'] ??
        // Object drags may still carry the originating path (`importFromCatalog`
        // injects `catalogPath` for string-sourced entries) — use its last segment.
        (typeof catalogPath === 'string' ? catalogPath.split('/').pop() : undefined) ??
        pathFallback ??
        'Unnamed';
    return { image, name };
};

export { resolveCatalogPreview };
