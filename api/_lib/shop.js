// Mirrors the SHOP[] array in index.html - keep in sync (see CLAUDE.md's
// "no shared code" note; the frontend is static HTML with no imports, so it
// necessarily carries its own copy, but the two backend endpoints that need
// this - shop-buy and state - share it here instead of each duplicating it).
//
// `category`/`hex` are only set on the wall/floor cosmetics - they drive
// which one is "equipped" (the most recently purchased item in that
// category, computed in state.js) for the 3D closet view.
const { MOON_CATALOG } = require('../../catalog-data.js');

// Real-world perks (coffee/lunch/tee/giftcard/mini figurine) were retired
// along with the old Shop tab in favor of the monthly raffle (see
// api/_lib/raffle.js) - only closet cosmetics remain purchasable here.
const SHOP_ITEMS = {
  levelup: { price: 15 },
  accessory: { price: 25 },
  walkin: { price: 40 },
  wallSage: { price: 20, category: 'wall', hex: 'c9d9c4' },
  wallBlush: { price: 20, category: 'wall', hex: 'f3dede' },
  floorOak: { price: 20, category: 'floor', hex: 'e0c9a0' },
  floorWalnut: { price: 20, category: 'floor', hex: '5a3d28' },
};

// Every real Closet World finish (see catalog-data.js) - all 42, mirrors
// CLOSET_ITEMS in index.html. Kept in sync by deriving from the same
// MOON_CATALOG data rather than hand-copying prices.
MOON_CATALOG.materials.forEach(function (m) {
  SHOP_ITEMS['wall_' + m.id] = { price: Math.max(10, m.rocks), category: 'wall', hex: m.hex };
});
MOON_CATALOG.rods.forEach(function (r) {
  SHOP_ITEMS['rod_' + r.id] = { price: r.rocks };
});
MOON_CATALOG.accessoryCatalog.forEach(function (a) {
  SHOP_ITEMS['acc_' + a.id] = { price: a.rocks };
});
// Real closet layouts from the app's own catalog (appCatalog.closetContent)
// - prices mirror the curated subset/pricing chosen in index.html.
// `category:'layout'` (like wall/floor's `category`) makes these
// equippable - state.js's equippedSkins() reads it to compute
// `equippedLayout` the same way it already does equippedWall/equippedFloor.
[
  ['shelvesStack', 25], ['longHung', 30], ['doubleHung', 35],
  ['oneBottomHangerWithShelves', 40], ['threeDrawerShelves', 50], ['fourDrawerShelves', 65],
].forEach(function (pair) {
  SHOP_ITEMS['layout_' + pair[0]] = { price: pair[1], category: 'layout', layoutId: pair[0] };
});

// Real Collection tiers (construction-level upgrades - see catalog-data.js's
// `tiers` comment) and real backing-panel options (see `backing`'s comment
// for the invented-price disclosure) - both single-equipped like
// wall/floor/layout above, mirrors index.html's CLOSET_ITEMS.
MOON_CATALOG.tiers.forEach(function (t) {
  SHOP_ITEMS['tier_' + t.id] = { price: t.rocks, category: 'collection', tierId: t.id };
});
MOON_CATALOG.backing.forEach(function (b) {
  SHOP_ITEMS['backing_' + b.id] = { price: b.rocks, category: 'backing', backingId: b.id };
});

module.exports = { SHOP_ITEMS };
