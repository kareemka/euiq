# Secure Iraq Auction — Next.js + PostgreSQL

Full-stack auction MVP with:
- Next.js 16.3.3 / React 19
- PostgreSQL
- Prisma
- Argon2id admin password hashing
- Opaque server-side sessions stored hashed in PostgreSQL
- HttpOnly + Secure-in-production + SameSite cookies
- Origin/Sec-Fetch-Site CSRF checks on all mutating routes
- Protected admin page and protected admin APIs
- Quick auction-user registration by name + phone
- Serializable transaction + PostgreSQL row lock for bids
- Basic rate limiting
- Security headers
- Docker/PostgreSQL config

## 1) Setup

Requirements: Node.js 20.9+ (Node 22 recommended), Docker or PostgreSQL.

```bash
cp .env.example .env
# CHANGE database password, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open:
- Auction registration: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Production

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Put the app behind HTTPS/TLS (Vercel, Cloudflare, nginx, Caddy, or a managed platform). Set:
- `APP_ORIGIN=https://your-real-domain.example`
- a high-entropy `SESSION_SECRET`
- production PostgreSQL `DATABASE_URL`
- strong admin credentials

### Reverse proxy
Forward `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For`. Force HTTPS and HSTS at the edge/proxy.

## Important production hardening

The included in-memory rate limiter is suitable for one Node process. For horizontally scaled deployment replace it with Redis/Upstash or an equivalent shared limiter.

The auction-user login intentionally has no phone verification because that is the requested product behavior. This means phone ownership is **not authenticated**; do not treat the phone number as verified identity. For higher trust, add OTP later.

The dashboard checks authorization both at the page/server layer and on every admin API. The proxy cookie check is only an early redirect optimization; it is not the authorization boundary.

## CSRF
State-changing JSON endpoints require same-origin requests via `Origin` and `Sec-Fetch-Site`, while session cookies are `SameSite=Lax`. If you later add cross-origin clients, redesign this boundary and use explicit CSRF tokens.

## Bid integrity
`POST /api/public/bid` uses a PostgreSQL `FOR UPDATE` row lock inside a Serializable Prisma transaction. This prevents two concurrent requests from independently calculating the same next price.

## Files
- `prisma/schema.prisma`: database
- `lib/security.ts`: sessions + CSRF boundary
- `app/api/public/*`: public auction APIs
- `app/api/admin/*`: protected admin APIs
- `app/admin`: protected dashboard
- `SECURITY.md`: deployment/security checklist
