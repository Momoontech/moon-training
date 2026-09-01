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
import { MultiClosetComponentType, UUID } from '../../declarations';
import type { MultiClosetStackNumbers, SectionPlan } from './types';
export interface FillDiagnosticsInput {
    systemId: UUID;
    systemName?: string;
    /** Raw `needs` names, so the log can be matched against the API payload. */
    needNames: string[];
    /** Need names that mapped to no category. */
    unmappedNeedNames: string[];
    /** Pieces the needs entitle the system to — the ORDER. */
    target: MultiClosetStackNumbers;
    /** Ceiling actually planned against (`Infinity` where uncapped). */
    budget: Record<MultiClosetComponentType, number>;
    limitToFundamentalDesign: boolean;
    /**
     * One entry per closet of this system, in generation order. `budgetBefore` is the allowance still
     * unspent when that closet was planned — the draw-down is the point of a multi-closet system, and
     * it is invisible without this column.
     */
    closets: {
        itemId: UUID;
        plan: SectionPlan | null;
        budgetBefore?: Record<MultiClosetComponentType, number>;
    }[];
}
/**
 * Print one block per system: what was ordered, what was delivered, the difference, and the
 * per-closet section list that produced it.
 *
 * The per-closet list prints `category:catalogPath` for every section, which is what makes a wrong
 * result diagnosable — a category with the "wrong" option behind it (a drawer slot holding a
 * shelves section, say) is visible here and nowhere else.
 */
export declare const logFillDiagnostics: ({ systemId, systemName, needNames, unmappedNeedNames, target, budget, limitToFundamentalDesign, closets }: FillDiagnosticsInput) => void;
export default logFillDiagnostics;
