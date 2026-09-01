import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getParentModel: (core: CoreDesigner, nodeId: UUID | undefined) => import("..").OtherModel | import("..").ApplianceModel | import("..").HingeModel;
export default getParentModel;
