import { CoreDesigner } from "../../designer-core";
import type { IAreaHeader } from "../../declarations";
import Value from "../Value";
export declare class AreaHeader {
    image: Value<string | undefined>;
    main_page_image: Value<string | undefined>;
    orientation: Value<'Landscape' | 'Portrait' | undefined>;
    width: Value<number | undefined>;
    height: Value<number | undefined>;
    meta: Value<{
        [key: string]: string;
    } | undefined>;
    constructor(core: CoreDesigner, areaHeaderDB: IAreaHeader);
    getAreaHeader(): IAreaHeader;
    setAreaHeader(areaHeader: IAreaHeader): void;
    getAreaHeaderMeta(): {
        [key: string]: string;
    };
    setAreaHeaderMeta(meta: {
        [key: string]: string;
    }): void;
}
