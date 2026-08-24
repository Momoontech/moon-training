const { createClient } = require('@supabase/supabase-js');

let client;
function db() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// Ensures a users row + closet_state row exist for this Auth0 identity, and
// bumps the daily streak/visit counters exactly once per calendar day - the
// server-side equivalent of the old loadS()/saveS() localStorage logic in
// index.html.
async function getOrCreateUser({ sub, email, name }) {
  const supabase = db();
  let { data: user } = await supabase.from('users').select('*').eq('auth0_sub', sub).maybeSingle();

  if (!user) {
    const { data: created, error } = await supabase
      .from('users')
      .insert({ auth0_sub: sub, email, name })
      .select('*')
      .single();
    if (error) throw error;
    user = created;
    await supabase.from('closet_state').insert({ user_id: user.id });
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 1, reason: 'daily_login' });
    return user;
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: closet } = await supabase.from('closet_state').select('*').eq('user_id', user.id).single();
  if (closet.last_visit !== today) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const streak = closet.last_visit === yesterday ? closet.streak + 1 : 1;
    await supabase.from('closet_state')
      .update({ streak, visits: closet.visits + 1, last_visit: today })
      .eq('user_id', user.id);
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 1, reason: 'daily_login' });
  }
  return user;
}

module.exports = { db, getOrCreateUser };
