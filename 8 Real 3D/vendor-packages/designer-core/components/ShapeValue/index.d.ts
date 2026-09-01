import { CoreDesigner } from '../../';
import { InterpretedShape, IShapeValue } from '../../declarations';
import { ValueOptionsType } from '../Value';
export default class ShapeValue {
    private options;
    private s;
    private c;
    constructor(initialValue: IShapeValue, core: CoreDesigner, options: ValueOptionsType);
    getOptions(): ValueOptionsType;
    get(): InterpretedShape;
    getSignal(): IShapeValue;
    set(value: IShapeValue): void;
}
