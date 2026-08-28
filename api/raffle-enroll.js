const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');
const { COST_PER_ENTRY, currentMonth } = require('./_lib/raffle');

// POST /api/raffle-enroll - spends COST_PER_ENTRY rocks for one more entry
// into this month's raffle. Deliberately allows multiple entries per user
// per month (no dedupe) - each paid entry is one more chance to win.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();
    const month = currentMonth();

    const { data: balanceRow } = await supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle();
    const tokens = balanceRow ? balanceRow.tokens : 0;
    if (tokens < COST_PER_ENTRY) return res.status(400).json({ error: 'Not enough moon rocks' });

    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: -COST_PER_ENTRY, reason: `raffle_enroll:${month}` });
    await supabase.from('raffle_entries').insert({ user_id: user.id, month });

    const { count: myEntries } = await supabase.from('raffle_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('month', month);
    res.status(200).json({ ok: true, tokens: tokens - COST_PER_ENTRY, myEntries: myEntries || 0 });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
