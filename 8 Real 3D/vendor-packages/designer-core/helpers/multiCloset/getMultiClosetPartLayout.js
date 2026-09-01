import getItem from '../../components/Node/helpers/getItem.js';
import getPart from '../../components/Node/helpers/getPart.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
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

/**
 * Builds the ordered along-wall dimension list for a multiCloset's sections and
 * separators. Returns an empty array when `itemId` is not a multiCloset.
 *
 * Pure read — every `.get()` is signal-tracked, so call it inside a
 * `useComputedValue` (or any Preact-signal scope) to re-run when a section is
 * resized or the balance section reflows.
 *
 * Entries are sorted by `localX` so the result reads left-to-right along the
 * wall regardless of the order ids happen to sit in `sections` / `separators`.
 */
const getMultiClosetPartLayout = (core, itemId) => {
    const item = getItem(core, itemId);
    if (item.itemType.get() !== ItemType.multiCloset)
        return [];
    const entries = [];
    for (const separatorId of item.separators.get()) {
        const separator = getPart(core, separatorId);
        entries.push({
            id: separatorId,
            kind: 'separator',
            localX: separator.position.x.get(),
            width: separator.size.x.get(),
            editable: false
        });
    }
    for (const sectionId of item.sections.get()) {
        const section = getPart(core, sectionId);
        entries.push({
            id: sectionId,
            kind: 'section',
            localX: section.position.x.get(),
            width: section.size.x.get(),
            // Auto-sized (balance) section's width is recomputed by the layout effect,
            // so typing into it would be overwritten — treat it as read-only.
            editable: !(section.isAutoSized?.get() ?? 0)
        });
    }
    entries.sort((a, b) => a.localX - b.localX);
    return entries;
};

export { getMultiClosetPartLayout };
