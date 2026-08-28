const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');

const DAILY_CHALLENGE_AMOUNT = 5;

// POST /api/daily-challenge-complete - called once the Daily Challenge
// (running in the dashboard's iframe overlay) reports all its tasks
// finished via postMessage. This is the one place that grants the day's
// moon rocks AND advances closet_state's streak/visits - logging in no
// longer does either (see _lib/db.js) - so the closet only moves forward
// once the challenge is actually done, not just opened.
// Idempotent per calendar day via the achievements table (`puzzle-<date>`),
// same pattern as /api/earn - replaying this after already claiming today
// is a safe no-op that just returns the current state.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();
    const today = new Date().toISOString().slice(0, 10);
    const eid = 'puzzle-' + today;

    const { error: claimError } = await supabase.from('achievements').insert({ user_id: user.id, achievement_id: eid });
    if (claimError && claimError.code !== '23505') throw claimError; // 23505 = already claimed today
    const alreadyClaimedToday = !!claimError;

    if (!alreadyClaimedToday) {
      await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: DAILY_CHALLENGE_AMOUNT, reason: eid });

      const { data: closet } = await supabase.from('closet_state').select('*').eq('user_id', user.id).single();
      if (closet.last_visit !== today) {
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        const streak = closet.last_visit === yesterday ? closet.streak + 1 : 1;
        await supabase.from('closet_state')
          .update({ streak, visits: closet.visits + 1, last_visit: today })
          .eq('user_id', user.id);
      }
    }

    const [{ data: balanceRow }, { data: closetNow }] = await Promise.all([
      supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle(),
      supabase.from('closet_state').select('*').eq('user_id', user.id).single(),
    ]);
    res.status(200).json({
      alreadyClaimedToday,
      tokens: balanceRow ? balanceRow.tokens : 0,
      streak: closetNow.streak,
      visits: closetNow.visits,
    });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
