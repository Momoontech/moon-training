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

  // The real Sales Designer App's "Catalog" panel filters items by exactly
  // these sections (confirmed from the Figma "Design + Present Panel V2"
  // design, node 18147:55290) - note materials/colors are NOT their own
  // section there (they're a property on an item, not a category), and
  // panels live under a separate "Architecture" tool, not "Catalog". Use
  // this list - not an improvised one - whenever content needs to filter
  // the catalog "the way the real app does."
  sections: ['Shelves', 'Drawers', 'Rods', 'Edgebanding', 'Molding', 'Doors & Drawers', 'Countertops', 'Hardware'],

  // Overall product/finish tiers a closet design can be built in.
  tiers: [
    { id: 'essentials', name: 'Essentials', desc: '3/4" straight-edge panels & shelves, flat-face doors/drawers.', rocks: 0 },
    { id: 'signature', name: 'Signature', desc: '3/4" soft-edge panels & shelves, soft-edge flat-face doors/drawers.', rocks: 20 },
    { id: 'legacy', name: 'Legacy', desc: '1 1/8" thick panels, soft-edge shelves and doors/drawers.', rocks: 35 },
    { id: 'deluxe', name: 'Deluxe', desc: 'Inset (soft-edge, flat-face) doors & drawers, accent top shelf, 13" deep panels.', rocks: 55 }
  ],

  // Not one of the real app's catalog sections above - materials/finishes
  // are a property you pick ON an item (a panel, a door), not their own
  // catalog category there. Kept as its own list here because that's how
  // our Customize panel's "Colors & Textures" tab uses it.
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
    section: 'Shelves',
    types: ['Adjustable (S)', 'Locked (LS)', 'Corner L-Shelf', 'Corner Angle Shelf', 'Pie Shelf', 'Triangle Shelf', 'Bridge Shelf'],
    maxSpanInches: 42,
    rule: 'Closet World does not allow a shelf span over 42" without adding a center rod support, a shelf, and an "L" bracket.'
  },

  // section: 'Rods'
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

  // section: 'Doors & Drawers' (real app groups doors and drawers together)
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

  // section: 'Doors & Drawers'
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

  // Every real accessory product TYPE from the catalog's "Closet Accessories"
  // (pages 11-13) and "Specialty Items" (page 16) sections - complete at the
  // product level (finish/size options are metadata on each entry, not
  // separate rows, so this isn't hundreds of SKU permutations, but no real
  // product type is missing). All fall under the real app's "Hardware"
  // catalog filter (see `sections` below) - there's no separate
  // "Accessories" chip in the real app.
  accessoryFinishes: ['Polished Chrome', 'Matte Chrome', 'Satin Nickel (Champagne)', 'Oil-Rubbed Bronze', 'Black Nickel'],
  accessoryCatalog: [
    { id: 'cwTieRack', name: 'CW Tie Rack', note: 'Deco base matches your panel color. Fixed or sliding, 12"-24" wide.', section: 'Hardware' },
    { id: 'cwBeltRack', name: 'CW Belt Rack', note: 'Deco base. Fixed or sliding, 12"-24" wide.', section: 'Hardware' },
    { id: 'cwComboRack', name: 'CW Combo Tie & Belt Rack', note: 'Deco base. Fixed or sliding, 12"-24" wide.', section: 'Hardware' },
    { id: 'synergyTieRack', name: 'Synergy Tie Rack', note: 'Sliding only, 12"/14", anodized aluminum base.', section: 'Hardware' },
    { id: 'synergyBeltRack', name: 'Synergy Belt Rack', note: 'Sliding only, 12"/14".', section: 'Hardware' },
    { id: 'manufacturedBeltRack', name: 'Manufactured Belt Rack', note: '14" wide, 6 chrome hooks on a white base.', section: 'Hardware' },
    { id: 'manufacturedTieRack', name: 'Manufactured Tie Rack', note: '14" wide, 24 chrome hooks on a white base.', section: 'Hardware' },
    { id: 'cwValetRod', name: 'CW Telescoping Valet Rod', note: '12" or 14", Chrome or Satin Nickel.', section: 'Hardware' },
    { id: 'synergyValetRod', name: 'Synergy Valet Rod', note: '12" pull-out rod.', section: 'Hardware' },
    { id: 'synergyPantRack', name: 'Synergy Pull-Out Pant Rack', note: '18"/24"/30" wide, 12-24 hangers.', section: 'Hardware' },
    { id: 'garmentClips', name: 'Garment Clips', note: 'Black clips for the pant rack, sold in packs of 24/36.', section: 'Hardware' },
    { id: 'wirePantHanger', name: 'Extra Wire Pant Hanger', note: 'Black, sold in packs of 6.', section: 'Hardware' },
    { id: 'coatHookRack', name: 'Coat Hook Rack', note: '1 to 5 hooks on a Deco base, 6"-24" wide.', section: 'Hardware' },
    { id: 'pullOutHamper', name: 'Pull-Out Hamper', note: 'Large drawer box, max 24"w x 24"h x 24"d.', section: 'Hardware' },
    { id: 'tiltOutHamperWire', name: 'Tilt-Out Hamper (wire basket)', note: 'Removable wire basket, White or Chrome.', section: 'Hardware' },
    { id: 'tiltOutHamperBag', name: 'Tilt-Out Hamper (nylon bag)', note: '18"/24"/30" wide, removable black nylon bag.', section: 'Hardware' },
    { id: 'clothesCarrier', name: 'Clothes Carrier', note: '12"/16"/20", Chrome.', section: 'Hardware' },
    { id: 'pullDownRod', name: 'Pull-Down Rod', note: '28"-42" wide sections, Chrome or Black.', section: 'Hardware' },
    { id: 'designerBasket', name: 'Designer Series Basket', note: 'Roller-slide wire basket, White or Chrome, various sizes.', section: 'Hardware' },
    { id: 'shelfSupportedBasket', name: 'Shelf-Supported Basket', note: 'For section widths wider than a roller basket allows.', section: 'Hardware' },
    { id: 'createACloset', name: 'Create-A-Closet (CAC)', note: 'Sliding mirror/glass door system, 2 or 3-panel, below-ceiling or to-ceiling.', section: 'Hardware' },
    { id: 'wineRackLattice', name: 'Wine Rack Lattice Panel', note: 'Unfinished oak or maple, 18x30" up to 24x43", holds 20+ bottles.', section: 'Hardware' },
    { id: 'wineBottleScallops', name: 'Wine Bottle Scallops', note: '18"/24"/30" wide, unfinished oak or maple.', section: 'Hardware' },
    { id: 'computerGrommet', name: 'Computer Paper Slot Grommet', note: 'For cable pass-through behind a desk/printer shelf.', section: 'Hardware' },
    { id: 'electricalGrommet', name: 'Electrical Cord Grommet', note: '2" or 3" diameter, 5 colors.', section: 'Hardware' },
    { id: 'lBracket', name: 'L-Bracket', note: 'High-quality, white, for shelf spans up to 32".', section: 'Hardware' },
    { id: 'heavyDutyLBracket', name: 'Heavy-Duty L-Bracket', note: 'For 16"-24" deep shelves, up to 32" spacing.', section: 'Hardware' },
    { id: 'centerRodSupport', name: 'Center Rod Support', note: 'Chrome, includes a high-quality L-bracket - required over 42" spans.', section: 'Hardware' },
    { id: 'movableIsland', name: 'Movable Island', note: 'Freestanding, up to 36"w x 42"d, casters and bottom trim included.', section: 'Hardware' },
    { id: 'wallIroningBoard', name: 'Wall-Mount Ironing Board', note: 'Folds away behind a Deco door, 36" board.', section: 'Hardware' }
  ],

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

  // section: 'Edgebanding'
  edgebanding: [
    { name: 'Different Color Edge Banding', pctAdd: 5 },
    { name: 'Wood Veneer Edge Banding', pctAdd: 10, note: 'Straight edge only.' },
    { name: 'Complete Edge Banding (all sides)', pctAdd: 20, note: 'All sides of panels, shelves, drawers, doors, toe-kicks, cleats & fascia.' }
  ],

  // section: 'Molding'
  molding: ['Base Molding', 'Deco Base Molding', 'Crown (small/medium/large)', 'Deco Top Molding', 'Valance', 'Deco Valance', 'Shoe Molding', 'Scribe Molding', 'Toe Kick', 'Platform', 'Cleats', 'Fascia'],
  moldingRule: 'Molding packages add 11-25% to the job: 11% for top-or-bottom molding alone, up to 25% for top-to-the-ceiling plus a bottom package.',

  // section: 'Hardware' (backing is installed alongside countertops/shelving, no exact real-app chip)
  backing: ['Touch of Cedar strip', 'Cedar (1/4" veneer)', 'Solid Cedar Tongue & Groove', 'Standard Backing', 'Signia Backing', 'Plywood Backing (Red Oak/Mahogany/Birch/Cherry/Maple/White Oak/Walnut)', 'Peg Board'],

  // section: 'Hardware'
  lighting: {
    types: ['LED Puck Lights (1-10 lights)', 'LED Panel Strip Lights (1-10 sections)'],
    trimColors: ['Black', 'Dark Brown', 'Matte Nickel', 'Matte Silver', 'Polished Stainless', 'White'],
    note: 'Puck lights recess-mount into a 2.5" toe-kick; panel strip lights fit inside standard 3/4" or 1 1/8" thick panels/shelves. Both are cool white (4K) with a wireless dimmer control.'
  },

  // section: 'Hardware'
  slatwall: {
    colors: ['White', 'Almond', 'Grey', 'Black', 'Oak', 'Clear Mirror'],
    accessories: ['7-Ball Waterfall (Chrome)', 'Jewelry T-Bar (Acrylic)', 'Hooks (1"/2"/4", Chrome)', 'Acrylic Trays', 'Acrylic Shelf', 'Hosiery Bins', 'Utility Basket System']
  },

  // section: 'Countertops'
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
  ],

  // The REAL Sales Designer App's catalog item registry (from the app's own
  // private.json catalog export) - actual product IDs, names, and hosted
  // thumbnail images, not digested/approximated like the pricing data
  // above. `source` is the app's internal asset path, kept for traceability
  // back to the real catalog if this needs to be cross-checked later.
  // Mo's own words: "some of these might change" - treat this as the
  // current real baseline, not a permanently frozen list.
  appCatalog: {
    // Closet interior "content" configurations - what actually fills a
    // section (Your Closet uses these as real hang/shelf/drawer options).
    closetContent: [
      { id: 'oneBottomHangerWithShelves', name: 'Bottom Hang + Shelves', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/onebottomhangerwithshelvescontenttall-1-bottom-hanger-with-shelves.png', source: 'master/Parts/General/OneBottomHangerWithShelvesContentTall' },
      { id: 'doubleHung', name: 'Double Hang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/doublehungcontenttall-double-hung.png', source: 'master/Parts/General/DoubleHungContentTall' },
      { id: 'longHung', name: 'Long Hang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/longhungcontenttall-long-hung.png', source: 'master/Parts/General/LongHungContentTall' },
      { id: 'fourDrawerShelves', name: '4 Drawer + Shelves', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/10-10-10-10dbshelvescontenttall-10-10-10-10-db-shelves.png', source: 'master/Parts/General/10-10-10-10DBShelvesContentTall' },
      { id: 'threeDrawerShelves', name: '3 Drawer + Shelves', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/10-10-10dbshelvescontenttall-10-10-10-db-shelves.png', source: 'master/Parts/General/10-10-10DBShelvesContentTall' },
      { id: 'shelvesStack', name: 'Shelves', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/shelvesstackcontenttall-shelves-stack.png', source: 'master/Parts/General/ShelvesStackContentTall' },
      { id: 'contentUpperBase', name: 'Content Upper+Base', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetsectioncontentbaseupper-content-upper-base.png', source: 'master/Parts/General/MultiClosetSectionContentBaseUpper' },
      { id: 'contentBase', name: 'Content Base', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetsectioncontentbase-content-base.png', source: 'master/Parts/General/MultiClosetSectionContentBase' },
      { id: 'section', name: 'Section', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetsection-section.png', source: 'master/Parts/General/MultiClosetSection' }
    ],
    // Structural closet parts - separators between sections (real images)
    // plus internal building-block parts (no thumbnails - shelves/rods/
    // drawers/toe-kicks that make up the content configs above).
    closetSeparators: [
      { id: 'separatorTall', name: 'Multi Closet Tall Separator', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetseparatortall-multi-closet-tall-separator.png', source: 'master/Parts/General/MultiClosetSeparatorTall' },
      { id: 'separatorBase', name: 'Multi Closet Base Separator', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetseparatorbase-multi-closet-base-separator.png', source: 'master/Parts/General/MultiClosetSeparatorBase' },
      { id: 'separatorUpper', name: 'Multi Closet Upper Separator', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetseparatorupper-multi-closet-upper-separator.png', source: 'master/Parts/General/MultiClosetSeparatorUpper' },
      { id: 'separatorBaseUpper', name: 'Multi Closet Base+Upper Separator', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosetseparatorbaseupper-multi-closet-base-upper-separator.png', source: 'master/Parts/General/MultiClosetSeparatorBaseUpper' }
    ],
    closetStructureParts: ['TK facia (toe-kick facia panel)', 'Multi Closet Shelf', 'Shelf Adjustable - Stack', 'Rod - Adjustable', 'Hanging - Stack', 'FS Bottom (fixed shelf)', 'Drawer - Stack', 'Multi Closet Drawer Part', 'Multi Closet Adjustable Shelf Part', 'Multi Closet Fixed Shelf Part', 'Multi Closet Toe Kick Part', 'FS Top (fixed shelf)'],
    cabinets: [
      { id: 'reachInCloset1', name: 'Reach In Closet 1', source: 'master/Products/Cabinets/ReachInCloset1' },
      { id: 'multiClosetTall', name: 'Multi Closet Tall Product', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images/multiclosettallproduct-multi-closet-tall-product.png', source: 'master/Products/Cabinets/MultiClosetTallProduct' }
    ],
    // Real door/window/electrical catalog - this is the actual list a
    // designer picks from in the real app's Obstacles step (replaces any
    // earlier guessed door/window lists elsewhere in this app).
    doors: [
      { id: 'doorDouble', name: 'Double Door', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doordouble-double-door.png' },
      { id: 'casedWallOpening', name: 'Cased Wall Opening', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/casedwallopening-cased-wall-opening.png' },
      { id: 'doorSlidingLeft', name: 'Door - Sliding Left', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doorslidingleft-door-sliding-left.png' },
      { id: 'doorSingle', name: 'Door', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doorsingle-door.png' },
      { id: 'doorDoubleSidePanels', name: 'Door - Double Side Panels', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doordoublesidepanels-door-double-side-panels.png' },
      { id: 'doorSingleSidePanel', name: 'Door - Single Side Panel', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doorsinglesidepanel-door-single-side-panel.png' },
      { id: 'doorSlidingRight', name: 'Door - Sliding Right', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/doorslidingright-door-sliding-right.png' }
    ],
    windows: [
      { id: 'windowBay', name: 'Window - Bay', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/windowbay-window-bay.png' },
      { id: 'windowSinglePane', name: 'Window - Single Pane', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/windowsinglepane-window-single-pane.png' },
      { id: 'windowSliding', name: 'Window - Sliding', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/windowsliding-window-sliding.png' },
      { id: 'windowDoubleHung', name: 'Window - Double-Hung', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/windowdoublehung-window-double-hung.png' }
    ],
    electrical: [
      { id: 'lightSwitchToggleSingle', name: 'Light Switch Toggle - Single Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchtogglesinglegang-light-switch-toggle-single-gang.png' },
      { id: 'lightSwitchToggleDouble', name: 'Light Switch Toggle - Double Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchtoggledoublegang-light-switch-toggle-double-gang.png' },
      { id: 'lightSwitchToggleTriple', name: 'Light Switch Toggle - Triple Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchtoggletriplegang-light-switch-toggle-triple-gang.png' },
      { id: 'lightSwitchRockerSingle', name: 'Light Switch Rocker - Single Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchrockersinglegang-light-switch-rocker-single-gang.png' },
      { id: 'lightSwitchRockerTriple', name: 'Light Switch Rocker - Triple Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchrockertriplegang-light-switch-rocker-triple-gang.png' },
      { id: 'lightSwitchDoubleRockerSingle', name: 'Light Switch Double Rocker - Single Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchdoublerockersinglegang-light-switch-double-rocker-single-gang.png' },
      { id: 'lightSwitchDoubleRockerDouble', name: 'Light Switch Double Rocker - Double Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchdoublerockerdoublegang-light-switch-double-rocker-double-gang.png' },
      { id: 'lightSwitchTripleRockerSingle', name: 'Light Switch Triple Rocker - Single Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/lightswitchtriplerockersinglegang-light-switch-triple-rocker-single-gang.png' },
      { id: 'wallOutletSingle', name: 'Wall Outlet - Single Gang', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/walloutletsinglegang-wall-outlet-single-gang.png' },
      { id: 'ventRegisterLarge', name: 'Vent Register Large', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/ventregisterlarge-vent-register-large.png' },
      { id: 'ventRegisterSmall', name: 'Vent Register Small', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/ventregistersmall-vent-register-small.png' },
      { id: 'electricalPanel', name: 'Electrical Panel', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/electricalpanel-electrical-panel.png' },
      { id: 'wallObstacle', name: 'Wall Obstacle', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/wallobstacle-wall-obstacle.png' },
      { id: 'floorObstacle', name: 'Floor Obstacle', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/floorobstacle-floor-obstacle.png' }
    ],
    // Lighting/appliance fixtures - real catalog items, but not part of the
    // Obstacles step's Doors/Windows/Electrical tabs. Kept for whichever
    // future challenge or Your Closet decor option needs them.
    fixtures: [
      { id: 'ceilingFan', name: 'Ceiling Fan', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/ceilingfan-ceiling-fan.png' },
      { id: 'tvWallMounted', name: 'TV Wall Mounted', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/tvwallmounted-tv-wall-mounted.png' },
      { id: 'tableLamp', name: 'Table Lamp', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/tablelamp-table-lamp.png' },
      { id: 'deskLampBlack', name: 'Desk Lamp Black', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/desklampblack-desk-lamp-black.png' },
      { id: 'standardLight', name: 'Standard Light', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/standardlight-standard-light.png' },
      { id: 'islandLightBlack3Bulb', name: 'Island Light - Black 3 Bulb', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/islandlightblackthreebulb-island-light-black-3-bulb.png' },
      { id: 'wallSconceGold', name: 'Wall Sconce - Gold w Frosted Globe', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/wallsconcegoldwfrostedglobe-wall-sconce-gold-w-frosted-globe.png' },
      { id: 'pendantFrostedCylinder', name: 'Pendant - Frosted Cylinder', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/pendantfrostedcylinder-pendant-frosted-cylinder.png' },
      { id: 'chandelierBlack9Bulb', name: 'Chandelier - Black 9 Bulb', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/environment-objects/images-enhanced/chandelierblackninebulb-chandelier-black-9-bulb.png' },
      { id: 'wineCooler', name: 'Wine Cooler', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/winecooler-wine-cooler.png' },
      { id: 'laundryFrontLoadUpperWhite', name: 'Laundry Front Load Upper White', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/laundryfrontloadupperwhite-laundry-front-load-upper-white.png' },
      { id: 'laundryTopLoadWhite', name: 'Laundry Top Load White', image: 'https://stmoonsalespubdevwus3.blob.core.windows.net/catalog-media/catalog-items/images-enhanced/laundrytoploadwhite-laundry-top-load-white.png' }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = { MOON_CATALOG: MOON_CATALOG };
