import type { CoreDesigner } from '../../designer-core';
import type { ICatalog, ICatalogClassifications } from '../../declarations/Catalogs';
/** Resolves to a flat base-cabinet `Catalog<BaseCabinetConfig>` entry (no children). */
export declare const MOCK_CATALOG_PATH_BASE_CABINET = "master/cabinet/base";
/** Resolves to a base cabinet whose children list contains a string ref to the
 *  flat base cabinet. Use this to exercise CreateNodeFromCatalogCommand's
 *  recursive child-spawning path. */
export declare const MOCK_CATALOG_PATH_BASE_CABINET_WITH_CHILD = "master/cabinet/baseWithChild";
/** Unresolvable path — `catalog.master.cabinet.missing` is undefined. The
 *  command's `parseCatalog` → `createNode` chain throws when handed the
 *  resulting type-less object. Use to test the bad-path error branch. */
export declare const MOCK_CATALOG_PATH_MISSING = "master/cabinet/missing";
/**
 * Master catalog with two reachable entries:
 *   master/cabinet/base            — leaf cabinet with no children
 *   master/cabinet/baseWithChild   — cabinet whose children = [master/cabinet/base]
 *
 * Cast through `unknown` because the real `ICatalog` shape is much larger
 * than what these tests need; the cast is local and the fields tests care
 * about are exactly what `parseCatalog` reads.
 */
export declare const mockMasterCatalogSeeded: ICatalog;
/**
 * Replaces `core.storage.get('catalog').master` with the provided catalog.
 * Pair with `seedMockMasterCatalog(core)` for the canonical seeded catalog,
 * or pass a custom one for bespoke tests.
 */
export declare const installMasterCatalog: (core: CoreDesigner, catalog: ICatalog) => void;
/** Replaces `core.storage.get('catalog').private`. The default mock private catalog is empty. */
export declare const installPrivateCatalog: (core: CoreDesigner, catalog: ICatalog) => void;
/** Replaces the category tree `core.storage.get('catalogClassifications')` returns — the default mock tree is empty. */
export declare const installCatalogClassifications: (core: CoreDesigner, classifications: ICatalogClassifications) => void;
/** Installs `mockMasterCatalogSeeded` onto the core. Call in `beforeAll`. */
export declare const seedMockMasterCatalog: (core: CoreDesigner) => void;
