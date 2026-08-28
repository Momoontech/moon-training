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

// Ensures a users row + closet_state row exist for this Auth0 identity.
// Deliberately does NOT bump streak/visits or grant anything - just logging
// in doesn't advance the closet anymore. That only happens by actually
// finishing the Daily Challenge (see api/daily-challenge-complete.js),
// per Mo's call: the day doesn't count until you've done the work.
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
    return user;
  }
  return user;
}

module.exports = { db, getOrCreateUser };
