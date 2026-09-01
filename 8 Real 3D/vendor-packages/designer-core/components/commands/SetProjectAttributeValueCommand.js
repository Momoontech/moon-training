class SetProjectAttributeValueCommand {
    attribute;
    prevAttrValue = null;
    newAttrValue;
    constructor(attribute, newValue) {
        this.attribute = attribute;
        this.newAttrValue = newValue;
    }
    execute(core) {
        const projectAttributes = core.projectSettings.projectAttributes;
        const value = projectAttributes.getValue(this.attribute);
        if (!value)
            return false;
        this.prevAttrValue = value.get();
        value.set(this.newAttrValue);
        return true;
    }
    undo(core) {
        const projectAttributes = core.projectSettings.projectAttributes;
        const value = projectAttributes.getValue(this.attribute);
        if (!value || this.prevAttrValue === null)
            return false;
        value.set(this.prevAttrValue);
        return true;
    }
}

export { SetProjectAttributeValueCommand as default };
