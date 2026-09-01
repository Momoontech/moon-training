import { CoreDesigner } from '../../';
import { IValue, UUID } from '../../declarations';
export type ValueOptionsType = {
    nodeId?: UUID;
    debug?: boolean;
};
export default class Value<T> {
    private s;
    private c;
    /**
     * A `Value<T>` always carries a real `CoreDesigner`. The `initialValue` may be a plain literal,
     * an interpreted token array, or a catalog path — `calculateValue` dereferences the latter two
     * through `core`. Callers that hold plain data with no formulas (e.g. paperspace state) should
     * use `CoreSignal<T>` from `../CoreSignal` instead of `Value<T>`; that primitive has no core
     * dependency and no formula-resolution overhead.
     */
    constructor(initialValue: IValue<T>, core: CoreDesigner, options?: ValueOptionsType);
    getGetter(): () => T;
    get(): T;
    getSignal(): IValue<T>;
    set(value: IValue<T>): void;
    peek(): T;
}
