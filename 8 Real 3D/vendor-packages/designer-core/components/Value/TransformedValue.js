import Value from './index.js';

class TransformedValue extends Value {
    transform;
    constructor(initialValue, core, options = {}, transform = (value) => value) {
        super(initialValue, core, options);
        this.transform = transform;
    }
    getTransformed() {
        return this.transform(super.get());
    }
    get() {
        return super.get();
    }
}

export { TransformedValue as default };
