import type { Node } from '../../components/Node';
import type { CoreDesigner } from '../../designer-core';
/**
 * Whether `node` is an adjustable shelf BOARD: a `freeBoxContainerInteriorPart`
 * (fix-shelf divider) whose parent is a SHELVES stack. Only these boards MOVE
 * (reallocating 32mm holes between the compartments above/below); bay dividers
 * (parent = `FreeBoxContainer`) and drawer/hanger-stack dividers are NOT boards.
 *
 * Single source of truth shared by the editor3D selection drill-down
 * (`getSelectableNode`) and the front-elevation overlay classifier
 * (`Editor2DUI/SelectionOverlayUI` → `getSelectionKind`).
 *
 * The parent test reads the stack's `multiClosetStackType` through
 * `getCategoryForStackPartType(parent)` — NOT its `partType`, which is the
 * category-blind `multiClosetStackPart` and would match a drawer stack just as
 * happily.
 */
export declare const isMultiClosetShelfBoard: (core: CoreDesigner, node: Node) => boolean;
