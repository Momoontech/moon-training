import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
import { MountPlane } from '../components/MountPlane';
declare const getMountPlane: (core: CoreDesigner, segmentId?: UUID | undefined) => MountPlane;
export default getMountPlane;
