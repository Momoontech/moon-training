/**
 * A catalog path is a `store/Section/Group/Entry` leaf — the `master/` / `private/` store
 * prefix, and NOT a trailing slash. A trailing slash marks the string as a path *prefix*
 * rather than an entry: the six `*ConfigurationPrefix` project attributes
 * (`stringAttributesList`) hold values like `master/Shelf Types/General/`, and the catalog
 * formulas that consume them append the leaf themselves
 * (`[{ projectAttribute: 'ShelfConfigurationPrefix' }, { operator: '+"MelamineSlab"' }]`).
 *
 * Without the trailing-slash test, `calculateValue` routes each prefix into
 * `importFromCatalog`, whose walk dies on the empty final segment and warns
 * `Catalog path not found: master/Shelf Types/General/, exact key: ` every time the
 * attribute's `Value` recomputes. That resolution then degrades straight back to this same
 * raw string, so the warn reported nothing actionable — treating the prefix as the plain
 * literal it is returns the identical value without the failed tree walk.
 */
const isCatalogPath = (value) => {
    return (typeof value === 'string' && (value.startsWith('master/') || value.startsWith('private/')) && !value.endsWith('/'));
};

export { isCatalogPath };
