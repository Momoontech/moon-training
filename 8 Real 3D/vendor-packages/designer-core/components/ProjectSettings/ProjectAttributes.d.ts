import { CoreDesigner } from '../../';
import { attributesType, inches, projectAttributesType } from '../../declarations';
import Value from '../Value';
import { AttributeValue } from '../commands/SetProjectAttributeValueCommand';
export declare class ProjectAttributes {
    private attributes;
    constructor(core: CoreDesigner, projectAttributesDB: projectAttributesType);
    hasAttribute(attribute: attributesType): boolean;
    set(attribute: attributesType, value: Value<string | 0 | 1 | 2 | 3 | inches>): void;
    getValue(attribute: attributesType): Value<AttributeValue> | undefined;
    serialize(): projectAttributesType;
}
