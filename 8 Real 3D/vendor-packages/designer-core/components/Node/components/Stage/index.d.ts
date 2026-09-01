import { NodeType, UUID } from '../../../../declarations';
import { StageConfig } from '../../../../declarations/Stage';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseNode } from '../../BaseNode';
export declare class Stage extends BaseNode<StageConfig, NodeType.Stage> {
    readonly type: NodeType.Stage;
    readonly points: Value<UUID[]>;
    readonly segments: Value<UUID[]>;
    readonly rooms: Value<UUID[]>;
    constructor(config: StageConfig, core: CoreDesigner);
    toJSON(): StageConfig;
}
