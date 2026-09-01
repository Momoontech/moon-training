import { CoreDesigner } from '..';
import { material, UUID } from '../declarations';
export declare function getMaterial(core: CoreDesigner, id: UUID | undefined): material;
export declare function getMaterials(core: CoreDesigner, id: UUID | undefined): (material | null)[];
