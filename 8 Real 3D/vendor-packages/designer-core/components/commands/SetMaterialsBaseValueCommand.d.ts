import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { materialsSet } from '../ProjectSettings/Materials/MaterialsSets';
import { Command } from './core/Command';
export declare abstract class SetMaterialsBaseValueCommand implements Command {
    protected readonly setId: UUID;
    protected readonly materialType: keyof materialsSet;
    protected readonly materialId: UUID;
    protected readonly isStyled: boolean;
    private prevSet;
    constructor(setId: UUID, materialType: keyof materialsSet, materialId: UUID, isStyled: boolean);
    protected abstract getSet(core: CoreDesigner): materialsSet | undefined;
    changeEdgebandings(materialID: UUID, set: materialsSet): void;
    changeVisiblePanels(materialID: UUID, set: materialsSet): void;
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
