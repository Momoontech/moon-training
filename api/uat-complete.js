const { db } = require('./_lib/db');

// GET /api/uat-complete?uid=<user id>&testId=<lyssna test id>
//
// Lyssna redirects here after a self-recruited usability test finishes,
// with `uid` passed through as a custom variable on the recruitment link
// (Lyssna forwards recruitment-link custom variables to the redirect URL
// as query params - see the integration note in the project chat/CLAUDE.md).
//
// Not Auth0-protected: Lyssna has no way to attach our bearer token, so this
// trusts whatever uid was baked into the link when it was generated for that
// tester. Fine for a handful of known pilot testers; would need a signed/
// single-use token instead of a raw uid if this ever goes public.
module.exports = async (req, res) => {
  const { uid, testId } = req.query;
  if (!uid) return res.status(400).send('Missing uid');
  try {
    const supabase = db();
    const { data: user } = await supabase.from('users').select('id').eq('id', uid).maybeSingle();
    if (!user) return res.status(404).send('Unknown user');

    await supabase.from('uat_completions').insert({ user_id: user.id, lyssna_test_id: testId || null });
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 10, reason: 'uat_completion' });

    res.redirect(302, '/uat-thanks.html');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal error');
  }
};
