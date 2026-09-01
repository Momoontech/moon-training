const roundDownTo = (value, step) => Math.floor(value / step) * step;
/**
 * Rule: one cut-to-fit balance section, the rest equal and floored to the grid.
 *
 * Instead of forcing every section to an identical non-grid width (e.g. 29.0833"),
 * we floor the equal split to `roundingStep` (0.125") for the `n - 1` fixed
 * sections and let the **last** section absorb whatever is left over — that is the
 * CTF section, cut on-site. Flooring makes the balance the widest, so when the gap
 * grows past `maxBalanceDelta` we nudge the fixed width up in grid steps (never
 * past the per-section `cap`) to pull the balance back toward the others.
 *
 * Pure: returns the two widths; placement (which slot is the balance) and the
 * per-section assignment live in `distributeSectionContents`.
 */
const distributeBalancedWidths = (usable, n, hasDrawers, config) => {
    const warnings = [];
    if (n <= 0)
        return { fixedWidth: 0, balanceWidth: 0, warnings };
    // A single section is itself the balance — it simply takes all usable space.
    if (n === 1)
        return { fixedWidth: usable, balanceWidth: usable, warnings };
    const { roundingStep: step, minSectionWidth, maxBalanceDelta } = config;
    // Sections that contain drawers cap at the drawer max; otherwise we may go as
    // wide as the widest preferred width to reduce component count.
    const cap = hasDrawers ? config.widths.drawerMax : config.widths.widest;
    let fixedWidth = roundDownTo(usable / n, step);
    if (fixedWidth < minSectionWidth)
        fixedWidth = minSectionWidth;
    if (fixedWidth > cap)
        fixedWidth = cap;
    let balanceWidth = usable - fixedWidth * (n - 1);
    // Close the gap toward the fixed sections, one grid step at a time.
    while (balanceWidth - fixedWidth > maxBalanceDelta && fixedWidth + step <= cap) {
        fixedWidth += step;
        balanceWidth = usable - fixedWidth * (n - 1);
    }
    if (balanceWidth - fixedWidth > maxBalanceDelta) {
        warnings.push(`Balance section ${balanceWidth.toFixed(2)}" is more than ${maxBalanceDelta}" wider than the ` +
            `${fixedWidth.toFixed(2)}" fixed sections (fixed width capped at ${cap}").`);
    }
    if (balanceWidth < minSectionWidth) {
        warnings.push(`Balance section too narrow: ${balanceWidth.toFixed(2)}" (min ${minSectionWidth}").`);
    }
    return { fixedWidth, balanceWidth, warnings };
};

export { distributeBalancedWidths };
