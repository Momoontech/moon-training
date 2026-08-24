const { db } = require('./_lib/db');

// GET /api/uat-complete?email=<designer's email>&testId=<lyssna test id>
//
// Lyssna redirects here after a self-recruited usability test finishes, with
// `email` passed through as a custom variable on the recruitment link
// (Lyssna forwards recruitment-link custom variables to the redirect URL as
// a query string - see the Lyssna setup notes for how to configure this).
// Keyed by email rather than the internal user id so whoever sends out the
// per-tester recruitment links can just use the email addresses they
// already know, no need to look anything up in Supabase.
//
// Requires the designer to have logged into the training site at least once
// already (so their users row exists) - if they haven't, this 404s instead
// of silently creating a rocks-only ghost account.
//
// Not Auth0-protected: Lyssna has no way to attach our bearer token, so this
// trusts whatever email was baked into the link when it was generated for
// that tester. Fine for a handful of known pilot testers; would need a
// signed/single-use token instead of a raw email if this ever goes public.
module.exports = async (req, res) => {
  const { email, testId } = req.query;
  if (!email) return res.status(400).send('Missing email');
  try {
    const supabase = db();
    const { data: user } = await supabase.from('users').select('id').ilike('email', String(email)).maybeSingle();
    if (!user) return res.status(404).send("Unknown user - they need to log into the training site at least once first, then try this link again.");

    await supabase.from('uat_completions').insert({ user_id: user.id, lyssna_test_id: testId || null });
    await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: 10, reason: 'uat_completion' });

    res.redirect(302, '/uat-thanks.html');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal error');
  }
};
