import { isCatalogPath } from '../helpers/isCatalogPath.js';
import { isInterpretedValue } from '../helpers/isInterpretedValue.js';
import { resolveCatalogConfig } from '../helpers/resolveCatalogConfig.js';
import { calculateArray } from './calculateArray.js';

/**
 * Resolve a `Value<T>`'s stored `IValue<T>` — plain literal, interpreted token array, or catalog
 * path — into a concrete `T`. Formula-bearing branches (`isInterpretedValue`, `isCatalogPath`)
 * dereference through `core`; the plain-literal branch ignores it. `Value<T>` guarantees a real
 * core at construction, so this function never receives `null`. Coreless callers (e.g. the
 * standalone paperspace state) must use `CoreSignal<T>` instead — that primitive skips this path
 * entirely.
 */
const calculateValue = (value, core, options) => {
    if (isInterpretedValue(value)) {
        return calculateArray(value, core, options);
    }
    else if (isCatalogPath(value)) {
        const imported = resolveCatalogConfig(core, value, options);
        // An unresolvable path degrades to the raw path, matching the resolved-object
        // branch below. Never throw here: this runs inside `Value`'s `computed()`, and a
        // throwing computed re-throws on every read and permanently breaks any effect
        // subscribed to it. `importFromCatalog` threw the precise cause and
        // `resolveCatalogConfig` already warned with it — rethrowing a vaguer message
        // here would only report the same failure twice.
        // (Explicit, rather than leaning on `typeof null === 'object'` below.)
        if (!imported) {
            return value;
        }
        if (isInterpretedValue(imported)) {
            return calculateArray(imported, core, options);
        }
        else if (typeof imported === 'object') {
            return value;
        }
        else {
            return imported;
        }
    }
    else {
        return value;
    }
};

export { calculateValue };
