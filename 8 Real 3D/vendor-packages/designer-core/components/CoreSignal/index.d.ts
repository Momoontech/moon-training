export default class CoreSignal<T> {
    private s;
    constructor(initialValue: T);
    get(): T;
    set(value: T): void;
    peek(): T;
}
