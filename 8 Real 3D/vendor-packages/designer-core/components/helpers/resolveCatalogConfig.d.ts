import { CatalogConfig, NodeCatalogConfig, PartArrayCatalogConfig } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { ValueOptionsType } from '../Value';
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
export declare function resolveCatalogConfig(core: CoreDesigner, value: CatalogConfig, options?: ValueOptionsType): NodeCatalogConfig | PartArrayCatalogConfig | null;
