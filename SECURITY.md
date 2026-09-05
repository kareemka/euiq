# Security checklist

Before production:
- [ ] Use HTTPS only.
- [ ] Set HSTS at CDN/reverse proxy.
- [ ] Replace all example passwords/secrets.
- [ ] Restrict PostgreSQL network access.
- [ ] Enable automated PostgreSQL backups and restore testing.
- [ ] Use a least-privilege DB user.
- [ ] Replace in-memory rate limiter with a shared Redis-backed limiter if running multiple instances.
- [ ] Configure monitoring and centralized logs.
- [ ] Add admin MFA if the dashboard controls valuable auctions.
- [ ] Rotate admin credentials and session secrets using a planned process.
- [ ] Run dependency/security scanning in CI.
- [ ] Test authorization for every admin endpoint.
- [ ] Review CSP before adding analytics/CDNs.
- [ ] Keep Next.js on a supported patched LTS release.
- [ ] Ensure APP_ORIGIN exactly matches the production HTTPS origin.
- [ ] Do not expose `.env` or database ports publicly.

Design notes:
- Admin passwords use Argon2id.
- Session tokens are random opaque values; only SHA-256 hashes are stored in PostgreSQL.
- Session cookies are HttpOnly and SameSite=Lax; Secure is enabled in production.
- Mutating routes enforce same-origin requests.
- Bid price mutation is server-side and transactionally serialized.
- Input validation uses Zod.
