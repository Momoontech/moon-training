// GET /api/config - hands the frontend the two Auth0 values it needs to
// initialize login. These are public identifiers (not secrets - Auth0
// Domain/Client ID are meant to be visible in client-side code), served
// from env vars so index.html never hardcodes them and there's one source
// of truth in Vercel.
module.exports = (req, res) => {
  res.status(200).json({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
  });
};
