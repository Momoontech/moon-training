import { signal } from '@preact/signals-react';

class CoreSignal {
    s;
    constructor(initialValue) {
        this.s = signal(initialValue);
    }
    get() {
        return this.s.value;
    }
    set(value) {
        this.s.value = value;
    }
    peek() {
        return this.s.peek();
    }
}

export { CoreSignal as default };
