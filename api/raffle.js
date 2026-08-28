const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');
const { COST_PER_ENTRY, PRIZE_TEXT, currentMonth } = require('./_lib/raffle');

// GET /api/raffle - this month's raffle status: the cost/prize, how many
// entries the current user already bought this month, and the total entry
// count across everyone (so people can see how big the pool is).
module.exports = async (req, res) => {
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();
    const month = currentMonth();

    const [{ data: balanceRow }, { count: myEntries }, { count: totalEntries }] = await Promise.all([
      supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle(),
      supabase.from('raffle_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('month', month),
      supabase.from('raffle_entries').select('id', { count: 'exact', head: true }).eq('month', month),
    ]);

    res.status(200).json({
      month,
      cost: COST_PER_ENTRY,
      prize: PRIZE_TEXT,
      tokens: balanceRow ? balanceRow.tokens : 0,
      myEntries: myEntries || 0,
      totalEntries: totalEntries || 0,
    });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
