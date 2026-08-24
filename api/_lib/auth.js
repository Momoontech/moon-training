const { createRemoteJWKSet, jwtVerify } = require('jose');

class AuthError extends Error {}

let jwks;
function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

// Verifies the Auth0 ID token the SPA attaches as `Authorization: Bearer <token>`.
// ID tokens (not access tokens) are enough here - we only need to know who's
// logged in, not authorize scoped API calls, so there's no separate Auth0
// "API"/audience to configure.
async function requireUser(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AuthError('Missing bearer token');

  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_CLIENT_ID,
  });
  if (!payload.sub || !payload.email) throw new AuthError('Token missing sub/email');
  return { sub: payload.sub, email: payload.email, name: payload.name || payload.email };
}

// ADMIN_EMAILS is a comma-separated allowlist (Vercel env var) - deliberately
// not a DB column, since this is a temporary pilot-testing tool, not a real
// role system.
function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return list.includes((email || '').toLowerCase());
}

async function requireAdmin(req) {
  const identity = await requireUser(req);
  if (!isAdminEmail(identity.email)) throw new AuthError('Admin only');
  return identity;
}

module.exports = { requireUser, requireAdmin, isAdminEmail, AuthError };
