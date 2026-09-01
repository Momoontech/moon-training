import { getMonitor } from '../../helpers/monitor.js';
import { calculateValue } from '../Value/calculate.js';
import { importFromCatalog } from './importFromCatalog.js';
import { importSourceFromCatalog } from './importSourceFromCatalog.js';
import { isInterpretedValue } from './isInterpretedValue.js';

/**
 * Resolve any `CatalogConfig` — a catalog-path string, an `IValue<string>` formula,
 * a `source`-linked partial, or a full inline catalog object — into a source-resolved
 * catalog object.
 *
 * This is the canonical generalization of the previously-duplicated string-only peek
 * `importSourceFromCatalog(core, importFromCatalog(core, path), options)`, so the string
 * case behaves exactly as before; the formula/partial/object cases are new.
 *
 * Formulas are evaluated against the supplied `options`. Callers without a node context
 * (e.g. drag-visibility effects) pass the default `{}`, matching prior behavior.
 *
 * `importSourceFromCatalog` deep-clones its input, so passing an object config straight
 * through never mutates the value held by the caller (e.g. the `draggedCatalogPath` signal).
 */
function resolveCatalogConfig(core, value, options = {}) {
    let raw;
    try {
        if (typeof value === 'string') {
            // Catalog-path string → walk the catalog tree.
            raw = importFromCatalog(core, value);
        }
        else if (isInterpretedValue(value)) {
            // Formula → evaluate to a catalog-path string, then walk the tree.
            raw = importFromCatalog(core, calculateValue(value, core, options));
        }
        else {
            // Already an object catalog config (full or `source`-linked partial).
            raw = value;
        }
        return importSourceFromCatalog(core, raw, options);
    }
    catch (error) {
        // TODO: Remove this once we have a proper error handling system in place.
        if (!(error instanceof Error && error.message.startsWith('Catalog path not found'))) {
            getMonitor().warn('Error resolving catalog config', value, error);
        }
        return null;
    }
}

export { resolveCatalogConfig };
