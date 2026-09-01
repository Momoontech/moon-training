export declare const childrenProperties: readonly ["children", "points", "segments", "rooms", "walls3D", "stages", "walls2D", "interiorComponents", "exteriorComponents", "sections", "separators", "content", "bays"];
export declare const singleChildProperties: readonly ["floor2D", "ceiling2D", "wall2D"];
export declare const orderedChildrenProperties: (typeof childrenProperties)[number][];
export declare function isOrderedChildrenProperty(property: string): property is (typeof childrenProperties)[number];
