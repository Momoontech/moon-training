/**
 * Spec for the resize-capability oracle: node id → all four resizable sides. One describe-block
 * per hierarchy level, mirroring the dispatch in `getResizableSides` itself:
 *   sections  → width via the absorber chain, floor-anchored bottom, lock freezes all;
 *   stacks    → height only, against a sibling stack on that side;
 *   openings  → height only, when a sibling opening exists to trade holes with;
 *   defaults  → all false for anything unknown.
 */
export {};
