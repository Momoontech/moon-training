import { GeneralViewMode } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetGeneralViewModeCommand extends FoldableSignalCommand<GeneralViewMode> {
    constructor(newValue: GeneralViewMode);
}
