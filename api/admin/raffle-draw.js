const { requireAdmin, AuthError } = require('../_lib/auth');
const { db } = require('../_lib/db');
const { currentMonth } = require('../_lib/raffle');

// POST /api/admin/raffle-draw - admin-only. Picks one random entry from
// this month's raffle_entries as the winner and records it permanently in
// raffle_winners. If this month's winner was already drawn, returns that
// existing winner instead of drawing again - drawing a real winner is a
// one-time, real action, not something to accidentally repeat.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await requireAdmin(req);
    const supabase = db();
    const month = currentMonth();

    const { data: existing } = await supabase.from('raffle_winners').select('*, users(name, email)').eq('month', month).maybeSingle();
    if (existing) return res.status(200).json({ alreadyDrawn: true, winner: existing });

    const { data: entries, error } = await supabase.from('raffle_entries').select('id, user_id').eq('month', month);
    if (error) throw error;
    if (!entries || !entries.length) return res.status(400).json({ error: 'No entries this month' });

    const winner = entries[Math.floor(Math.random() * entries.length)];
    const { data: inserted, error: insErr } = await supabase.from('raffle_winners')
      .insert({ month, entry_id: winner.id, user_id: winner.user_id })
      .select('*, users(name, email)').single();
    if (insErr) throw insErr;

    res.status(200).json({ alreadyDrawn: false, winner: inserted });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
