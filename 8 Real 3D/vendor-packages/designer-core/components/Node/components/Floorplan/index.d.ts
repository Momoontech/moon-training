import Value from '../../../../components/Value';
import { FloorplanConfig, NodeType, UUID } from '../../../../declarations';
import { CoreDesigner, NodeEffect } from '../../../../designer-core';
import { AttributeValue } from '../../../commands/SetProjectAttributeValueCommand';
export declare class Floorplan {
    id: UUID;
    core: CoreDesigner;
    type: NodeType.Floorplan;
    stages: Value<UUID[]>;
    parent: Value<UUID>;
    effects: NodeEffect[];
    exists: Value<number>;
    attributes: Map<string, Value<AttributeValue>>;
    constructor(config: FloorplanConfig, core: CoreDesigner);
    dispose(): void;
    toJSON(): FloorplanConfig;
}
