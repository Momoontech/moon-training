/**
 * Rule: usable inside space after CTF panels. N sections are bounded by N+1
 * panels, so usable = width - panelThickness * (N + 1).
 * e.g. 90" wall, 4 panels at 0.75" -> 90 - 3 = 87" usable.
 */
const applyPanelThickness = (width, n, panelThickness) => {
    if (n <= 0)
        return width;
    return width - panelThickness * (n + 1);
};

export { applyPanelThickness };
