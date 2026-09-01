import { applyPanelThickness } from './sectionRules/applyPanelThickness.js';
import { getMinSectionCount } from './sectionRules/getMinSectionCount.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getTargetSectionWidth } from './sectionRules/getTargetSectionWidth.js';
import { DEFAULT_SECTION_CALC_CONFIG } from './types.js';

/**
 * Width -> section count + usable inside width. A thin pipeline over the
 * single-rule helpers in `sectionRules/` — no business logic lives here, so each
 * rule stays independently editable and testable:
 *
 *   targetWidth = getTargetSectionWidth(desired)          (divide by widest)
 *   count       = getMinSectionCount(width, targetWidth)  (minimum sections)
 *               then clamp so panel-thickness usable width per section stays
 *               within [minSectionWidth, maxSectionWidth]
 *   usable      = applyPanelThickness(width, count)       (space net of panels)
 *
 * The width split itself (equal-floored fixed sections + one CTF balance) is
 * `distributeBalancedWidths`, applied later in `distributeSectionContents` once
 * the per-section categories — and thus the drawer width cap — are known.
 */
const calculateSectionCount = (availableWidth, desired, config = DEFAULT_SECTION_CALC_CONFIG) => {
    const { panelThickness, minSectionWidth, maxSectionWidth } = config;
    const targetWidth = getTargetSectionWidth(desired, config);
    let count = getMinSectionCount(availableWidth, targetWidth);
    // Too few sections would make each wider than allowed -> add sections.
    while (applyPanelThickness(availableWidth, count, panelThickness) / count > maxSectionWidth) {
        count += 1;
    }
    // Panel thickness eating space below the min width -> drop a section (>=1).
    while (count > 1 && applyPanelThickness(availableWidth, count, panelThickness) / count < minSectionWidth) {
        count -= 1;
    }
    const usable = applyPanelThickness(availableWidth, count, panelThickness);
    return { count, usable, warnings: [] };
};

export { calculateSectionCount, calculateSectionCount as default };
