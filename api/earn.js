const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');

// POST /api/earn { eid, amount } - replaces the client-side earn() function.
// Idempotent per eid via the achievements table's primary key, so a replayed
// or double-clicked request can't double-credit rocks.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const { eid, amount } = req.body || {};
    if (!eid || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'eid and a positive amount are required' });
    }

    const supabase = db();
    const { error: claimError } = await supabase.from('achievements').insert({ user_id: user.id, achievement_id: eid });
    if (claimError) {
      if (claimError.code !== '23505') throw claimError; // 23505 = unique_violation, i.e. already claimed
      return res.status(200).json({ alreadyClaimed: true });
    }

    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount, reason: eid });
    res.status(200).json({ alreadyClaimed: false, amount });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
