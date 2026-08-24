const { requireAdmin, AuthError } = require('../_lib/auth');
const { db, getOrCreateUser } = require('../_lib/db');

// POST /api/admin/simulate-day - admin-only. Bumps visits/streak by one and
// credits a rock, same as the old client-side "Simulate next day" dev
// button, but for testing the real server-backed closet/streak logic
// without waiting on actual calendar days.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireAdmin(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();

    const { data: closet, error: readError } = await supabase.from('closet_state').select('*').eq('user_id', user.id).single();
    if (readError) throw readError;

    await supabase.from('closet_state')
      .update({ visits: closet.visits + 1, streak: closet.streak + 1 })
      .eq('user_id', user.id);
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 1, reason: 'admin_simulate_day' });

    res.status(200).json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
