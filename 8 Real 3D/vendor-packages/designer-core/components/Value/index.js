import { signal, computed } from '@preact/signals-react';
import { calculateValue } from './calculate.js';

class Value {
    s;
    c;
    /**
     * A `Value<T>` always carries a real `CoreDesigner`. The `initialValue` may be a plain literal,
     * an interpreted token array, or a catalog path — `calculateValue` dereferences the latter two
     * through `core`. Callers that hold plain data with no formulas (e.g. paperspace state) should
     * use `CoreSignal<T>` from `../CoreSignal` instead of `Value<T>`; that primitive has no core
     * dependency and no formula-resolution overhead.
     */
    constructor(initialValue, core, options = {}) {
        this.s = signal(initialValue);
        this.c = computed(() => calculateValue(this.s.value, core, options));
    }
    getGetter() {
        return () => this.get();
    }
    get() {
        return this.c.value;
    }
    getSignal() {
        return this.s.value;
    }
    set(value) {
        this.s.value = value;
    }
    peek() {
        return this.c.peek();
    }
}

export { Value as default };
