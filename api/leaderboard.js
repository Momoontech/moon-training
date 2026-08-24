const { requireUser, AuthError } = require('./_lib/auth');
const { db } = require('./_lib/db');

// Threshold badges computed live from real data - no separate "badges
// earned" table, since these are all just >= checks against numbers we
// already track. Checked highest-first so someone past 50 days doesn't also
// show the 7-day badge.
const STREAK_BADGES = [
  { min: 50, label: '50-Day Streak' },
  { min: 30, label: '30-Day Streak' },
  { min: 7, label: '7-Day Streak' },
];
const ROCK_BADGES = [
  { min: 500, label: '500 Rocks Club' },
  { min: 100, label: '100 Rocks Club' },
];

function badgesFor(row) {
  const badges = [];
  const streakBadge = STREAK_BADGES.find(b => row.streak >= b.min);
  if (streakBadge) badges.push(streakBadge.label);
  const rockBadge = ROCK_BADGES.find(b => row.lifetime_earned >= b.min);
  if (rockBadge) badges.push(rockBadge.label);
  return badges;
}

// GET /api/leaderboard - real cross-device leaderboard, replacing the old
// hardcoded PEOPLE[] mock array (and the retired "Everyone's work" table -
// this is now the single ranking). Any logged-in designer can see everyone's
// rocks, but you must be logged in to ask.
// Reads from the flat `leaderboard` view (see schema.sql) rather than
// joining through user_balances directly, since PostgREST can't embed
// relationships through a view that has no foreign-key metadata.
module.exports = async (req, res) => {
  try {
    await requireUser(req);
    const supabase = db();
    const { data, error } = await supabase
      .from('leaderboard')
      .select('name, email, tokens, streak, lifetime_earned')
      .order('tokens', { ascending: false })
      .limit(50);
    if (error) throw error;

    res.status(200).json(data.map(r => ({
      name: r.name || r.email,
      email: r.email,
      tokens: r.tokens,
      badges: badgesFor(r),
    })));
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
