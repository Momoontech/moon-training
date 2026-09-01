import { generateId } from '../../helpers/id.js';

const deepClone = (obj) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
};
// ============================================================================
// THREE CORE COMMANDS - All element types use these
// ============================================================================
class AddElementCommand {
    viewID;
    element;
    constructor(viewID, element) {
        this.viewID = viewID;
        this.element = element;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace.addElement(this.viewID, this.element);
        core.paperSpace.setSelectedShapeId(this.element.uuid);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace.deleteElement(this.viewID, this.element.uuid, this.element.type);
        core.paperSpace.clearSelectedShapeId();
        return true;
    }
}
class UpdateElementCommand {
    viewID;
    elementID;
    type;
    updates;
    oldValue = null;
    constructor(viewID, elementID, type, updates) {
        this.viewID = viewID;
        this.elementID = elementID;
        this.type = type;
        this.updates = updates;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        if (this.oldValue === null) {
            const current = core.paperSpace.getElement(this.viewID, this.elementID, this.type);
            if (!current)
                return false;
            this.oldValue = deepClone(current);
        }
        core.paperSpace.updateElement(this.viewID, this.elementID, this.type, this.updates);
        core.paperSpace.setSelectedShapeId(this.elementID);
        return true;
    }
    undo(core) {
        if (!core.paperSpace || !this.oldValue)
            return false;
        core.paperSpace.updateElement(this.viewID, this.elementID, this.type, this.oldValue);
        core.paperSpace.setSelectedShapeId(this.elementID);
        return true;
    }
}
class DeleteElementCommand {
    viewID;
    elementID;
    type;
    deletedElement = null;
    constructor(viewID, elementID, type) {
        this.viewID = viewID;
        this.elementID = elementID;
        this.type = type;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        if (this.deletedElement === null) {
            const current = core.paperSpace.getElement(this.viewID, this.elementID, this.type);
            if (!current)
                return false;
            this.deletedElement = deepClone(current);
        }
        core.paperSpace.deleteElement(this.viewID, this.elementID, this.type);
        core.paperSpace.clearSelectedShapeId();
        return true;
    }
    undo(core) {
        if (!core.paperSpace || !this.deletedElement)
            return false;
        core.paperSpace.addElement(this.viewID, this.deletedElement);
        core.paperSpace.setSelectedShapeId(this.elementID);
        return true;
    }
}
// ============================================================================
// VIEW-LEVEL COMMANDS
// ============================================================================
class AddViewCommand {
    view;
    constructor(view) {
        this.view = view;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._addViewDirect(this.view);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._removeViewDirect(this.view.uuid);
        return true;
    }
}
class RemoveViewCommand {
    viewID;
    savedView;
    constructor(viewID) {
        this.viewID = viewID;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        if (!this.savedView) {
            const data = core.paperSpace._getViewData(this.viewID);
            if (!data)
                return false;
            this.savedView = data;
        }
        core.paperSpace._removeViewDirect(this.viewID);
        return true;
    }
    undo(core) {
        if (!core.paperSpace || !this.savedView)
            return false;
        core.paperSpace._addViewDirect(this.savedView);
        return true;
    }
}
// ============================================================================
// PAGE COMMANDS
// ============================================================================
class AddPageCommand {
    viewID;
    pageID = generateId();
    prevSelectedPageID;
    constructor(viewID) {
        this.viewID = viewID;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        this.prevSelectedPageID = core.paperSpace.selectedPageID.get();
        core.paperSpace._addPageDirect(this.viewID, this.pageID);
        core.paperSpace.selectedPageID.set(this.pageID);
        core.paperSpace.selectedViewID.set(this.viewID);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._removePageDirect(this.pageID);
        core.paperSpace.selectedPageID.set(this.prevSelectedPageID);
        if (this.prevSelectedPageID) {
            const viewID = core.paperSpace.getViewIDByPageID(this.prevSelectedPageID);
            if (viewID)
                core.paperSpace.selectedViewID.set(viewID);
        }
        return true;
    }
}
class RemovePageCommand {
    pageID;
    savedPage;
    savedOrderIndex = -1;
    prevSelectedPageID;
    constructor(pageID) {
        this.pageID = pageID;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        const currentOrder = core.paperSpace.pagesOrder.get() ?? [];
        this.savedOrderIndex = currentOrder.indexOf(this.pageID);
        this.savedPage = structuredClone(core.paperSpace.pages.get()[this.pageID]);
        this.prevSelectedPageID = core.paperSpace.selectedPageID.get();
        const wasSelected = this.prevSelectedPageID === this.pageID;
        core.paperSpace._removePageDirect(this.pageID);
        if (wasSelected) {
            const newOrder = currentOrder.filter((id) => id !== this.pageID);
            const firstRemaining = newOrder[0];
            if (firstRemaining) {
                core.paperSpace.selectedPageID.set(firstRemaining);
                const viewID = core.paperSpace.getViewIDByPageID(firstRemaining);
                if (viewID)
                    core.paperSpace.selectedViewID.set(viewID);
            }
            else {
                core.paperSpace.selectedPageID.set(undefined);
                core.paperSpace.selectedViewID.set(undefined);
            }
        }
        return true;
    }
    undo(core) {
        if (!core.paperSpace || !this.savedPage)
            return false;
        core.paperSpace._restorePageDirect(this.pageID, this.savedPage, this.savedOrderIndex);
        if (this.prevSelectedPageID === this.pageID) {
            core.paperSpace.selectedPageID.set(this.pageID);
            const viewID = core.paperSpace.getViewIDByPageID(this.pageID);
            if (viewID)
                core.paperSpace.selectedViewID.set(viewID);
        }
        return true;
    }
}
class AddCollagePageCommand {
    config;
    pageID = generateId();
    prevSelectedPageID;
    constructor(config) {
        this.config = config;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        this.prevSelectedPageID = core.paperSpace.selectedPageID.get();
        core.paperSpace._addCollagePageDirect(this.pageID, this.config);
        core.paperSpace.selectedPageID.set(this.pageID);
        core.paperSpace.selectedViewID.set(undefined);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._removePageDirect(this.pageID);
        core.paperSpace.selectedPageID.set(this.prevSelectedPageID);
        if (this.prevSelectedPageID) {
            const viewID = core.paperSpace.getViewIDByPageID(this.prevSelectedPageID);
            if (viewID)
                core.paperSpace.selectedViewID.set(viewID);
        }
        return true;
    }
}
class AddEmptyPageCommand {
    pageID = generateId();
    prevSelectedPageID;
    execute(core) {
        if (!core.paperSpace)
            return false;
        this.prevSelectedPageID = core.paperSpace.selectedPageID.get();
        core.paperSpace._addEmptyPageDirect(this.pageID);
        core.paperSpace.selectedPageID.set(this.pageID);
        core.paperSpace.selectedViewID.set(undefined);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._removePageDirect(this.pageID);
        core.paperSpace.selectedPageID.set(this.prevSelectedPageID);
        if (this.prevSelectedPageID) {
            const viewID = core.paperSpace.getViewIDByPageID(this.prevSelectedPageID);
            if (viewID)
                core.paperSpace.selectedViewID.set(viewID);
        }
        return true;
    }
}
class AddPageViewCommand {
    pageID;
    viewID;
    position;
    width;
    height;
    pageViewID = generateId();
    constructor(pageID, viewID, position, width, height) {
        this.pageID = pageID;
        this.viewID = viewID;
        this.position = position;
        this.width = width;
        this.height = height;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._addPageViewDirect(this.pageID, this.pageViewID, this.viewID, this.position, this.width, this.height);
        return true;
    }
    undo(core) {
        if (!core.paperSpace)
            return false;
        core.paperSpace._removePageViewDirect(this.pageID, this.pageViewID);
        return true;
    }
}
class UpdateViewPropertiesCommand {
    viewID;
    updates;
    oldValue = null;
    constructor(viewID, updates) {
        this.viewID = viewID;
        this.updates = updates;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        if (this.oldValue === null) {
            this.oldValue = deepClone(core.paperSpace.getViewPropertiesValue(this.viewID));
        }
        core.paperSpace._updateViewPropertiesDirect(this.viewID, this.updates);
        return true;
    }
    undo(core) {
        if (!core.paperSpace || !this.oldValue)
            return false;
        core.paperSpace._updateViewPropertiesDirect(this.viewID, this.oldValue);
        return true;
    }
}

export { AddCollagePageCommand, AddElementCommand, AddEmptyPageCommand, AddPageCommand, AddPageViewCommand, AddViewCommand, DeleteElementCommand, RemovePageCommand, RemoveViewCommand, UpdateElementCommand, UpdateViewPropertiesCommand };
