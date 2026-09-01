const withContours = (Base) => {
    const ConcreteBase = Base;
    class WithContours extends ConcreteBase {
        contour;
        contourLeft;
        contourRight;
        contourLeftRight;
        constructor(config, core) {
            super(config, core);
            const opts = { nodeId: this.id };
            this.contour = core.createShapeValue(config.contour, opts);
            this.contourLeft = core.createShapeValue(config.contourLeft, opts);
            this.contourRight = core.createShapeValue(config.contourRight, opts);
            this.contourLeftRight = core.createShapeValue(config.contourLeftRight, opts);
        }
        toJSON() {
            return {
                ...super.toJSON(),
                contour: this.contour.getSignal(),
                contourLeft: this.contourLeft.getSignal(),
                contourRight: this.contourRight.getSignal(),
                contourLeftRight: this.contourLeftRight.getSignal()
            };
        }
    }
    return WithContours;
};

export { withContours };
