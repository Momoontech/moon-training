class SetMaterialsBaseValueCommand {
    setId;
    materialType;
    materialId;
    isStyled;
    prevSet = {};
    constructor(setId, materialType, materialId, isStyled) {
        this.setId = setId;
        this.materialType = materialType;
        this.materialId = materialId;
        this.isStyled = isStyled;
    }
    changeEdgebandings(materialID, set) {
        [
            'bodyEdgebanding',
            'doorEdgebanding',
            'finishEndEdgebanding',
            'topValanceEdgebanding',
            'bottomValanceEdgebanding',
            'fillerEdgebanding',
            'visibleCarcassEdgebanding'
        ].forEach((propName) => {
            this.prevSet[propName] = set[propName].get();
            set[propName].set(materialID);
        });
    }
    changeVisiblePanels(materialID, set) {
        ['filler', 'toeKick', 'topValance', 'bottomValance', 'visibleCarcass'].forEach((propName) => {
            this.prevSet[propName] = set[propName].get();
            set[propName].set(materialID);
        });
    }
    execute(core) {
        const set = this.getSet(core);
        const storageMaterials = core.storage.get('materials')?.obj;
        if (!set || !storageMaterials)
            return false;
        this.prevSet = { [this.materialType]: set[this.materialType].get() };
        set[this.materialType].set(this.materialId);
        switch (this.materialType) {
            // no break after door-case to set finish end
            case 'door':
                this.prevSet.doorsAndDrawersConfiguration = set.doorsAndDrawersConfiguration.get();
                set.doorsAndDrawersConfiguration.set(this.isStyled ? 'Styled' : 'Slab');
                // changeMaterialsSetDoorsAndDrawersConfiguration( {
                //   doorsAndDrawersConfiguration: this.materialId,
                //   materialsSetId: this.setId
                // } );
                // set finish end
                this.prevSet.finishEnd = set.finishEnd.get();
                set.finishEnd.set(this.materialId);
                if (this.isStyled) {
                    const { matchingVisiblePanel } = storageMaterials.doorStyle[this.materialId];
                    if (matchingVisiblePanel) {
                        // set visible panels
                        this.prevSet.visiblePanel = set.visiblePanel.get();
                        set.visiblePanel.set(matchingVisiblePanel);
                        this.changeVisiblePanels(matchingVisiblePanel, set);
                        // set edgebandings
                        this.prevSet.edgebanding = set.edgebanding.get();
                        set.edgebanding.set(storageMaterials.visiblePanel[matchingVisiblePanel].matchingEdgeband);
                        this.changeEdgebandings(storageMaterials.visiblePanel[matchingVisiblePanel].matchingEdgeband, set);
                    }
                }
                else {
                    // set visible panels
                    this.prevSet.visiblePanel = set.visiblePanel.get();
                    set.visiblePanel.set(this.materialId);
                    this.changeVisiblePanels(this.materialId, set);
                    // set edgebandings
                    this.prevSet.edgebanding = set.edgebanding.get();
                    set.edgebanding.set(storageMaterials.visiblePanel[this.materialId].matchingEdgeband);
                    this.changeEdgebandings(storageMaterials.visiblePanel[this.materialId].matchingEdgeband, set);
                }
                break;
            case 'finishEnd':
                this.prevSet.finishEndsConfiguration = set.finishEndsConfiguration.get();
                set.finishEndsConfiguration.set(this.isStyled ? 'Styled' : 'Slab');
                // changeMaterialsSetFinishEndsConfiguration( {
                //   finishEndsConfiguration: this.materialId,
                //   materialsSetId: this.setId
                // } );
                break;
            case 'visiblePanel':
                this.changeVisiblePanels(this.materialId, set);
                // set edgebandings
                this.prevSet.edgebanding = set.edgebanding.get();
                set.edgebanding.set(storageMaterials.visiblePanel[this.materialId].matchingEdgeband);
                this.changeEdgebandings(storageMaterials.visiblePanel[this.materialId].matchingEdgeband, set);
                break;
            case 'melamineBox':
                // set melamineBox edgebanding
                this.prevSet.melamineBoxEdgebanding = set.melamineBoxEdgebanding.get();
                set.melamineBoxEdgebanding.set(storageMaterials.melamineBox[this.materialId].matchingEdgeband);
                break;
            case 'edgebanding':
                this.changeEdgebandings(this.materialId, set);
                break;
        }
        return true;
    }
    undo(core) {
        const set = this.getSet(core);
        if (!set)
            return false;
        Object.entries(this.prevSet).forEach(([key, value]) => {
            set[key].set(value);
        });
        return true;
    }
}

export { SetMaterialsBaseValueCommand };
