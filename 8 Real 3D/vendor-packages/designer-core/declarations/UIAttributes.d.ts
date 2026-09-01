import type { IValue } from './IValue';
export declare enum UITypes {
    Select = "Select",
    Material = "Material",
    Radio = "Radio",
    Checkbox = "Checkbox",
    Switch = "Switch",
    Input = "Input"
}
/** Same shape as `node.exists` / `FieldDef.exists` — primitive truthy/falsy or token-array formula. */
export type UIExists = IValue<number | boolean>;
export type IUIOption = {
    label?: string;
    value: string | number;
    exists?: UIExists;
};
export type IUIDataCommon = {
    priority: number;
    /** Catalog path to the parent `UICategory` (e.g. `'private/UICategories/General/Parts'`). */
    parent: string;
    /** Target node attribute name. */
    attributeName: string;
    label: string;
    exists?: UIExists;
};
/**
 * Vesta's per-uiType shapes loosened to match live data: in master.json today
 * Checkbox records carry `options: [{label: '0', value: 0}, ...]` instead of
 * Vesta's `{selected: boolean}`. The union below allows both forms.
 */
export type IUIAttributeBody = {
    uiType: UITypes.Select;
    options: IUIOption[];
} | {
    uiType: UITypes.Radio;
    options: IUIOption[];
} | {
    uiType: UITypes.Material;
    options: IUIOption[];
} | {
    uiType: UITypes.Checkbox;
    options?: IUIOption[];
    selected?: boolean;
} | {
    uiType: UITypes.Switch;
    options?: IUIOption[];
    selected?: boolean;
} | {
    uiType: UITypes.Input;
};
export type IUIAttribute = IUIDataCommon & IUIAttributeBody;
export type IUICategory = {
    label: string;
    image: string;
    parent: string | null;
    exists?: UIExists;
};
/** Catalog path: `<scope>/UIAttributes/<group>/<name>` (scope = `master` | `private`). */
export type IUICategoriesMap = Record<string, Record<string, IUICategory>>;
export type IUIAttributesMap = Record<string, Record<string, IUIAttribute>>;
