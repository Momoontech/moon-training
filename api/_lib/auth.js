const { createRemoteJWKSet, jwtVerify } = require('jose');

class AuthError extends Error {}

let jwks;
function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

// ADMIN_EMAILS / ALLOWED_EMAILS are comma-separated allowlists (Vercel env
// vars) - deliberately not DB columns, since this is a pilot cohort of a
// handful of known people, not a real role/invite system. Admins are always
// implicitly allowed, so adding yourself to ADMIN_EMAILS can never lock you
// out even if you forget to also add yourself to ALLOWED_EMAILS.
function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return list.includes((email || '').toLowerCase());
}
function isAllowedEmail(email) {
  if (isAdminEmail(email)) return true;
  const list = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return list.includes((email || '').toLowerCase());
}

// Verifies the Auth0 ID token the SPA attaches as `Authorization: Bearer <token>`,
// then checks the email against the pilot allowlist - this runs on every
// authenticated request, not just first login, so pulling someone off the
// allowlist actually revokes their access rather than just blocking signup.
async function requireUser(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AuthError('Missing bearer token');

  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_CLIENT_ID,
  });
  if (!payload.sub || !payload.email) throw new AuthError('Token missing sub/email');
  if (!isAllowedEmail(payload.email)) throw new AuthError("This app is invite-only - your email isn't on the list yet. Contact your admin for access.");
  return { sub: payload.sub, email: payload.email, name: payload.name || payload.email };
}

async function requireAdmin(req) {
  const identity = await requireUser(req);
  if (!isAdminEmail(identity.email)) throw new AuthError('Admin only');
  return identity;
}

module.exports = { requireUser, requireAdmin, isAdminEmail, isAllowedEmail, AuthError };
