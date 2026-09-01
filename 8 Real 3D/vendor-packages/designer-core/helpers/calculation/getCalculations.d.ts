import { CalculationResult } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Project-wide calculation orchestrator — the core analogue of the vesta
 * `getCalculations()` → `getCalculationOnUpdateProject()` pipeline, as one
 * composed call over `core.nodes` (traversed from `core.rootId`):
 *
 *   traverse + per-node generate → group per item → group per project
 *   (+ itemNumber) → aggregate transform (per-material roll-up, door-style
 *   merge, valance/toe-kick fold).
 *
 * Returns clean core-native `CalculationResult`. Closet / multiCloset items are
 * excluded from `perItem`/`perProject` and reported in `perPart` (vesta's per-part
 * pass). This is a one-shot read (not reactive).
 */
export declare const getCalculations: (core: CoreDesigner) => CalculationResult;
