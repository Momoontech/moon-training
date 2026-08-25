// MOON_CATALOG - the real Closet World / SoCal Closets component & pricing
// catalog (source: "SoCal_CW_01_Closets_Oct_2025_Complete_Configurator"),
// digested down to the facts that are actually useful for training content:
// real category names, real material/finish names, real business rules, and
// a relative price TIER for each option (not the real dollar amount - the
// training app runs on moon rocks, not client quotes, so prices below are
// small rock costs that preserve the real relative ordering of options
// rather than a literal $-to-rock conversion).
//
// This is a deliberate, one-time exception to the "no shared code between
// files" rule in CLAUDE.md: duplicating a catalog this size into every page
// that needs it (Your Closet, Quizzes, Daily Challenge) would defeat the
// point of having one source of truth. Any page that needs this data loads
// it via <script src="catalog-data.js"></script> before its own <script>.
//
// Left OUT on purpose: raw SKU/macro codes, "#N/A"/"Not Implemented" rows,
// and product-line codes for Closet World's other divisions (garage, office,
// bedroom) that shared this same spreadsheet template - none of that is
// real, user-facing content.
var MOON_CATALOG = {

  // Overall product/finish tiers a closet design can be built in.
  tiers: [
    { id: 'essentials', name: 'Essentials', desc: '3/4" straight-edge panels & shelves, flat-face doors/drawers.', rocks: 0 },
    { id: 'signature', name: 'Signature', desc: '3/4" soft-edge panels & shelves, soft-edge flat-face doors/drawers.', rocks: 20 },
    { id: 'legacy', name: 'Legacy', desc: '1 1/8" thick panels, soft-edge shelves and doors/drawers.', rocks: 35 },
    { id: 'deluxe', name: 'Deluxe', desc: 'Inset (soft-edge, flat-face) doors & drawers, accent top shelf, 13" deep panels.', rocks: 55 }
  ],

  // Real finish/material names, grouped the way the price sheet groups them,
  // each carrying the rock tier that preserves its real relative cost.
  materials: [
    { id: 'white', name: 'White', hex: 'fbfaf9', tier: 0, rocks: 0 },
    { id: 'antiqueWhite', name: 'Antique White', hex: 'f0ead6', tier: 1, rocks: 15 },
    { id: 'lightGrey', name: 'Light Grey', hex: 'c9c9c9', tier: 1, rocks: 15 },
    { id: 'darkGrey', name: 'Dark Grey', hex: '5c5c5c', tier: 1, rocks: 15 },
    { id: 'almond', name: 'Almond', hex: 'e8d9b5', tier: 1, rocks: 15 },
    { id: 'black', name: 'Black', hex: '1c1c1c', tier: 1, rocks: 15 },
    { id: 'fusionMaple', name: 'Fusion Maple', hex: 'c98a4b', tier: 2, rocks: 30 },
    { id: 'hardRockMaple', name: 'Hard Rock Maple', hex: 'd9a25c', tier: 2, rocks: 30 },
    { id: 'sherwoodOak', name: 'Sherwood Oak', hex: '8a5a34', tier: 2, rocks: 30 },
    { id: 'candlelight', name: 'Candlelight', hex: 'caa96a', tier: 2, rocks: 30 },
    { id: 'signiaEspresso', name: 'Espresso (Signia)', hex: '3b2b22', tier: 3, rocks: 35 },
    { id: 'signiaSandstone', name: 'Sandstone (Signia)', hex: 'c9b79c', tier: 3, rocks: 35 },
    { id: 'signiaGreystone', name: 'Greystone (Signia)', hex: '767a78', tier: 3, rocks: 35 },
    { id: 'redOak', name: 'Red Oak (real wood veneer)', hex: 'a6672c', tier: 4, rocks: 55 },
    { id: 'cherry', name: 'Cherry (real wood veneer)', hex: '6b2e21', tier: 5, rocks: 80 },
    { id: 'whiteOak', name: 'White Oak (real wood veneer)', hex: 'b58a55', tier: 5, rocks: 80 },
    { id: 'walnut', name: 'Walnut (real wood veneer)', hex: '3e2417', tier: 5, rocks: 85 }
  ],
  materialRule: 'White is the baseline (no charge). Antique White/Grey/Black/Almond run about +8%. Wood-grain melamine (Fusion Maple, Hard Rock Maple, Sherwood Oak) and Signia textured finishes run about +25%. Real wood veneers run from +80% (Red Oak) up to +170% (Walnut) - solid hardwood is never available, only veneer.',

  panels: {
    types: ['Wall Panel (WP)', 'End Panel (EP)', 'Center Panel (CP)', 'Dividing Panel (DP)', 'L-Shaped 90° Panel (LSP)', 'L-Shaped Curved Panel (CSP)', 'Tapered Panel (TP)'],
    depths: ['12"', '16"', '20"', '24"', '32"', '36"', '48"'],
    maxStandardHeight: 96,
    rule: 'Panels over 96" tall (up to 120") are only available in white with no seam. Any other color needs a seamed 1/4" panel added on top, with a top storage shelf covering the seam.'
  },

  shelves: {
    types: ['Adjustable (S)', 'Locked (LS)', 'Corner L-Shelf', 'Corner Angle Shelf', 'Pie Shelf', 'Triangle Shelf', 'Bridge Shelf'],
    maxSpanInches: 42,
    rule: 'Closet World does not allow a shelf span over 42" without adding a center rod support, a shelf, and an "L" bracket.'
  },

  rods: [
    { id: 'ovalChrome', name: 'Oval Chrome', tier: 0, rocks: 15 },
    { id: 'ovalBrass', name: 'Oval Brass', tier: 1, rocks: 22 },
    { id: 'roundChrome', name: 'Round Chrome', tier: 1, rocks: 22 },
    { id: 'roundBrass', name: 'Round Brass', tier: 2, rocks: 30 },
    { id: 'roundMatteChrome', name: 'Round Matte Chrome', tier: 2, rocks: 28 },
    { id: 'roundMatteBrass', name: 'Round Matte Brass', tier: 2, rocks: 28 },
    { id: 'roundSatinNickel', name: 'Round Satin Nickel', tier: 2, rocks: 28 },
    { id: 'roundOilRubbedBronze', name: 'Round Oil-Rubbed Bronze', tier: 3, rocks: 32 }
  ],
  rodRule: 'All rods are adjustable, but the maximum length for a steel rod is 42". Longer spans need a center rod support (same 42" rule as shelves).',

  doorStyles: [
    { id: 'flatFace', name: 'Flat Face', tier: 0 },
    { id: 'deco100', name: 'Deco 100', tier: 1 },
    { id: 'deco200', name: 'Deco 200', tier: 1 },
    { id: 'deco300', name: 'Deco 300', tier: 1 },
    { id: 'deco400', name: 'Deco 400', tier: 1 },
    { id: 'deco500', name: 'Deco 500', tier: 2 },
    { id: 'shaker600', name: 'Shaker 600', tier: 2 }
  ],
  doorRules: [
    'Deco 500 and Shaker 600 cost about 80% more than Deco 100/200/300/400.',
    'Lucite doors cannot use touch-latch - they must have a handle.',
    'Glass doors must use touch-latch (inset) and cannot have a handle.',
    'Doors over 84" tall use two doors stacked and joined on the back, opening as one.'
  ],

  drawers: [
    { id: 'dr75', name: '75% Extension', tier: 0 },
    { id: 'dr100', name: '100% Extension', tier: 0 },
    { id: 'file', name: 'File Drawer', tier: 1 },
    { id: 'doubleFile', name: 'Double File Drawer (up to 36" wide)', tier: 2 },
    { id: 'security', name: 'Security Drawer (false bottom)', tier: 2 },
    { id: 'display', name: 'Display Drawer (glass front, no handle)', tier: 3 },
    { id: 'shoe', name: 'Shoe Drawer', tier: 1 },
    { id: 'tieBelt', name: 'Tie & Belt Drawer', tier: 2 },
    { id: 'ironingBoard', name: 'Pull-Out Ironing Board Drawer', tier: 3 }
  ],
  drawerRules: [
    'Max standard drawer size is 30"w x 24"d with one handle.',
    'All melamine drawer boxes are white by default; matching the drawer box to the door color costs extra.',
    'File drawers are always 12 1/2" tall (100% extension).'
  ],

  accessories: {
    tieAndBeltRacks: ['CW Tie Rack', 'CW Belt Rack', 'CW Combo Tie & Belt Rack', 'Synergy Tie Rack', 'Synergy Belt Rack'],
    valetRods: ['CW Telescoping Valet Rod', 'Synergy Valet Rod'],
    pantRacks: ['Synergy Pull-Out Pant Rack (18"/24"/30" wide)'],
    coatHooks: ['1 to 5 hooks on a Deco base, 6" to 24" wide'],
    hampers: ['Pull-Out Hamper', 'Tilt-Out Hamper (wire basket)', 'Tilt-Out Hamper (nylon bag)'],
    finishes: ['Polished Chrome', 'Matte Chrome', 'Satin Nickel (Champagne)', 'Oil-Rubbed Bronze', 'Black Nickel'],
    baskets: 'Designer Series wire baskets, roller-slide or shelf-supported, in White or Chrome, various widths/heights.',
    createACloset: 'Create-A-Closet (CAC): a sliding-door system built from 16"-20" deep panels behind a 2 or 3-panel mirror/glass sliding door set, either below the ceiling (max 96") or floor-to-ceiling.'
  },

  // Curated, purchasable real accessories - a representative pick across the
  // catalog's accessory categories (not every SKU/size variant), priced in
  // rock tiers that preserve the real relative cost order (a coat hook rack
  // is real-world cheap, a pull-out pant rack or wine rack is real-world
  // premium). No custom illustration per item yet - `icon` names a shared
  // placeholder shape to render with until real art exists.
  shopAccessories: [
    { id: 'coatHooks', name: 'Coat Hook Rack', desc: '5 hooks on a Deco base.', icon: 'hook', rocks: 20 },
    { id: 'lBracketSupport', name: 'Center Rod Support Kit', desc: 'L-bracket + center support for long spans.', icon: 'bracket', rocks: 20 },
    { id: 'valetRod', name: 'Telescoping Valet Rod', desc: 'Pulls out for easy outfit-staging.', icon: 'rod', rocks: 25 },
    { id: 'tieBeltRack', name: 'Tie & Belt Rack', desc: 'Combo rack, Deco base to match your panels.', icon: 'hook', rocks: 30 },
    { id: 'designerBasket', name: 'Designer Series Basket', desc: 'Roller-slide wire basket, White or Chrome.', icon: 'basket', rocks: 35 },
    { id: 'movableIsland', name: 'Movable Island', desc: 'Freestanding island with casters and bottom trim.', icon: 'box', rocks: 50 },
    { id: 'pullOutHamper', name: 'Pull-Out Hamper', desc: 'Large drawer box hamper, removable liner.', icon: 'drawer', rocks: 55 },
    { id: 'wallIroningBoard', name: 'Wall-Mount Ironing Board', desc: 'Folds away behind a Deco door.', icon: 'box', rocks: 80 },
    { id: 'pantRack', name: 'Pull-Out Pant Rack', desc: 'Synergy pull-out rack, up to 24 hangers.', icon: 'basket', rocks: 75 },
    { id: 'wineRackLattice', name: 'Wine Rack Lattice Panel', desc: 'Unfinished oak or maple, holds 20+ bottles.', icon: 'box', rocks: 90 }
  ],

  molding: ['Base Molding', 'Deco Base Molding', 'Crown (small/medium/large)', 'Deco Top Molding', 'Valance', 'Deco Valance', 'Shoe Molding', 'Scribe Molding', 'Toe Kick', 'Platform', 'Cleats', 'Fascia'],
  moldingRule: 'Molding packages add 11-25% to the job: 11% for top-or-bottom molding alone, up to 25% for top-to-the-ceiling plus a bottom package.',

  backing: ['Touch of Cedar strip', 'Cedar (1/4" veneer)', 'Solid Cedar Tongue & Groove', 'Standard Backing', 'Signia Backing', 'Plywood Backing (Red Oak/Mahogany/Birch/Cherry/Maple/White Oak/Walnut)', 'Peg Board'],

  lighting: {
    types: ['LED Puck Lights (1-10 lights)', 'LED Panel Strip Lights (1-10 sections)'],
    trimColors: ['Black', 'Dark Brown', 'Matte Nickel', 'Matte Silver', 'Polished Stainless', 'White'],
    note: 'Puck lights recess-mount into a 2.5" toe-kick; panel strip lights fit inside standard 3/4" or 1 1/8" thick panels/shelves. Both are cool white (4K) with a wireless dimmer control.'
  },

  slatwall: {
    colors: ['White', 'Almond', 'Grey', 'Black', 'Oak', 'Clear Mirror'],
    accessories: ['7-Ball Waterfall (Chrome)', 'Jewelry T-Bar (Acrylic)', 'Hooks (1"/2"/4", Chrome)', 'Acrylic Trays', 'Acrylic Shelf', 'Hosiery Bins', 'Utility Basket System']
  },

  hplCounterBrands: ['Wilsonart', 'Formica', 'Nevamar', 'Pionite', 'Arborite'],
  hplSampleColors: ['Mystique Night', 'Pewter Brush', 'Burnished Chestnut', 'Storm', 'Graphite', 'Marine Blue', 'Canyon Fissure', 'Copper Fusion', 'Suede Sage Coral', 'Suede Moss Gray', 'Van Gogh Charcoal', 'Artic Snow'],
  hplRule: 'There are 68 total HPL countertop colors across 5 brands. Signia HPL is only available in a flat, smooth finish (no texture) and is priced the same as special-order colors.',

  specialtyItems: ['Wine Rack Lattice Panels', 'Wine Bottle Scallops', 'Grommets (computer/electrical cord)', 'L-Bracket', 'Heavy-Duty L-Bracket', 'Center Rod Support', 'Movable Island', 'Wall-Mount Ironing Board'],

  // Real business rules worth quizzing/challenging designers on - each one
  // is a fact a real Closet World designer needs to know at the client's
  // house, not just trivia.
  rules: [
    'No shelf or rod span over 42" without adding a center rod support, shelf, and "L" bracket.',
    'Panels over 96" tall are white-only unless you add a seamed 1/4" panel plus a top storage shelf to cover the seam.',
    'Glass doors must be touch-latch and cannot have a handle; Lucite doors are the opposite - they must have a handle and cannot be touch-latch.',
    'Deco 500 and Shaker 600 door styles cost about 80% more than Deco 100-400.',
    'Solid hardwood is never available - "wood" finishes are always veneer, and pricing runs from +80% (Red Oak) to +170% (Walnut).',
    'Doors over 84" tall are built as two doors stacked and joined on the back, opening as one unit.',
    'Closet World does not remove existing built-in cabinetry - the customer must remove, patch, and paint before installation.',
    'No counter tops are made for curved walls.'
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = { MOON_CATALOG: MOON_CATALOG };
