const { requireAdmin, AuthError } = require('../_lib/auth');
const { db, getOrCreateUser } = require('../_lib/db');

// POST /api/admin/reset - admin-only. Wipes this admin's own rocks/streak/
// achievements/purchases back to a fresh day-1 state, for re-testing the
// whole flow from scratch. Only ever touches the calling admin's own row -
// there's no target-user param, so it can't be used to reset someone else.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireAdmin(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();

    await Promise.all([
      supabase.from('moon_rock_events').delete().eq('user_id', user.id),
      supabase.from('achievements').delete().eq('user_id', user.id),
      supabase.from('shop_purchases').delete().eq('user_id', user.id),
      supabase.from('uat_completions').delete().eq('user_id', user.id),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('closet_state').update({ streak: 1, visits: 1, last_visit: today }).eq('user_id', user.id);
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 1, reason: 'daily_login' });

    res.status(200).json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
