/**
 * The 17 aggregation categories, in the same order vesta's transform iterated
 * them. Single source of truth for grouping + the per-material roll-up.
 */
const CATEGORY_KEYS = [
    'panels',
    'laminate',
    'glass',
    'handles',
    'edgebandings',
    'hinges',
    'legs',
    'accessories',
    'drawerSystems',
    'drawerSlides',
    'parts',
    'crownMoldings',
    'topValances',
    'bottomValances',
    'toeKicks',
    'countertops',
    'floor'
];
/** A fresh, fully-seeded set of empty category arrays. */
const emptyCategoryCalculations = () => ({
    panels: [],
    laminate: [],
    glass: [],
    handles: [],
    edgebandings: [],
    hinges: [],
    legs: [],
    accessories: [],
    drawerSystems: [],
    drawerSlides: [],
    parts: [],
    crownMoldings: [],
    topValances: [],
    bottomValances: [],
    toeKicks: [],
    countertops: [],
    floor: []
});
/**
 * How a single calculation line contributes to its per-material quantity total.
 * Identical rules to moon-vesta `getCalculationOnUpdateProject` (area / width /
 * width*height / unit count / width-or-one).
 */
const quantityOf = (key, entry) => {
    const e = entry;
    switch (key) {
        case 'parts':
            return (e.width ?? 0) * (e.height ?? 0);
        case 'panels':
        case 'bottomValances':
        case 'topValances':
        case 'toeKicks':
        case 'countertops':
        case 'laminate':
        case 'glass':
        case 'floor':
            return e.area ?? 0;
        case 'crownMoldings':
        case 'edgebandings':
            return e.width ?? 0;
        case 'handles':
        case 'legs':
        case 'drawerSystems':
        case 'drawerSlides':
        case 'hinges':
            return 1;
        case 'accessories':
            return e.width || 1;
        default:
            return 0;
    }
};

export { CATEGORY_KEYS, emptyCategoryCalculations, quantityOf };
