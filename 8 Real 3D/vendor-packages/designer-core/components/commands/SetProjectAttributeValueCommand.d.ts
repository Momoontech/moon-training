import { attributesType, inches, IValue } from '../../declarations';
import type { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
export type AttributeValue = string | number | boolean | inches | {
    x: number;
    y: number;
}[];
export type AttributeValueType = IValue<AttributeValue>;
export default class SetProjectAttributeValueCommand implements Command {
    attribute: attributesType;
    prevAttrValue: AttributeValueType | null;
    newAttrValue: AttributeValueType;
    constructor(attribute: attributesType, newValue: AttributeValueType);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
