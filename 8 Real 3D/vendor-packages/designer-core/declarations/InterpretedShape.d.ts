import { InterpretedCurve } from './InterpretedCurve';
import { IValue } from './IValue';
export interface InterpretedShape {
    curve: InterpretedCurve;
    holes?: InterpretedCurve[];
}
export type IPartialInterpretedShape = {
    source: IValue<string> | IValue<string>[];
} & Partial<InterpretedShape>;
