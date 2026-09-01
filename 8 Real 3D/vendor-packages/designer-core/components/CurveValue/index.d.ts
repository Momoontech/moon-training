import { CoreDesigner, InterpretedCurve } from '../../';
import { ICurveValue } from '../../declarations/ICurveValue';
import { ValueOptionsType } from '../Value';
export default class CurveValue {
    private options;
    private s;
    private c;
    constructor(initialValue: ICurveValue, core: CoreDesigner, options: ValueOptionsType);
    getOptions(): ValueOptionsType;
    get(): InterpretedCurve;
    getSignal(): ICurveValue;
    set(value: ICurveValue): void;
}
