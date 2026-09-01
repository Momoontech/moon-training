import { AttributeValue } from '../components/commands/SetProjectAttributeValueCommand';
import { Node } from '../components/Node';
declare const getAttributeValue: (node: Node, attributeName: string) => AttributeValue;
export default getAttributeValue;
