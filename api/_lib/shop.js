// Mirrors the SHOP[] array in index.html - keep in sync (see CLAUDE.md's
// "no shared code" note; the frontend is static HTML with no imports, so it
// necessarily carries its own copy, but the two backend endpoints that need
// this - shop-buy and state - share it here instead of each duplicating it).
//
// `category`/`hex` are only set on the wall/floor cosmetics - they drive
// which one is "equipped" (the most recently purchased item in that
// category, computed in state.js) for the 3D closet view.
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

module.exports = { SHOP_ITEMS };
