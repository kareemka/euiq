# Deployment

## Managed platform
1. Provision PostgreSQL.
2. Set environment variables from `.env.example`.
3. Run `npm ci`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Seed/create the first admin in a trusted deployment shell.
7. Build with `npm run build`.
8. Serve with `npm start`.
9. Attach a TLS-enabled domain.
10. Set `APP_ORIGIN` to that exact HTTPS origin.

## First admin
Either set ADMIN_EMAIL / ADMIN_PASSWORD and run:
`npm run db:seed`

Or:
`npm run admin:create -- admin@example.com 'a-long-random-password'`

Never commit the real password or `.env`.
