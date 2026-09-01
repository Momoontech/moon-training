import { CoreDesigner } from '..';
import { material, materialType, UUID } from '../declarations';
export default function getMaterialById(core: CoreDesigner, id: UUID | undefined, materialType: materialType | materialType[]): material;
