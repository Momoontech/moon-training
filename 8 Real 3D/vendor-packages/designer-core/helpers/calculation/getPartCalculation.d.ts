import { Part } from '../../components/Node/components/Part';
import { PartCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Part → `{ parts }`.
 *
 * Emits size (`width * height` roll-up) + `partType`. The `materialId` is taken
 * from the part's first child `Panel` so that styled door parts carry the door
 * material — that is what the aggregate transform's door-style rule merges into
 * `panels`. Non-styled parts are summed into `parts` and then discarded by the
 * transform, so a missing material is harmless for them.
 *
 * TODO(phase2): the special part types (countertopPart / toeKickPart / soffitPart
 * / …) that vesta expanded into full item-level lines via `catalogPath` are not
 * handled here — core instantiated nodes carry no `catalogPath`.
 */
export declare const getPartCalculation: (core: CoreDesigner, node: Part) => {
    parts: PartCalculation;
} | null;
