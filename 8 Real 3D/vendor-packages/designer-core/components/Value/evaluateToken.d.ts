import { ValueOptionsType } from '.';
import { InterpretedLine } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { AttributeValue } from '../commands/SetProjectAttributeValueCommand';
type HandlerContext = {
    core: CoreDesigner;
    options: ValueOptionsType;
};
export type EvaluatedToken = number | string | boolean | AttributeValue | Array<any> | null;
export declare const evaluateToken: (item: InterpretedLine, { core, options }: HandlerContext) => EvaluatedToken;
export {};
