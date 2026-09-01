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
import { MultiClosetComponentType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';

/**
 * Auto-fill diagnostics — ORDERED vs DELIVERED, per system, printed to the console.
 *
 * TEMPORARY debugging aid while the section-forming rules are being tuned. It exists because the
 * interesting question ("did the closet get what the needs asked for?") cannot be answered from the
 * 3D view or from `getMonitor()`: the monitor only fans out to registered middlewares, and a
 * screenshot cannot be diffed against a piece count. Delete this file (and its two call sites in
 * `fillMultiClosets`) once the rules settle.
 *
 * `console` on purpose, not `getMonitor()` — this output has to reach the browser console
 * unconditionally, whether or not the host registered a middleware.
 *
 * DEFENSIVE THROUGHOUT. It runs inside the fill, so a malformed plan must produce a worse LOG, not
 * a failed operation — a diagnostic that can break the thing it observes is worse than none. Hence
 * the `??` guards on every field: partially-shaped plans reach this code from tests and could reach
 * it from any future caller that builds a plan by hand.
 */
/** Short labels, so a line stays readable next to three others. */
const LABEL = {
    [MultiClosetComponentType.multiClosetShelfPart]: 'shelves',
    [MultiClosetComponentType.multiClosetDrawerPart]: 'drawers',
    [MultiClosetComponentType.multiClosetShortHangerPart]: 'shortHang',
    [MultiClosetComponentType.multiClosetLongHangerPart]: 'longHang'
};
const CATEGORIES = Object.values(MultiClosetComponentType);
const formatVector = (vector) => CATEGORIES.map((category) => `${LABEL[category]}=${vector[category] ?? 0}`).join('  ');
/**
 * Order-shape → group letter, matching the verification table we compare generation against.
 *
 * Keyed by the ORDER vector (`shelves/drawers/short/long`), not by system name, because the table's
 * columns ARE the distinct order shapes: several mock systems share one shape (Office Desk System,
 * FD 06 and EDGE 15 all order 5/4/2/1) and a system renamed or added later still lands in the right
 * column automatically.
 *
 * A shape with no letter prints `?` — that is the signal to extend the table rather than a defect.
 * If the fundamental-design numbers change, these keys go stale: the letters describe the table,
 * so update both together or drop this map.
 */
const GROUP_BY_ORDER_SHAPE = {
    '5/4/2/1': 'A',
    '0/0/2/1': 'B',
    '5/0/2/0': 'C',
    '0/4/2/0': 'D',
    '0/0/2/0': 'E',
    '5/4/2/0': 'F',
    '0/0/2/3': 'G',
    '5/4/4/2': 'H'
};
/** The order shape in the table's own notation: shelves/drawers/short/long. */
const orderShape = (ordered) => [
    MultiClosetComponentType.multiClosetShelfPart,
    MultiClosetComponentType.multiClosetDrawerPart,
    MultiClosetComponentType.multiClosetShortHangerPart,
    MultiClosetComponentType.multiClosetLongHangerPart
]
    .map((category) => ordered[category] ?? 0)
    .join('/');
/** `+n` over-delivered, `-n` short, `ok` exact. The line to read first. */
const formatDiff = (ordered, delivered) => CATEGORIES.map((category) => {
    const diff = delivered[category] - ordered[category];
    return `${LABEL[category]}=${diff === 0 ? 'ok' : diff > 0 ? `+${diff}` : diff}`;
}).join('  ');
/**
 * Print one block per system: what was ordered, what was delivered, the difference, and the
 * per-closet section list that produced it.
 *
 * The per-closet list prints `category:catalogPath` for every section, which is what makes a wrong
 * result diagnosable — a category with the "wrong" option behind it (a drawer slot holding a
 * shelves section, say) is visible here and nowhere else.
 */
const logFillDiagnostics = ({ systemId, systemName, needNames, unmappedNeedNames, target, budget, limitToFundamentalDesign, closets }) => {
    const delivered = {
        [MultiClosetComponentType.multiClosetShelfPart]: 0,
        [MultiClosetComponentType.multiClosetShortHangerPart]: 0,
        [MultiClosetComponentType.multiClosetLongHangerPart]: 0,
        [MultiClosetComponentType.multiClosetDrawerPart]: 0
    };
    for (const { plan } of closets) {
        if (!plan?.piecesUsed)
            continue;
        for (const category of CATEGORIES)
            delivered[category] += plan.piecesUsed[category] ?? 0;
    }
    const shape = orderShape(target);
    const group = GROUP_BY_ORDER_SHAPE[shape] ?? '?';
    const lines = [
        `── multiCloset auto-fill ── group ${group} · order ${shape} ── ${systemName ?? '(unnamed)'} [${systemId}]`,
        `needs      : ${needNames.join(', ') || '(none)'}`,
        ...(unmappedNeedNames.length > 0 ? [`unmapped   : ${unmappedNeedNames.join(', ')}`] : []),
        `ORDERED    : ${formatVector(target)}`,
        `DELIVERED  : ${formatVector(delivered)}`,
        `DIFF       : ${formatDiff(target, delivered)}`,
        `ceiling    : ${limitToFundamentalDesign ? formatVector(budget) : 'disabled (uncapped)'}`,
        `closets    : ${closets.length}`
    ];
    closets.forEach(({ itemId, plan, budgetBefore }, closetIndex) => {
        const left = budgetBefore ? `  left before: ${formatVector(budgetBefore)}` : '';
        if (!plan) {
            lines.push(`  · #${closetIndex + 1} ${itemId}: NOT PLANNED${left}`);
            return;
        }
        const sections = plan.sections ?? [];
        const used = plan.piecesUsed ? formatVector(plan.piecesUsed) : '(not reported)';
        lines.push(`  · #${closetIndex + 1} ${itemId}: ${sections.length} section(s), pieces ${used}${left}`);
        sections.forEach((section, i) => {
            const width = typeof section?.width === 'number' ? `  w=${section.width.toFixed(2)}"` : '';
            const label = section?.category ? LABEL[section.category] : '(no category)';
            lines.push(`      ${i + 1}. ${label} → ${section?.contentCatalogPath ?? '(no path)'}` +
                `${section?.isBalance ? '  (balance)' : ''}${width}`);
        });
        for (const warning of plan.warnings ?? [])
            lines.push(`      ! ${warning}`);
    });
    console.log(lines.join('\n'));
};

export { logFillDiagnostics };
