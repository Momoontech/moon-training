import { Model } from '../../components/Node/components/Model';
import { NodeCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Model → hardware bucket, by `modelType`:
 *   pull → handles · leg → legs · hinge → hinges · drawerSystem → drawerSystems ·
 *   drawerSlide / drawerSlideUndermount → drawerSlides · everything else → accessories.
 * Appliance models emit no BOM line (vesta returned no material for them).
 *
 * `getMaterial` handles the per-type material resolution (incl. hinge → hingeType).
 */
export declare const getModelCalculation: (core: CoreDesigner, node: Model) => NodeCalculation | null;
