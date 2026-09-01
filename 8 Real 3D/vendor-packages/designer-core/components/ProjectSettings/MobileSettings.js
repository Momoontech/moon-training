class MobileSettings {
    step;
    constructor(core, mobileSettings) {
        this.step = core.createValue(mobileSettings.step);
    }
}

export { MobileSettings };
