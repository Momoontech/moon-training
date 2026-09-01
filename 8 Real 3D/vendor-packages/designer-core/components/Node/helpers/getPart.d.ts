import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getPart: (core: CoreDesigner, partId?: UUID | undefined | null) => import("..").Part;
export default getPart;
