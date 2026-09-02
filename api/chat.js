const Anthropic = require('@anthropic-ai/sdk');
const KNOWLEDGE = require('./_lib/chat-knowledge');

// POST /api/chat { message, history? } - the Help widget's AI chat.
// Deliberately unauthenticated (unlike earn/state/shop-buy): it only reads
// a fixed knowledge base and never touches user data or moon rocks, so it
// doesn't need to depend on the Auth0/session plumbing other endpoints use.
let client;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY_TURNS = 6; // most recent user+assistant pairs kept for context

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return res.status(400).json({ error: 'message is too long' });
  }

  const trimmedHistory = Array.isArray(history)
    ? history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_HISTORY_TURNS * 2)
    : [];

  try {
    const response = await getClient().messages.create({
      model: 'claude-opus-5',
      max_tokens: 500,
      system: KNOWLEDGE,
      output_config: { effort: 'low' },
      messages: [...trimmedHistory, { role: 'user', content: message }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    res.status(200).json({ reply: textBlock ? textBlock.text : "I'm not sure how to answer that - try Support instead." });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'The chat is getting a lot of questions right now - try again in a moment.' });
    }
    if (e instanceof Anthropic.APIError) {
      console.error('Anthropic API error:', e.status, e.message);
      return res.status(502).json({ error: "Chat isn't available right now - try Support instead." });
    }
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
