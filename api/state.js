const { requireUser, isAdminEmail, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');
const { SHOP_ITEMS } = require('./_lib/shop');

// The "equipped" wall/floor/layout is just whichever cosmetic in that
// category was bought most recently - no separate equip action, buying one
// just switches to it immediately (see the Shop's wall/floor color items,
// and the Layouts items - Shelves/Long Hang/Double Hang/etc).
function equippedSkins(purchases) {
  var sorted = (purchases || []).slice().sort(function (a, b) {
    return new Date(b.purchased_at) - new Date(a.purchased_at);
  });
  var result = { equippedWall: null, equippedFloor: null, equippedLayout: null };
  for (var i = 0; i < sorted.length; i++) {
    var item = SHOP_ITEMS[sorted[i].item_id];
    if (!item || !item.category) continue;
    if (item.category === 'wall' && !result.equippedWall) result.equippedWall = item.hex;
    if (item.category === 'floor' && !result.equippedFloor) result.equippedFloor = item.hex;
    if (item.category === 'layout' && !result.equippedLayout) result.equippedLayout = item.layoutId;
  }
  return result;
}

// GET /api/state - replaces loadS(): returns this designer's current
// tokens/streak/visits/claimed achievements/owned shop items.
module.exports = async (req, res) => {
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();

    const [{ data: closet }, { data: balanceRow }, { data: achievements }, { data: purchases }] = await Promise.all([
      supabase.from('closet_state').select('*').eq('user_id', user.id).single(),
      supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle(),
      supabase.from('achievements').select('achievement_id').eq('user_id', user.id),
      supabase.from('shop_purchases').select('item_id, purchased_at').eq('user_id', user.id),
    ]);

    res.status(200).json({
      name: user.name,
      email: user.email,
      tokens: balanceRow ? balanceRow.tokens : 0,
      streak: closet.streak,
      visits: closet.visits,
      claimed: Object.fromEntries((achievements || []).map(a => [a.achievement_id, true])),
      owned: Object.fromEntries((purchases || []).map(p => [p.item_id, true])),
      isAdmin: isAdminEmail(user.email),
      ...equippedSkins(purchases),
    });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
