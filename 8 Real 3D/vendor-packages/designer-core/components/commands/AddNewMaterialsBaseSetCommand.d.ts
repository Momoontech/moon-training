import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { materialsSet } from '../ProjectSettings/Materials/MaterialsSets';
import { Command } from './core/Command';
type MaterialsCollection = {
    add(id: UUID, set: materialsSet): void;
    delete(id: UUID): void;
};
export declare abstract class AddNewMaterialsBaseSetCommand implements Command {
    protected readonly materialsSet?: materialsSet | undefined;
    private id;
    constructor(materialsSet?: materialsSet | undefined);
    protected abstract getCollection(core: CoreDesigner): MaterialsCollection;
    protected abstract getDefaultSet(core: CoreDesigner): materialsSet;
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export {};
