# CampusOps — Cloud Deployment Guide

This document walks through deploying CampusOps to the cloud. The architecture
is split into three managed pieces:

```
  Vercel/Netlify  ──►  Render/Railway  ──►  Supabase/Neon (Postgres)
  (frontend)            (backend API)        (managed DB)
```

Pick **one** option per layer — they are interchangeable.

---

## 1. Provision the database

### Option A — Supabase (recommended for free tier)

1. Create a project at https://supabase.com
2. Project Settings → **Database** → copy the **Connection string** (URI).
3. The format is `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require`.
4. Save this as `DATABASE_URL` for the next step.

### Option B — Neon

1. Create a project at https://neon.tech
2. Copy the **Pooled connection** string from the dashboard.
3. Save as `DATABASE_URL`.

---

## 2. Deploy the API

### Option A — Render Blueprint (one-click)

The repo ships with [`render.yaml`](./render.yaml).

1. Push the repo to GitHub.
2. Go to https://dashboard.render.com → **New** → **Blueprint** → connect repo.
3. Render reads `render.yaml` and provisions:
   - `campusops-api` web service (Docker)
   - `campusops-db` managed Postgres
   - `campusops-redis` Redis instance
4. After creation, open `campusops-api` → **Environment** and fill the secrets
   marked `sync: false` (`SMTP_*`, `CORS_ORIGIN`, `APP_URL`, etc.).
5. Render auto-deploys on every push to `main`.
6. Open the service URL — `/health` should return `{ "status": "healthy" }`.

> If you'd rather use **Supabase/Neon** instead of Render's Postgres, delete
> the `databases:` block in `render.yaml` and set `DATABASE_URL` manually
> in the env vars.

### Option B — Railway

1. Push the repo to GitHub.
2. https://railway.app → **New Project** → **Deploy from GitHub repo**.
3. Set the **root directory** to `backend/` in service settings.
4. Add a Postgres plugin from the Railway marketplace OR set `DATABASE_URL`
   to your Supabase/Neon URL.
5. Add the env vars from [`backend/.env.production.example`](./backend/.env.production.example).
6. The repo's [`railway.json`](./railway.json) configures Docker build + health check.

### Option C — Plain Docker

```bash
cd backend
docker build -t campusops-api .
docker run -d -p 3000:3000 --env-file .env.production campusops-api
```

The container runs `prisma migrate deploy` on start, so the schema is always
up to date.

---

## 3. Run the seed (once, after first deploy)

`prisma migrate deploy` applies the schema but does **not** insert seed data.
Run the seed once from a shell inside the deployed container or locally
against the production DB.

```bash
# From your laptop, pointing at the prod DB:
DATABASE_URL="postgresql://..." npm --prefix backend run db:seed
```

This creates:
- 1 branch (EIDIA)
- 4 demo accounts (`admin/scolarite/prof/student @campusops.ma`)
- 5 real EIDIA accounts from `roles.xlsx` (password: `CampusOps@2026`)
- 5 field teachers + 80 students + 10 groups + ~145 modules
- Realistic planning, absences, payments, progress, notifications

---

## 4. Deploy the frontend

The frontend lives in [`CompusOS_Frontend/`](./CompusOS_Frontend/) and is a
static-ish JSX app. Either:

### Vercel

1. https://vercel.com → **New Project** → import the GitHub repo.
2. **Root directory**: `CompusOS_Frontend`.
3. **Framework preset**: Other (it's a hand-rolled JSX setup).
4. Add env var `VITE_API_URL=https://campusops-api.onrender.com` (or your
   API URL).
5. Deploy.

### Netlify

1. https://app.netlify.com → **Add new site** → **Import from Git**.
2. **Base directory**: `CompusOS_Frontend`.
3. Same env var as above.

After the frontend deploys, **come back to the API** and set:
- `CORS_ORIGIN` = the frontend URL (`https://campusops.vercel.app`)
- `APP_URL` = same URL (used in email links)

Redeploy the API to pick the new values up.

---

## 5. Configure integrations (optional)

| Integration | Env vars to set | Notes |
|---|---|---|
| SMTP (outbound mail) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Gmail requires an **App Password**, not your login. |
| IMAP (inbox reading) | `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` | Falls back to `SMTP_*` if omitted. Powers `GET /api/mail/latest`. |
| Telegram bot | `TELEGRAM_BOT_TOKEN` | Get via [@BotFather](https://t.me/BotFather). |
| OpenClaw webhooks | `OPENCLAW_WEBHOOK_SECRET` | Shared HMAC key. Configure OpenClaw to sign `POST /api/openclaw/webhook` with the same secret. |

After updating env vars in the hosting dashboard, **redeploy** so the new
process picks them up.

---

## 6. Verify the deployment

| Endpoint | Expected |
|---|---|
| `GET /health` | `{ "status": "healthy" }` |
| `GET /api` | Welcome JSON listing all modules |
| `GET /api/docs` | Swagger UI |
| `POST /api/auth/login` (with seeded creds) | `{ accessToken, refreshToken, user }` |
| `POST /api/openclaw/trigger/daily-planning` (admin token) | `{ teachersNotified, studentsNotified, ... }` |

Watch logs in the hosting dashboard for:
- `🐘 PostgreSQL connected`
- `⏰ Daily planning cron scheduled: "0 7 * * *" (Africa/Casablanca)`
- `📧 SMTP transport ready` (if SMTP is configured)

---

## 7. Demo recording checklist

1. Hit `/health` from a browser — show the live cloud URL.
2. Log in via the frontend with `admin@campusops.ma / Admin123!`.
3. Visit Planning → Today.
4. From admin → Notifications → broadcast to `all_students` via Email + Telegram + in-app.
5. Open Swagger at `/api/docs` and exercise one endpoint.
6. From a terminal:
   ```bash
   curl -X POST https://campusops-api.../api/openclaw/trigger/daily-planning \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```
   Show the `{ teachersNotified, studentsNotified, emailsSent, telegramSent }` summary.
7. Show the Render/Railway dashboard with Postgres + Redis + API + cron all green.

---

## Troubleshooting

**"P1001: Can't reach database server"** — your `DATABASE_URL` is wrong or the
DB doesn't allow connections from your hosting provider. Supabase/Neon are
open by default; Render's managed Postgres requires the **Internal Database URL**.

**Migrations stuck / drift** — run `npx prisma migrate resolve --rolled-back <name>`
locally with the prod `DATABASE_URL`, fix, redeploy.

**CORS errors in the frontend** — verify `CORS_ORIGIN` on the API matches the
**exact** frontend URL, scheme and all. No trailing slash.

**Cron never fires** — confirm `CRON_DAILY_PLANNING=on` and check logs at the
scheduled time. Render's free plan can spin the instance down; upgrade to
Starter or run the cron via OpenClaw instead (`POST /api/openclaw/webhook`
with `{ "event": "planning.daily.trigger" }`).
