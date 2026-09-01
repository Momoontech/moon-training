import { NodeEffect } from '../../../designer-core';
/**
 * Self-healing effect that owns ALL Wall2D.holes[item.id] entries for gate/window Items.
 *
 * Tracked deps: item pose (via getMatrixWorld chain), size, holeShape, wDepth,
 * and every stage segment endpoint so floorplan edits re-fire the effect.
 *
 * The untracked() block performs a reconciliation walk: for every Wall2D on the
 * current stage it computes the DESIRED holes[item.id] value and emits a
 * SetNodeSignalCommand only when the current value differs. This makes the
 * effect idempotent (no commands emitted in steady state) and self-healing
 * (stale entries on any wall are removed on the next re-fire).
 */
export declare const updateWallItemHolesEffect: NodeEffect;
