import Value, { ValueOptionsType } from '.';
import { CoreDesigner } from '../../';
import { IValue } from '../../declarations';
export default class TransformedValue<T> extends Value<T> {
    transform: (value: T) => T;
    constructor(initialValue: IValue<T>, core: CoreDesigner, options?: ValueOptionsType, transform?: (value: T) => T);
    getTransformed(): T;
    get(): T;
}
