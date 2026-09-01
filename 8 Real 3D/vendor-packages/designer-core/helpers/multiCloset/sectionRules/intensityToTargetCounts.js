import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { MultiClosetComponentType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

// Imported from `declarations`, NOT from the package root barrel: `src/index.ts` re-exports
// `designer-core.ts`, which reaches this file through `fillMultiClosets` → … → `sectionRules`,
// so a root-barrel import here closes a cycle that Rollup flags on every build. Its siblings
// (`getPreferredWidthRange`, `getTargetSectionWidth`) import from the same place.
const clampIntensity = (value) => Math.max(0, Math.min(5, value));
/**
 * Rule: map the three 0-5 desire sliders into per-category section counts that
 * sum to exactly `n`.
 *
 * Each category's desire (uniformly weighted) is normalized into a share of `n`
 * and floored, then leftover sections are handed out by largest fractional
 * remainder — but **only to categories with a non-zero intensity**, so a slider
 * set to 0 (e.g. drawers off) can never receive a section. Ties break by category
 * order; the all-zero case falls back to the first category.
 */
const intensityToTargetCounts = (desired, n) => {
    const counts = {
        [MultiClosetComponentType.multiClosetShelfPart]: 0,
        [MultiClosetComponentType.multiClosetShortHangerPart]: 0,
        [MultiClosetComponentType.multiClosetLongHangerPart]: 0,
        [MultiClosetComponentType.multiClosetDrawerPart]: 0
    };
    if (n <= 0)
        return counts;
    const weighted = {
        [MultiClosetComponentType.multiClosetShelfPart]: clampIntensity(desired[MultiClosetComponentType.multiClosetShelfPart]),
        [MultiClosetComponentType.multiClosetShortHangerPart]: clampIntensity(desired[MultiClosetComponentType.multiClosetShortHangerPart]),
        [MultiClosetComponentType.multiClosetLongHangerPart]: clampIntensity(desired[MultiClosetComponentType.multiClosetLongHangerPart]),
        [MultiClosetComponentType.multiClosetDrawerPart]: clampIntensity(desired[MultiClosetComponentType.multiClosetDrawerPart])
    };
    const total = weighted[MultiClosetComponentType.multiClosetShelfPart] +
        weighted[MultiClosetComponentType.multiClosetShortHangerPart] +
        weighted[MultiClosetComponentType.multiClosetLongHangerPart] +
        weighted[MultiClosetComponentType.multiClosetDrawerPart];
    // No expressed desire: fall back to the highest-priority (lowest number)
    // category for every slot so the closet is still filled deterministically.
    if (total <= 0) {
        const fallback = [
            MultiClosetComponentType.multiClosetShelfPart,
            MultiClosetComponentType.multiClosetShortHangerPart,
            MultiClosetComponentType.multiClosetLongHangerPart,
            MultiClosetComponentType.multiClosetDrawerPart
        ][0]; //.sort((a, b) => priorities[a] - priorities[b])[0];
        counts[fallback] = n;
        return counts;
    }
    const raw = {
        [MultiClosetComponentType.multiClosetShelfPart]: (weighted[MultiClosetComponentType.multiClosetShelfPart] / total) * n,
        [MultiClosetComponentType.multiClosetShortHangerPart]: (weighted[MultiClosetComponentType.multiClosetShortHangerPart] / total) * n,
        [MultiClosetComponentType.multiClosetLongHangerPart]: (weighted[MultiClosetComponentType.multiClosetLongHangerPart] / total) * n,
        [MultiClosetComponentType.multiClosetDrawerPart]: (weighted[MultiClosetComponentType.multiClosetDrawerPart] / total) * n
    };
    let assigned = 0;
    for (const category of [
        MultiClosetComponentType.multiClosetShelfPart,
        MultiClosetComponentType.multiClosetShortHangerPart,
        MultiClosetComponentType.multiClosetLongHangerPart,
        MultiClosetComponentType.multiClosetDrawerPart
    ]) {
        counts[category] = Math.floor(raw[category]);
        assigned += counts[category];
    }
    let remaining = n - assigned;
    if (remaining > 0) {
        // Only categories the user actually asked for (intensity > 0) are eligible
        // for leftover slots, so a 0-intensity category never gets a section. Among
        // those, largest fractional remainder wins; ties break by category order.
        const order = [
            MultiClosetComponentType.multiClosetShelfPart,
            MultiClosetComponentType.multiClosetShortHangerPart,
            MultiClosetComponentType.multiClosetLongHangerPart,
            MultiClosetComponentType.multiClosetDrawerPart
        ]
            .filter((category) => weighted[category] > 0)
            .sort((a, b) => {
            const fracA = raw[a] - Math.floor(raw[a]);
            const fracB = raw[b] - Math.floor(raw[b]);
            if (Math.abs(fracA - fracB) > 1e-9)
                return fracB - fracA; // larger remainder first
            return ([
                MultiClosetComponentType.multiClosetShelfPart,
                MultiClosetComponentType.multiClosetShortHangerPart,
                MultiClosetComponentType.multiClosetLongHangerPart,
                MultiClosetComponentType.multiClosetDrawerPart
            ].indexOf(a) -
                [
                    MultiClosetComponentType.multiClosetShelfPart,
                    MultiClosetComponentType.multiClosetShortHangerPart,
                    MultiClosetComponentType.multiClosetLongHangerPart,
                    MultiClosetComponentType.multiClosetDrawerPart
                ].indexOf(b));
        });
        let i = 0;
        while (remaining > 0 && order.length > 0) {
            counts[order[i % order.length]] += 1;
            remaining -= 1;
            i += 1;
        }
    }
    return counts;
};

export { intensityToTargetCounts };
