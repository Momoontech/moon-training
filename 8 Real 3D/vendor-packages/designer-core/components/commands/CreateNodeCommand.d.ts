import { IObjects, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties';
import { Command } from './core/Command';
declare class CreateNodeCommand implements Command {
    private objects;
    private nodeId;
    private parentId;
    private childProperty;
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    private insertIndex?;
    constructor(objects: IObjects, nodeId: UUID, parentId: UUID | undefined, childProperty?: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number], 
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    insertIndex?: number | undefined);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
declare class RemoveNodeCommand implements Command {
    id: UUID;
    objects: IObjects;
    childProperty: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number];
    parentId: UUID | undefined;
    /**
     * Demotion applied when this removal emptied a multiCloset system, retained so `undo` can put
     * the system's previous status back. `null` whenever the removed node was not the last closet
     * of a system (which is every removal except a closet delete).
     */
    private statusCommand;
    constructor(id: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export { CreateNodeCommand, RemoveNodeCommand };
