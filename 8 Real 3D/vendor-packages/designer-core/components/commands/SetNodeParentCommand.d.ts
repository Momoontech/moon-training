import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties';
import { Command } from './core/Command';
export default class SetNodeParentCommand implements Command {
    nodeId: UUID;
    prevParentId: UUID | null;
    newParentId: UUID;
    childProperty?: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number];
    prevChildProperty: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number];
    /** Index in `prevChildProperty` before execute; used on undo to restore order. */
    prevIndex?: number;
    /** Optional index in `childProperty` on the new parent; omit to append. */
    index?: number;
    constructor(nodeId: UUID, newParentId: UUID, childProperty?: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number], index?: number);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
