import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
import { Command } from './core/Command';
import { AttributeValueType } from './SetProjectAttributeValueCommand';
export default class SetNodeAttributeValueCommand implements Command {
    attributeName: string;
    prevAttrValue: AttributeValueType | undefined;
    newAttrValue: AttributeValueType;
    nodeId: UUID;
    constructor(nodeId: UUID, attributeName: string, newValue: AttributeValueType);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
