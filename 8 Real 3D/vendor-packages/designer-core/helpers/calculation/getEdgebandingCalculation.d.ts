import { Edgebanding } from '../../components/Node/components/Edgebanding';
import { EdgebandingCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Edgebanding → `{ edgebandings }` (one entry per banded edge).
 *
 * `getMaterials(core, edgebandingId)` resolves the per-edge material list from
 * the parent panel's `edgeMaterialIds` (returning `null` for un-banded edges).
 * Each edge's `width` is the length of the matching segment of the parent panel's
 * shape — from `shapeEdgeLengths`, which is indexed per curve point so it stays
 * aligned with `edgeMaterialIds` even when arc/bezier edges tessellate into many
 * points (the core analogue of vesta's per-edge `contour.curves[i].getLength()`).
 */
export declare const getEdgebandingCalculation: (core: CoreDesigner, node: Edgebanding) => {
    edgebandings: EdgebandingCalculation[];
} | null;
