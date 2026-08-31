const { requireAdmin, AuthError } = require('../_lib/auth');
const { db, getOrCreateUser } = require('../_lib/db');
const { currentMonth } = require('../_lib/raffle');

// POST /api/admin/actions { action, ...params } - admin-only. Combines what
// used to be 4 separate admin-only files (add-rocks, reset, simulate-day,
// raffle-draw) into one, since Vercel's Hobby plan caps a deployment at 12
// serverless functions - none of these are called from the UI anymore (the
// old dev buttons were removed), so one dispatched endpoint costs nothing
// in practice and buys back 3 functions of headroom.
async function addRocks(user, supabase, { amount }) {
  if (!Number.isInteger(amount) || amount === 0) throw Object.assign(new Error('amount must be a non-zero integer'), { status: 400 });
  await supabase.from('moon_rock_events').insert({ user_id: user.id, amount, reason: 'admin_adjustment' });
  return { ok: true };
}

async function reset(user, supabase) {
  await Promise.all([
    supabase.from('moon_rock_events').delete().eq('user_id', user.id),
    supabase.from('achievements').delete().eq('user_id', user.id),
    supabase.from('shop_purchases').delete().eq('user_id', user.id),
    supabase.from('uat_completions').delete().eq('user_id', user.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from('closet_state').update({ streak: 1, visits: 1, last_visit: today }).eq('user_id', user.id);
  return { ok: true };
}

async function simulateDay(user, supabase) {
  const { data: closet, error: readError } = await supabase.from('closet_state').select('*').eq('user_id', user.id).single();
  if (readError) throw readError;
  await supabase.from('closet_state').update({ visits: closet.visits + 1, streak: closet.streak + 1 }).eq('user_id', user.id);
  await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 1, reason: 'admin_simulate_day' });
  return { ok: true };
}

async function raffleDraw(user, supabase) {
  const month = currentMonth();
  const { data: existing } = await supabase.from('raffle_winners').select('*, users(name, email)').eq('month', month).maybeSingle();
  if (existing) return { alreadyDrawn: true, winner: existing };

  const { data: entries, error } = await supabase.from('raffle_entries').select('id, user_id').eq('month', month);
  if (error) throw error;
  if (!entries || !entries.length) throw Object.assign(new Error('No entries this month'), { status: 400 });

  const winner = entries[Math.floor(Math.random() * entries.length)];
  const { data: inserted, error: insErr } = await supabase.from('raffle_winners')
    .insert({ month, entry_id: winner.id, user_id: winner.user_id })
    .select('*, users(name, email)').single();
  if (insErr) throw insErr;
  return { alreadyDrawn: false, winner: inserted };
}

const ACTIONS = { 'add-rocks': addRocks, reset, 'simulate-day': simulateDay, 'raffle-draw': raffleDraw };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireAdmin(req);
    const user = await getOrCreateUser(identity);
    const supabase = db();
    const { action, ...params } = req.body || {};
    const handler = ACTIONS[action];
    if (!handler) return res.status(400).json({ error: 'Unknown action' });

    const result = await handler(user, supabase, params);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
