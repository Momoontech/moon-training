import { CoreDesigner } from '../../designer-core';
import { EShapeType, UUID, IShape, IPoint2d, ICollageConfig, IView } from '../../declarations';
import { Command } from './core/Command';
export declare class AddElementCommand<T extends IShape> implements Command {
    private viewID;
    private element;
    constructor(viewID: UUID, element: T);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class UpdateElementCommand implements Command {
    private viewID;
    private elementID;
    private type;
    private updates;
    private oldValue;
    constructor(viewID: UUID, elementID: UUID, type: EShapeType, updates: Partial<IShape>);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class DeleteElementCommand implements Command {
    private viewID;
    private elementID;
    private type;
    private deletedElement;
    constructor(viewID: UUID, elementID: UUID, type: EShapeType);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class AddViewCommand implements Command {
    private view;
    constructor(view: IView);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class RemoveViewCommand implements Command {
    private viewID;
    private savedView;
    constructor(viewID: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class AddPageCommand implements Command {
    private viewID;
    readonly pageID: UUID;
    private prevSelectedPageID;
    constructor(viewID: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class RemovePageCommand implements Command {
    private pageID;
    private savedPage;
    private savedOrderIndex;
    private prevSelectedPageID;
    constructor(pageID: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class AddCollagePageCommand implements Command {
    private config;
    readonly pageID: UUID;
    private prevSelectedPageID;
    constructor(config: ICollageConfig);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class AddEmptyPageCommand implements Command {
    readonly pageID: UUID;
    private prevSelectedPageID;
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class AddPageViewCommand implements Command {
    private pageID;
    private viewID;
    private position;
    private width;
    private height;
    readonly pageViewID: UUID;
    constructor(pageID: UUID, viewID: UUID, position: IPoint2d, width: number, height: number);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
export declare class UpdateViewPropertiesCommand implements Command {
    private viewID;
    private updates;
    private oldValue;
    constructor(viewID: UUID, updates: Partial<any>);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
