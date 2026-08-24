const { requireUser, isAdminEmail, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');

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
      supabase.from('shop_purchases').select('item_id').eq('user_id', user.id),
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
    });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
