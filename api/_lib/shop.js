// Mirrors the SHOP[] array in index.html - keep in sync (see CLAUDE.md's
// "no shared code" note; the frontend is static HTML with no imports, so it
// necessarily carries its own copy, but the two backend endpoints that need
// this - shop-buy and state - share it here instead of each duplicating it).
//
// `category`/`hex` are only set on the wall/floor cosmetics - they drive
// which one is "equipped" (the most recently purchased item in that
// category, computed in state.js) for the 3D closet view.
const { MOON_CATALOG } = require('../../catalog-data.js');

const SHOP_ITEMS = {
  levelup: { price: 15 },
  accessory: { price: 25 },
  coffee: { price: 35 },
  walkin: { price: 40 },
  lunch: { price: 50 },
  tee: { price: 60 },
  giftcard: { price: 90 },
  mini: { price: 120 },
  wallSage: { price: 20, category: 'wall', hex: 'c9d9c4' },
  wallBlush: { price: 20, category: 'wall', hex: 'f3dede' },
  floorOak: { price: 20, category: 'floor', hex: 'e0c9a0' },
  floorWalnut: { price: 20, category: 'floor', hex: '5a3d28' },
};

// Real Closet World finishes/rod finishes (see catalog-data.js) - mirrors the
// curated subset added to CLOSET_ITEMS in index.html. Kept in sync by
// deriving from the same MOON_CATALOG data rather than hand-copying prices.
['white', 'antiqueWhite', 'darkGrey', 'fusionMaple', 'signiaEspresso', 'walnut'].forEach(function (mid) {
  var m = MOON_CATALOG.materials.filter(function (x) { return x.id === mid; })[0];
  SHOP_ITEMS['wall_' + m.id] = { price: Math.max(10, m.rocks), category: 'wall', hex: m.hex };
});
MOON_CATALOG.rods.forEach(function (r) {
  SHOP_ITEMS['rod_' + r.id] = { price: r.rocks };
});
MOON_CATALOG.shopAccessories.forEach(function (a) {
  SHOP_ITEMS['acc_' + a.id] = { price: a.rocks };
});
// Real closet layouts from the app's own catalog (appCatalog.closetContent)
// - prices mirror the curated subset/pricing chosen in index.html.
[
  ['shelvesStack', 25], ['longHung', 30], ['doubleHung', 35],
  ['oneBottomHangerWithShelves', 40], ['threeDrawerShelves', 50], ['fourDrawerShelves', 65],
].forEach(function (pair) {
  SHOP_ITEMS['layout_' + pair[0]] = { price: pair[1] };
});

module.exports = { SHOP_ITEMS };
