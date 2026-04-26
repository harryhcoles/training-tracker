# Training Tracker

A personal, single-user crit-cycling and strength log. Next.js 16 + Prisma + Neon Postgres, deployed to Vercel.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

`.env` needs:

```
DATABASE_URL="postgresql://..."
```

Run migrations + seed once after cloning:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Strava Sync (Optional)

To enable Strava sync, do this once:

1. Go to https://www.strava.com/settings/api
2. Create an application (Authorization Callback Domain: `localhost`)
3. Note **Client ID** and **Client Secret**
4. Visit (replace `CLIENT_ID`):
   ```
   http://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read_all,activity:read_all
   ```
5. Click Authorize → you'll be redirected to a broken `localhost` page → copy the `code=...` from the URL
6. Exchange the code for tokens:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -F client_id=YOUR_CLIENT_ID \
     -F client_secret=YOUR_CLIENT_SECRET \
     -F code=YOUR_CODE \
     -F grant_type=authorization_code
   ```
7. From the response, save `refresh_token`. **It does not expire.**
8. Add three env vars on Vercel (and in local `.env` for testing):
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REFRESH_TOKEN`
9. Redeploy. Click **Sync from Strava** in Settings.

The sync pulls rides from the most-recently-synced activity onwards (or 14 days back if none yet), only imports `Ride` and `VirtualRide` types, and never duplicates an already-imported activity.

## Deploy

Push to GitHub. Vercel imports the repo. Add `DATABASE_URL` (and optionally the Strava vars) as environment variables. Vercel auto-builds and deploys on every push to `main`.
