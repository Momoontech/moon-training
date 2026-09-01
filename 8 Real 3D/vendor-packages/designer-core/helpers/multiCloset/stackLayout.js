import { step32mm } from '../../components/Node/components/FreeBoxContainer/index.js';
import { collectOpeningAutoStates } from '../../components/Node/helpers/getResizableSides.js';

/**
 * Split `totalHoles` into `count` whole-hole shares as equal as possible: every
 * share gets `floor(totalHoles / count)`, and the first `totalHoles % count` shares
 * get one extra hole. Returns `[]` for `count <= 0`.
 */
const splitHoles = (totalHoles, count) => {
    if (count <= 0)
        return [];
    const safeTotal = Math.max(0, Math.round(totalHoles));
    const base = Math.floor(safeTotal / count);
    const remainder = safeTotal % count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
};
/** Total 32mm holes spanned by a stack of height `H = step·N − thickness` ⇒ `N`. */
const stackHoleCount = (height, thickness, step) => Math.round((height + thickness) / step);
/**
 * Pick the item that must carry `isAutoSized` when `pinnedIds` are about to be pinned
 * (`isAutoSized = 0`), so the stack keeps at least one auto item.
 *
 * {@link tileStackBands} hands the leftover holes to {@link splitHoles}, which returns `[]` for
 * `autoCount === 0`: every hole no fixed item claimed is then silently DROPPED, leaving a dead gap
 * at the top of the stack (or an overflow), and the stack stops re-fitting when its height changes.
 * This is the invariant that prevents that. Generic across all three stack kinds — shelves, drawers
 * and hangers all go through the same band layout.
 *
 * `items` are in stack order (bottom-to-top), dividers excluded:
 *   1. some OTHER item is already auto-sized → `null`, the invariant already holds;
 *   2. else the LAST other item that can carry it — the TOPMOST, so later slack lands at the top of
 *      the stack and no divider below it moves;
 *   3. else the FIRST pinned item that can carry it — for a shelf-board drag
 *      (`pinnedIds = [below, above]`) that is the compartment BELOW the board, which stays auto and
 *      lets the layout walk derive its size;
 *   4. else `null` — no item in this stack can carry auto-fit at all.
 * Pure — unit-tested.
 */
const pickStackAutoCarrier = (items, pinnedIds) => {
    const others = items.filter((item) => !pinnedIds.includes(item.id));
    if (others.some((item) => item.isAutoSized))
        return null;
    const eligible = others.filter((item) => item.canAutoSize);
    if (eligible.length > 0)
        return eligible[eligible.length - 1].id;
    return items.find((item) => pinnedIds.includes(item.id) && item.canAutoSize)?.id ?? null;
};
/**
 * The stack's item openings as {@link StackAutoItem}s, in stack order (bottom-to-top) — what every
 * GESTURE feeds to {@link pickStackAutoCarrier}.
 *
 * A thin adapter over `collectOpeningAutoStates`, the openings collector the resize oracle and the
 * structural repair (`promoteMultiClosetAutoCarrier`) already share: one walk, one set of filters
 * (missing / `exists = 0` subtrees and divider parts skipped) for all three consumers, so the
 * carrier decision always matches what the layout walk lays out.
 *
 * Returns the collector's own `ResizeSiblingState` — a superset of {@link StackAutoItem} (it also
 * carries `isLocked`, which no stack-level rule reads yet), so it satisfies both
 * {@link pickStackAutoCarrier} (the gesture picker) and `pickMultiClosetAutoCarrier` (the
 * structural one) without a copy.
 */
const collectStackAutoItems = (core, stack) => collectOpeningAutoStates(core, stack.id) ?? [];
/**
 * Stack interior layout — one unified model for **drawers, hangers, AND shelves**: children are
 * `M` item openings interleaved with `M−1` **real** fix-shelf divider parts (`item, divider,
 * item` … alternating, item-first and item-last). For drawers/hangers the item is the
 * drawer/hanger and the divider is a reveal separator; for shelves the item is the empty
 * compartment and the divider *is* the shelf board. The same 32mm walk serves all three.
 *
 * The walk is a plain **bottom-to-top, part-by-part** placement (no phantom gaps): a
 * divider occupies `thickness` and consumes no hole; an item occupies a clean 32mm
 * opening `step·N − thickness`:
 *   - auto items split the leftover holes maximally-but-not-perfectly equally
 *     (`splitHoles`),
 *   - non-auto items round their own `size.y` to the nearest hole count.
 * With the `M items ⇒ M−1 dividers` invariant the column tiles `H` exactly:
 * `Σ(step·Nᵢ − inset(i)) + (M−1)·thickness = step·N − thickness = H` (the item holes
 * `Nᵢ` sum to `totalHoles`). The divider children are baked into the stack catalog templates,
 * not created at runtime; this function only lays out whatever children exist.
 *
 * `itemInset(itemIndex, itemCount)` gives the amount an item's size is inset from `step·N`; it
 * defaults to `thickness` for every item (drawers/hangers — dividers centered on the hole). Shelves
 * pass a position-dependent inset (see {@link shelfCompartmentInset}) so their adjustable boards sit
 * bottom-to-hole. `itemIndex`/`itemCount` count **items only** (dividers are skipped).
 */
const tileStackBands = (
// `isDivider` is optional (defaults to an item opening) so the signature stays additive.
children, height, thickness, step, itemInset) => {
    const itemCount = children.reduce((n, c) => (c.isDivider ? n : n + 1), 0);
    const insetOf = (itemIndex) => (itemInset ? itemInset(itemIndex, itemCount) : thickness);
    // Hole count of an opening of the given span (round-trips: holes·step − inset → holes).
    const holesOf = (span, itemIndex) => Math.max(1, Math.round((span + insetOf(itemIndex)) / step));
    const totalHoles = stackHoleCount(height, thickness, step);
    let fixedHoles = 0;
    let autoCount = 0;
    let scanIndex = 0;
    for (const child of children) {
        if (child.isDivider)
            continue; // dividers consume thickness, not holes
        if (child.isAutoSized)
            autoCount += 1;
        else
            fixedHoles += holesOf(child.sizeY, scanIndex);
        scanIndex += 1;
    }
    const autoShares = splitHoles(totalHoles - fixedHoles, autoCount);
    let autoIndex = 0;
    let itemIndex = 0;
    let y = 0;
    const out = [];
    for (const child of children) {
        if (child.isDivider) {
            // A real fix-shelf divider: a `thickness` board that *is* the gap between items.
            out.push({ sizeY: thickness, posY: y });
            y += thickness;
            continue;
        }
        // A clean opening: holes · step − inset(itemIndex).
        const holes = child.isAutoSized ? Math.max(1, autoShares[autoIndex++]) : holesOf(child.sizeY, itemIndex);
        const sizeY = holes * step - insetOf(itemIndex);
        out.push({ sizeY, posY: y });
        y += sizeY;
        itemIndex += 1;
    }
    return out;
};
/**
 * Compartment inset for an ADJUSTABLE-shelf stack (the `itemInset` passed to {@link tileStackBands}).
 * Adjustable shelves rest on pins and sit **bottom-to-hole**, so every board shifts up by half a
 * thickness vs the centered (drawer) tiling. Expressed per compartment as the inset from `step·N`:
 * the bottom compartment keeps `t/2`, interior compartments `t`, and the top compartment `1.5t`.
 * This still tiles `H` exactly (`Σ inset = M·t`, matching the `M−1` boards plus one `t`). A single
 * compartment (no boards) fills `H` with inset `t`, like a single drawer.
 */
const shelfCompartmentInset = (itemIndex, itemCount, thickness) => {
    if (itemCount <= 1)
        return thickness;
    if (itemIndex === 0)
        return thickness / 2;
    if (itemIndex === itemCount - 1)
        return 1.5 * thickness;
    return thickness;
};
/**
 * FreeBoxContainer (multiCloset section column) layout. Children alternate
 * fix-shelf divider → stack → divider → … → divider (M stacks, M+1 dividers).
 * Fix shelves are `thickness`-thick dividers on the 32mm hole grid (holes at
 * `firstHoleOffset + step·k`); stacks are the openings, sized `step·N − thickness`.
 *
 * Bottom→top walk (stack top = next divider bottom; stack bottom = prev divider top):
 *   - first divider:  pos 0,                              size t
 *   - first stack:    pos t,                              size firstHoleOffset + step·s − 1.5t
 *   - later divider:  pos firstHoleOffset + step·prefix − 0.5t (centered on a hole), size t
 *   - later stack:    pos firstHoleOffset + step·prefix + 0.5t, size step·s − t
 *
 * Stack hole spans: fixed stacks consume `round((size+t)/step)` holes (the first
 * fixed stack `round((size − firstHoleOffset + 1.5t)/step)`); auto stacks split the
 * remaining budget `S_max = floor((height − firstHoleOffset − 0.5t)/step)` via
 * `splitHoles`. The leftover above the top divider is a sub-`step` top gap.
 */
const layoutMultiClosetFreeBoxContainer = (children, height, thickness, firstHoleOffset, step) => {
    const half = thickness * 0.5;
    // Hole span a (non-first) stack occupies for a given height.
    const spanOf = (size, isFirst) => Math.max(1, Math.round((size + (isFirst ? 1.5 * thickness - firstHoleOffset : thickness)) / step));
    // Budget: fixed stacks consume their spans, auto stacks split the rest.
    const sMax = Math.floor((height - firstHoleOffset - half) / step);
    let fixedHoles = 0;
    let autoCount = 0;
    let seenStack = false;
    for (const child of children) {
        if (!child.isStack)
            continue;
        const isFirst = !seenStack;
        seenStack = true;
        if (child.isAutoSized)
            autoCount += 1;
        else
            fixedHoles += spanOf(child.sizeY, isFirst);
    }
    // No stacks: the section is one open span — first fix shelf at the bottom, the rest
    // centered on the topmost hole that fits (`sMax`), i.e. the SAME hole the top divider
    // occupies in a single-stack section (`firstHoleOffset + step·prefix − half` with
    // `prefix = sMax`). Using `sMax + 1` would push the shelf a full step past the top,
    // so its top edge lands at `H + step` — outside the container.
    if (!seenStack) {
        const topPos = firstHoleOffset + step * Math.max(0, sMax) - half;
        return children.map((_, i) => ({ sizeY: thickness, posY: i === 0 ? 0 : topPos }));
    }
    const autoShares = splitHoles(sMax - fixedHoles, autoCount);
    // Walk bottom→top, accumulating stack hole prefix.
    const out = [];
    let prefix = 0;
    let firstStack = true;
    let firstDivider = true;
    let autoIndex = 0;
    for (const child of children) {
        if (!child.isStack) {
            out.push({ sizeY: thickness, posY: firstDivider ? 0 : firstHoleOffset + step * prefix - half });
            firstDivider = false;
            continue;
        }
        const span = child.isAutoSized ? Math.max(1, autoShares[autoIndex++] ?? 1) : spanOf(child.sizeY, firstStack);
        if (firstStack) {
            out.push({ sizeY: firstHoleOffset + step * span - 1.5 * thickness, posY: thickness });
            firstStack = false;
        }
        else {
            out.push({ sizeY: step * span - thickness, posY: firstHoleOffset + step * prefix + half });
        }
        prefix += span;
    }
    return out;
};
/**
 * Pick the insertion point for a stack dropped onto a multiCloset FreeBoxContainer.
 * The column is `divider, stack, divider, …, divider`; a stack is inserted just above
 * the divider nearest the pointer, but always **strictly between** the bottom and top
 * bracketing shelves. With no dividers the stack is simply appended. The shelf that
 * re-brackets the new stack is added afterwards by {@link reconcileFreeBoxContainerBays},
 * not here.
 *
 * `bays` must exclude the dragged stack, so the returned index addresses the column as it
 * will look once the stack has been detached — which is what `setParent` operates on.
 */
const freeBoxContainerStackInsertion = (bays, pointerY) => {
    let bestIndex = -1;
    let bestDist = Infinity;
    let firstDivider = -1;
    let lastDivider = -1;
    for (let i = 0; i < bays.length; i += 1) {
        if (bays[i].isStack)
            continue;
        if (firstDivider === -1)
            firstDivider = i;
        lastDivider = i;
        const center = bays[i].posY + bays[i].sizeY * 0.5;
        const dist = Math.abs(center - pointerY);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }
    if (bestIndex === -1) {
        return { stackInsertIndex: bays.length, anchorDividerId: null };
    }
    // Clamp inside the brackets. Without this, a pointer nearest the TOP shelf asks for
    // `lastDivider + 1` — a slot ABOVE the top bracket — and the reconciler immediately puts the
    // stack back below it. During a drag that repeats every frame, so the stack and the top shelf
    // trade places continuously and the shelf reads as blinking. Symmetric at the bottom.
    // A column with fewer than two dividers has no interior yet; leave it to the reconciler.
    const stackInsertIndex = lastDivider > firstDivider
        ? Math.min(Math.max(bestIndex + 1, firstDivider + 1), lastDivider)
        : bestIndex + 1;
    return { stackInsertIndex, anchorDividerId: bays[bestIndex].id };
};
/**
 * Restore the `divider, stack, divider, …, divider` alternation of a multiCloset
 * FreeBoxContainer's `bays`.
 *
 * The column is a run of fix-shelf dividers, then a stack, then a run, … — so `M` stacks
 * produce `M+1` divider runs, and each run must hold exactly ONE divider. The single
 * exception is the empty column (`M === 0`): its one run holds TWO dividers, the bottom
 * and top bracketing shelves. Hence the target count is `max(2, M + 1)` — which is also
 * why dropping the FIRST stack into an empty section adds no divider (0 and 1 stacks both
 * want 2), while every stack after that adds one.
 *
 * The first `wantPerRun` dividers already sitting in a run stay put, so the bottom and top
 * brackets survive any repair — mirroring the "never remove the first or last separator" rule
 * in `updateMultiClosetItemLayoutEffect`.
 *
 * **Relocate before create/destroy.** A run with a spare shelf donates it to a run that is
 * short (`orderedBayIds`), so only a genuine deficit creates a node and only a genuine surplus
 * deletes one. This matters because the drag preview reconciles on every pointermove: when the
 * dragged stack crosses a boundary the counts still match and only the ORDER changes, so
 * without this the same shelf would be destroyed and re-created frame after frame — which is
 * exactly what a blinking shelf looks like.
 *
 * Pure and idempotent: re-running against an already-valid column reports nothing to do, so
 * callers can invoke it unconditionally after any `bays` mutation.
 */
const reconcileFreeBoxContainerBays = (bays) => {
    // Split into divider runs separated by stacks — `runs.length === stackIds.length + 1`.
    const stackIds = [];
    const runs = [[]];
    for (const bay of bays) {
        if (bay.isStack) {
            stackIds.push(bay.id);
            runs.push([]);
        }
        else {
            runs[runs.length - 1].push(bay.id);
        }
    }
    // Empty column keeps both bracketing shelves; every other run holds exactly one.
    const wantPerRun = stackIds.length === 0 ? 2 : 1;
    // Every divider past `wantPerRun` in its run joins the surplus pool…
    const surplus = [];
    const filled = runs.map((run) => {
        surplus.push(...run.slice(wantPerRun));
        return run.slice(0, wantPerRun);
    });
    // …which is drained, bottom-up, into the runs that came up short. Whatever the pool cannot
    // cover becomes a real insertion (`null`); whatever it has left over becomes a real removal.
    for (const run of filled) {
        while (run.length < wantPerRun)
            run.push(surplus.shift() ?? null);
    }
    // The target column: run, stack, run, stack, …, run. `null` marks a divider to create.
    const target = [];
    filled.forEach((run, index) => {
        target.push(...run);
        if (index < stackIds.length)
            target.push(stackIds[index]);
    });
    /**
     * Nearest EXISTING divider to the gap at target index `i`, scanning DOWN first (the shelf
     * the new one sits above — the old `anchorDividerId`), then UP.
     */
    const stacks = new Set(stackIds);
    const nearestDivider = (i) => {
        for (let k = i - 1; k >= 0; k -= 1)
            if (target[k] && !stacks.has(target[k]))
                return target[k];
        for (let k = i + 1; k < target.length; k += 1)
            if (target[k] && !stacks.has(target[k]))
                return target[k];
        return null;
    };
    // `at` counts SURVIVING entries only: insertions are applied descending onto `orderedBayIds`,
    // so by the time a gap is filled every later entry is already in place and every earlier one
    // is still missing.
    const insertions = [];
    const orderedBayIds = [];
    target.forEach((id, i) => {
        if (id === null)
            insertions.push({ at: orderedBayIds.length, templateId: nearestDivider(i) });
        else
            orderedBayIds.push(id);
    });
    const survivingIds = bays.filter((bay) => !surplus.includes(bay.id)).map((bay) => bay.id);
    const orderUnchanged = survivingIds.length === orderedBayIds.length && survivingIds.every((id, i) => id === orderedBayIds[i]);
    return {
        removeDividerIds: surplus,
        orderedBayIds: orderUnchanged ? null : orderedBayIds,
        insertions
    };
};
/**
 * Snap a plain (non-multiCloset) FreeBoxContainer interior part to the 32mm hole grid
 * along Y. Holes sit at `firstHoleOffset + step·k`; the part is centred on the hole
 * nearest `pointerY` and clamped so it stays fully within `[0, containerSizeY]`.
 * Mirrors the predecessor VESTA `calculateFreeMountPosition` hole loop. Returns the
 * part's `position.y` (bottom edge).
 */
const snapTo32mm = (pointerY, partSizeY, containerSizeY, firstHoleOffset, step) => {
    const half = partSizeY * 0.5;
    const k = Math.max(0, Math.round((pointerY - firstHoleOffset) / step));
    const posY = firstHoleOffset + step * k - half;
    const maxPos = Math.max(0, containerSizeY - partSizeY);
    return Math.min(maxPos, Math.max(0, posY));
};
const minHolesPerStack = 6;
const minHolesPerStackPart = 3;
/**
 * Valid resize heights for one stack inside a multiCloset FreeBoxContainer — each a 32mm-grid
 * opening `step·N − thickness` (an `N`-hole opening bounded by a fix-shelf board).
 *
 * The hole budget is computed EXACTLY as `layoutMultiClosetFreeBoxContainer` allocates it, so the
 * offered sizes are precisely what fits — never one the layout would clip:
 *
 *     sMaxHoles = floor((containerHeight − firstHoleOffset − thickness/2) / step)   // total holes
 *     maxHoles  = sMaxHoles − otherStackHoles                                       // free holes for this stack
 *
 * The other stacks reserve `otherStackHoles`; the resized stack takes the remainder. Returns the
 * ascending heights for `N` from `minHolesPerStack` to `maxHoles` (empty when the remainder cannot
 * fit the stack at its minimum). Pure and unit-agnostic — directly unit-testable and reusable by any
 * resize UI / command.
 */
const stackResizeHeightOptions = ({ containerHeight, firstHoleOffset, thickness, otherStackHoles }) => {
    const sMaxHoles = Math.floor((containerHeight - firstHoleOffset - thickness * 0.5) / step32mm);
    const maxHoles = sMaxHoles - otherStackHoles;
    const options = [];
    for (let holes = minHolesPerStack; holes <= maxHoles; holes += 1) {
        options.push(step32mm * holes - thickness);
    }
    return options;
};

export { collectStackAutoItems, freeBoxContainerStackInsertion, layoutMultiClosetFreeBoxContainer, minHolesPerStack, minHolesPerStackPart, pickStackAutoCarrier, reconcileFreeBoxContainerBays, shelfCompartmentInset, snapTo32mm, splitHoles, stackHoleCount, stackResizeHeightOptions, tileStackBands };
