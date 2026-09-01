import { Panel } from '../../components/Node/components/Panel';
import { MiteredPanel } from '../../components/Node/components/MiteredPanel';
import { PanelCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Panel / MiteredPanel → `{ panels }`.
 *
 * A `Panel` carries a `shape` (area / bounds), `grainDirection`, `panelType`
 * and a resolvable material (`getMaterial` handles the doorStyle / melamineBox /
 * doorInsert resolution). A `MiteredPanel` in core has none of those — only
 * `size` — so it emits a size-derived line with no material (TODO(phase2):
 * source a mitered-panel material); with no `materialId` the roll-up skips it.
 *
 * Styled single-piece door panels are NOT counted as panels — they are counted
 * via their parent `Part` and merged into panels by the door-style rule in the
 * aggregate transform. This mirrors vesta's `doorStyle && calcType !== 'Five Piece'`
 * skip.
 */
export declare const getPanelCalculation: (core: CoreDesigner, node: Panel | MiteredPanel) => {
    panels: PanelCalculation;
} | null;
