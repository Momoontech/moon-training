const { requireUser, AuthError } = require('./_lib/auth');
const { db } = require('./_lib/db');

// GET /api/leaderboard - real cross-device leaderboard, replacing the
// hardcoded PEOPLE[] mock array. Any logged-in designer can see everyone's
// rocks (same as the current mock table), but you must be logged in to ask.
// Reads from the flat `leaderboard` view (see schema.sql) rather than
// joining through user_balances directly, since PostgREST can't embed
// relationships through a view that has no foreign-key metadata.
module.exports = async (req, res) => {
  try {
    await requireUser(req);
    const supabase = db();
    const { data, error } = await supabase
      .from('leaderboard')
      .select('name, email, tokens, streak')
      .order('tokens', { ascending: false })
      .limit(50);
    if (error) throw error;

    res.status(200).json(data.map(r => ({ name: r.name || r.email, email: r.email, tokens: r.tokens, streak: r.streak })));
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
