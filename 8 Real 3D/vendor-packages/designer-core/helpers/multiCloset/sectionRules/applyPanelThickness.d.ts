/**
 * Rule: usable inside space after CTF panels. N sections are bounded by N+1
 * panels, so usable = width - panelThickness * (N + 1).
 * e.g. 90" wall, 4 panels at 0.75" -> 90 - 3 = 87" usable.
 */
export declare const applyPanelThickness: (width: number, n: number, panelThickness: number) => number;
export default applyPanelThickness;
