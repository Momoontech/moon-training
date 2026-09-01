import { inches } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetSnapSensitivityCommand extends FoldableSignalCommand<inches> {
    constructor(newValue: inches);
}
