class AreaHeader {
    image;
    main_page_image;
    orientation;
    width;
    height;
    meta;
    constructor(core, areaHeaderDB) {
        this.image = core.createValue(areaHeaderDB.image);
        this.main_page_image = core.createValue(areaHeaderDB.main_page_image);
        this.orientation = core.createValue(areaHeaderDB.orientation);
        this.width = core.createValue(areaHeaderDB.width);
        this.height = core.createValue(areaHeaderDB.height);
        this.meta = core.createValue(areaHeaderDB.meta);
    }
    getAreaHeader() {
        return {
            image: this.image.get(),
            main_page_image: this.main_page_image.get(),
            orientation: this.orientation.get(),
            width: this.width.get(),
            height: this.height.get(),
            meta: this.meta.get()
        };
    }
    setAreaHeader(areaHeader) {
        this.image.set(areaHeader.image);
        this.main_page_image.set(areaHeader.main_page_image);
        this.orientation.set(areaHeader.orientation);
        this.width.set(areaHeader.width);
        this.height.set(areaHeader.height);
        this.meta.set(areaHeader.meta);
    }
    getAreaHeaderMeta() {
        return this.meta.get() ?? {};
    }
    setAreaHeaderMeta(meta) {
        this.meta.set(meta);
    }
}

export { AreaHeader };
