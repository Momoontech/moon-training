const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');

// Mirrors the SHOP[] prices in index.html - keep these two lists in sync
// until there's a single shared source (see CLAUDE.md's "no shared code"
// note - the same caveat applies here).
const SHOP_PRICES = {
  levelup: 15, accessory: 25, coffee: 35, walkin: 40,
  lunch: 50, tee: 60, giftcard: 90, mini: 120,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const { itemId } = req.body || {};
    const price = SHOP_PRICES[itemId];
    if (!price) return res.status(400).json({ error: 'Unknown itemId' });

    const supabase = db();
    const { data: balanceRow } = await supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle();
    const tokens = balanceRow ? balanceRow.tokens : 0;
    if (tokens < price) return res.status(400).json({ error: 'Not enough moon rocks' });

    if (itemId === 'levelup') {
      const { data: closet } = await supabase.from('closet_state').select('visits').eq('user_id', user.id).single();
      await supabase.from('closet_state').update({ visits: closet.visits + 1 }).eq('user_id', user.id);
    } else {
      const { error: dupeError } = await supabase.from('shop_purchases').insert({ user_id: user.id, item_id: itemId });
      if (dupeError) {
        if (dupeError.code === '23505') return res.status(400).json({ error: 'Already owned' });
        throw dupeError;
      }
    }

    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: -price, reason: `shop_purchase:${itemId}` });
    res.status(200).json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
