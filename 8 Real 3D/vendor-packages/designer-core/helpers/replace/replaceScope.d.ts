import { CatalogConfig, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/** Catalog classification holding the section-content presets (Double Hung, Long Hung, Shelves, …). */
export declare const SECTION_CONTENT_CLASSIFICATION = "Contents";
/** What a Replace picker offers for one selection: what it can become, and what it already is. */
export interface ReplaceScope {
    /** Label of the catalog classification whose items the selection can be swapped for. */
    classification: string;
    /**
     * Its id. Labels are NOT unique — `Sliding` sits under both `Doors` and `Windows` — so resolving
     * the scope by label pulls in the other family's items.
     */
    classificationId: string;
    /** The path the selection was built from — a picker hides it. `null` when undeterminable. */
    currentPath: string | null;
}
/** The path a section's CONTENT was built from, or `null` for an empty section / no `catalogPath`. */
export declare const getSectionContentCatalogPath: (core: CoreDesigner, nodeId: UUID) => string | null;
/**
 * The classification + path a placed product was built from, located by NAME (`catalogPath` is seeded
 * on `Part`, not `Item`) via `resolveCatalogPreview` — the resolver a picker's TILES render from.
 */
export declare const getItemCatalogEntry: (core: CoreDesigner, nodeId: UUID) => ReplaceScope | null;
/**
 * Can `catalogPath` stand in for `nodeId` — today the MOUNT, matched as a FULL SET: a candidate must
 * declare exactly the selection's `mountTypes`, so a `['wall']` upper is never offered for a base.
 */
export declare const isCompatibleReplacement: (core: CoreDesigner, nodeId: UUID, catalogPath: CatalogConfig) => boolean;
/**
 * The picker's scope for `nodeId`, or `null` when it has nothing to offer — a SECTION gets the content
 * presets, a product ITEM its own category. Mirrors `applyReplaceNode`'s branches, so they can't drift.
 */
export declare const getReplaceScope: (core: CoreDesigner, nodeId: UUID) => ReplaceScope | null;
