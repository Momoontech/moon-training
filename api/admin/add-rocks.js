const { requireAdmin, AuthError } = require('../_lib/auth');
const { db, getOrCreateUser } = require('../_lib/db');

// POST /api/admin/add-rocks { amount } - admin-only. amount can be negative
// (the old dev "+10 rocks" / "-10 rocks" buttons, combined into one).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireAdmin(req);
    const user = await getOrCreateUser(identity);
    const { amount } = req.body || {};
    if (!Number.isInteger(amount) || amount === 0) {
      return res.status(400).json({ error: 'amount must be a non-zero integer' });
    }

    const supabase = db();
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount, reason: 'admin_adjustment' });

    res.status(200).json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
