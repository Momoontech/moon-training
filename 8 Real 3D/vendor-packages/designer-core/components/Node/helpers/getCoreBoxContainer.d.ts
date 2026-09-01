import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
import { BoxContainer } from '../components/BoxContainer';
declare const getCoreBoxContainer: (core: CoreDesigner, nodeId: UUID | undefined) => BoxContainer;
export default getCoreBoxContainer;
