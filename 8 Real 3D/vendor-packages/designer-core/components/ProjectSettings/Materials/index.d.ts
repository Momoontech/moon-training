import { Wrapped } from '..';
import { CoreDesigner } from '../../../';
import { IAnyNumbers, materialsType, projectSettingsMaterials, UUID } from '../../../declarations';
import Value from '../../Value';
import { MaterialsSets } from './MaterialsSets';
declare class Materials {
    materials: Map<"pole" | "ceiling" | "countertop" | "crownMolding" | "defaultMaterialsSet" | "defaultClosetMaterialsSet" | "drawerSystem" | "drawerSlide" | "drawerSlideUndermount" | "floor" | "gateFrame" | "glass" | "mirror" | "windowGlass" | "doorGlass" | "hingeBlind" | "hingeCornerCorner" | "hingeCornerDiagonal" | "hingeLiftUp" | "hingeBiFoldLift" | "hinge" | "leg" | "laminate" | "pull" | "wall" | "windowFrame" | "extrusionPull" | "rod", Value<UUID>>;
    markUp: Wrapped<IAnyNumbers<number>>;
    materialsSets: MaterialsSets;
    stockMaterialsSets: MaterialsSets;
    closetMaterialsSets: MaterialsSets;
    constructor(core: CoreDesigner, materialsDB: materialsType);
    get(materialType: projectSettingsMaterials): Value<UUID>;
    private set;
    serialize(): materialsType;
}
export default Materials;
