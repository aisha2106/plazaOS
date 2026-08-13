# Local testing credentials

Local dev/testing reference. Real secret values are never stored here — see
`backend/.env` (gitignored) for actual values, or generate fresh ones with the
scripts below.

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

## Admin login
- Email: value of `ADMIN_EMAIL` in `backend/.env`
- Password: value of `ADMIN_PASSWORD` in `backend/.env`
- (Re)create via: `cd backend && npm run bootstrap:admin`

## Tenant logins (seeded)
- Emails: jane.cooper@example.com, devon.lane@example.com, wade.warren@example.com, esther.howard@example.com, cameron.williamson@example.com, guy.hawkins@example.com (units A-101, A-102, B-201, B-204, C-301, C-310 respectively)
- Password: printed to the console each time you run `cd backend && npm run seed` (dev-only, refuses to run when `NODE_ENV=production`, generates a fresh random password every run)

## Cron endpoint (manual trigger)
```
CRON_SECRET=$(grep CRON_SECRET backend/.env | cut -d= -f2)
curl -X POST http://localhost:4000/api/cron/process-reminders -H "Authorization: Bearer $CRON_SECRET"
```

## Smoke-test scripts
- `cd backend && npm run test:email -- you@example.com` — sends a real email via Resend.
- `cd backend && npm run test:cloudinary` — pings Cloudinary and uploads/deletes a test image.

