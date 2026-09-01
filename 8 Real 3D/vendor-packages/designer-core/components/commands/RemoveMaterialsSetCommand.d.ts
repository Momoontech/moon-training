import { CoreDesigner } from '../../designer-core';
import { RemoveMaterialsBaseSetCommand } from './RemoveMaterialsBaseSetCommand';
export default class RemoveMaterialsSetCommand extends RemoveMaterialsBaseSetCommand {
    protected getCollection(core: CoreDesigner): import("../ProjectSettings/Materials/MaterialsSets").MaterialsSets;
}
