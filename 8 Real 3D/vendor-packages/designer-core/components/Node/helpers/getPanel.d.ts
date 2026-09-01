import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
declare const getPanel: (core: CoreDesigner, panelId?: UUID | undefined) => import("..").Panel;
export default getPanel;
