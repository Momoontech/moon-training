class SetValueCommand {
    prevValue = null;
    hasPrevSnapshot = false;
    variableValue;
    updatedValue;
    constructor(variableValue, updatedValue) {
        this.variableValue = variableValue;
        this.updatedValue = updatedValue;
    }
    execute() {
        this.prevValue = this.variableValue.get();
        this.hasPrevSnapshot = true;
        this.variableValue.set(this.updatedValue);
        return true;
    }
    undo() {
        if (!this.hasPrevSnapshot) {
            return false;
        }
        this.variableValue.set(this.prevValue);
        return true;
    }
}

export { SetValueCommand as default };
