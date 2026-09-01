import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getStage: (core: CoreDesigner, stageId: UUID | undefined) => import("..").Stage;
export default getStage;
