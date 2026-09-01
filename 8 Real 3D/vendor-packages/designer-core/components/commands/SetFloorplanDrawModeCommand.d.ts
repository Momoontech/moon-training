import { FloorPlanDrawMode } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetFloorplanDrawModeCommand extends FoldableSignalCommand<FloorPlanDrawMode> {
    constructor(newValue: FloorPlanDrawMode);
}
