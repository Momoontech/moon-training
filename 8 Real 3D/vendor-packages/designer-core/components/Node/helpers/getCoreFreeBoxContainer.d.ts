import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
import { FreeBoxContainer } from '../components/FreeBoxContainer';
declare const getCoreFreeBoxContainer: (core: CoreDesigner, nodeId: UUID | undefined) => FreeBoxContainer;
export default getCoreFreeBoxContainer;
