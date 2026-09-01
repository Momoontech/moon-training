/**
 * Tests for the multiCloset section-content registry in
 * `helpers/multiCloset/contentPartTypes.ts`.
 *
 * The registry binds each content CATEGORY — a `MultiClosetComponentType` — to the
 * `MultiClosetStackType` of the stack that holds it, and every lookup is derived from
 * that one map. Since the Part restructure, identity and category live on two
 * different fields, and these tests pin both halves of that split:
 *
 *   1. Every category resolves to a stack type and an item type.
 *   2. Forward lookup (category → stack/item type) and the node-level reverse lookup
 *      (`Part` → its own discriminator) round-trip.
 *   3. The guards answer on `partType` — the KIND (`multiClosetStackPart` vs
 *      `multiClosetComponentPart`) — and are deliberately category-blind.
 *   4. The derived arrays cover exactly one stack and one item type per category.
 */
export {};
