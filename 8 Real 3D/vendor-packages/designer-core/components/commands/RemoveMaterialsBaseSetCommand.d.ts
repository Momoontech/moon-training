import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { materialsSet } from '../ProjectSettings/Materials/MaterialsSets';
import { Command } from './core/Command';
type MaterialsCollection = {
    get(id: UUID): materialsSet | undefined;
    delete(id: UUID): void;
    add(id: UUID, set: materialsSet): void;
};
export declare abstract class RemoveMaterialsBaseSetCommand implements Command {
    protected readonly id: UUID;
    private removedSet;
    constructor(id: UUID);
    protected abstract getCollection(core: CoreDesigner): MaterialsCollection;
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export {};
