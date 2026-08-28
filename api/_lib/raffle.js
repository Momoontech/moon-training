// Monthly raffle config - single source of truth for the entry cost and
// prize text, so /api/raffle and /api/raffle-enroll can't drift apart.
// PRIZE_TEXT is a placeholder until Mo finalizes what's actually being
// given away - update it here once that's decided.
const COST_PER_ENTRY = 100;
const PRIZE_TEXT = 'Prize to be announced';

// 'YYYY-MM' - the raffle period key used everywhere entries are read/written.
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

module.exports = { COST_PER_ENTRY, PRIZE_TEXT, currentMonth };
