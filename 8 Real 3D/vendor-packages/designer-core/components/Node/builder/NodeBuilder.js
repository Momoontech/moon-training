import { BaseNode } from '../BaseNode.js';
import { withAttributes } from './steps/withAttributes.js';
import { withChildren } from './steps/withChildren.js';
import { withContours } from './steps/withContours.js';
import { withExteriorLayout } from './steps/withExteriorLayout.js';
import { withGrain } from './steps/withGrain.js';
import { withInteriorLayout } from './steps/withInteriorLayout.js';
import { withItemType } from './steps/withItemType.js';
import { withMaterialId } from './steps/withMaterialId.js';
import { withMaterialsSet } from './steps/withMaterialsSet.js';
import { withMount } from './steps/withMount.js';
import { withMountType } from './steps/withMountType.js';
import { withPosition2D } from './steps/withPosition2D.js';
import { withPosition3D } from './steps/withPosition3D.js';
import { withProperties } from './steps/withProperties.js';
import { withRotation } from './steps/withRotation.js';
import { withShape } from './steps/withShape.js';
import { withSize } from './steps/withSize.js';

class NodeBuilder {
    base;
    constructor(base) {
        this.base = base;
    }
    static create() {
        return new NodeBuilder(BaseNode);
    }
    withPosition3D() {
        return new NodeBuilder(withPosition3D(this.base));
    }
    withPosition2D() {
        return new NodeBuilder(withPosition2D(this.base));
    }
    withRotation() {
        return new NodeBuilder(withRotation(this.base));
    }
    withSize() {
        return new NodeBuilder(withSize(this.base));
    }
    withShape() {
        return new NodeBuilder(withShape(this.base));
    }
    withContours() {
        return new NodeBuilder(withContours(this.base));
    }
    withGrain() {
        return new NodeBuilder(withGrain(this.base));
    }
    withProperties(namesValues) {
        return new NodeBuilder(withProperties(namesValues)(this.base));
    }
    withMaterialId() {
        return new NodeBuilder(withMaterialId(this.base));
    }
    withMount() {
        return new NodeBuilder(withMount(this.base));
    }
    withMountType() {
        return new NodeBuilder(withMountType(this.base));
    }
    withItemType() {
        return new NodeBuilder(withItemType(this.base));
    }
    withMaterialsSet() {
        return new NodeBuilder(withMaterialsSet(this.base));
    }
    withChildren(key) {
        return new NodeBuilder(withChildren(key, this.base));
    }
    withAttributes() {
        return new NodeBuilder(withAttributes(this.base));
    }
    withInteriorLayout() {
        return new NodeBuilder(withInteriorLayout(this.base));
    }
    withExteriorLayout() {
        return new NodeBuilder(withExteriorLayout(this.base));
    }
    toClass() {
        return this.base;
    }
}

export { NodeBuilder };
