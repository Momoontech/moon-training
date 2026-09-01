import { CoreDesigner } from '../../designer-core';
import { materialsSet } from '../ProjectSettings/Materials/MaterialsSets';
import { SetMaterialsBaseValueCommand } from './SetMaterialsBaseValueCommand';
export default class SetMaterialsSetValueCommand extends SetMaterialsBaseValueCommand {
    protected getSet(core: CoreDesigner): materialsSet | undefined;
}
