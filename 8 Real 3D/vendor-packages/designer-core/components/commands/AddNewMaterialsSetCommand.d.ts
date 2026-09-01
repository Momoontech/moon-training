import { CoreDesigner } from '../../designer-core';
import { materialsSet } from '../ProjectSettings/Materials/MaterialsSets';
import { AddNewMaterialsBaseSetCommand } from './AddNewMaterialsBaseSetCommand';
export default class AddNewMaterialsSetCommand extends AddNewMaterialsBaseSetCommand {
    protected getCollection(core: CoreDesigner): import("../ProjectSettings/Materials/MaterialsSets").MaterialsSets;
    protected getDefaultSet(core: CoreDesigner): materialsSet;
}
