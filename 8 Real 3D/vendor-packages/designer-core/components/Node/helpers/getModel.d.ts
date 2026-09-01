import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
declare const getModel: (core: CoreDesigner, modelId?: UUID | undefined) => import("..").OtherModel | import("..").ApplianceModel | import("..").HingeModel;
export default getModel;
