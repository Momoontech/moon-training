/**
 * editor3D drill-down selection for multiCloset:
 * Item → Section → Stack → Single Part, one level per click, parent-scoped.
 *
 * `getSelectableNode` walks UP from the clicked node and returns the first
 * ancestor selectable given the current `selectedNodeId`. The strict chain means:
 *   - nothing selected → the Item,
 *   - Item selected     → the Section,
 *   - Section selected  → the Stack,
 *   - Stack selected    → the adjustable shelf BOARD (a `freeBoxContainerInteriorPart` in a shelves stack),
 *   - and the empty COMPARTMENTS, bay dividers, and content-carcass-box-FBC wrappers are never selectable.
 *
 * Under the unified stack model a shelves stack holds empty COMPARTMENTS (shelf components)
 * interleaved with real shelf BOARDS (`freeBoxContainerInteriorPart`). The BOARD is the selectable
 * terminal target; the compartments are not selectable (in the app a click on a compartment pick box
 * is routed to the adjacent board by position — see `getShelfBoardForCompartmentClick`).
 *
 * Fixture (parent pointers; built leaf-first so the FreeBoxContainer stacker
 * effect sees its children at construction):
 *   Item(multiCloset, top-level)
 *     └ Section (multiClosetSection)
 *        └ Content (multiClosetSectionContent)
 *           └ Carcass └ BoxContainer └ Part └ FreeBoxContainer(multiCloset)
 *                 ├ fixShelf (freeBoxContainerInteriorPart)      ← bay divider, never selectable
 *                 ├ Stack (stackPart + shelvesStack)
 *                 │    ├ compartment (componentPart + shelf)      ← empty opening, NOT selectable
 *                 │    └ stackBoard (freeBoxContainerInteriorPart) ← the adjustable shelf board, selectable
 *                 └ DrawersStack (stackPart + drawersStack)
 *                      └ drawer (componentPart + drawer)          ← NOT selectable; the stack is terminal
 *
 * Every stack above is a `PartType.multiClosetStackPart` and every opening a
 * `PartType.multiClosetComponentPart`; the second name in each pair is the node's own
 * `multiClosetStackType` / `multiClosetComponentType`. The chain rules key off the KIND, while the
 * "is this opening drillable?" decision keys off the CATEGORY — which is why the fixture carries both.
 *
 * A drawers stack holds a single drawer that fills it, so the drawer is never a drill target — the
 * DRAWERS STACK is the deepest selectable level; for shelves the deepest level is the shelf BOARD.
 */
export {};
