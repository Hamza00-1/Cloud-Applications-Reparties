# CampusOps — What We've Done So Far

A complete breakdown of everything built in Phases 1–8 and **why each piece matters** for the final project.

---

## 🏗️ Phase 1 — Scaffolding (The Foundation) ✅

| What we built | Why it matters |
|---|---|
| **Express + TypeScript** server | TypeScript catches bugs *before* they reach production. Professional-grade code, not messy JavaScript. |
| **Docker Compose** (PostgreSQL + Redis) | Any teammate runs `docker compose up` and gets the *exact same* database. No more "it works on my machine" problems. This is the **core concept of our Distributed Apps course**. |
| **Zod-validated environment** (`env.ts`) | If someone forgets a config variable, the server crashes *immediately* with a clear error instead of failing randomly 2 hours later. |
| **Winston structured logging** | Every request is logged with timestamp, status code, and duration. When something breaks, you can trace exactly what happened. |
| **Centralized error handler** | Every error in the entire app returns the same JSON format. The frontend always knows what to expect. |
| **Graceful shutdown** | When the server stops, it closes DB connections cleanly — no data corruption. |

---

## 🗄️ Phase 2 — Database & Models ✅

| What we built | Why it matters |
|---|---|
| **10 Prisma models** | These are the *real database tables*: Branches, Users, Modules, Groups, Planning, Absences, Progress, Payments, Notifications. Every feature in CampusOps reads/writes from these. |
| **4 Enums** | Role (Admin, Scolarite, Enseignant, Etudiant), AbsenceStatus, PaymentPlanType, PaymentStatus — type-safe values enforced at the database level. |
| **Migrations** | Database changes are versioned. If you change a table, Prisma creates a migration file that your teammates can replay to get the same change. |
| **EIDIA Seed data** | 5 real EIDIA accounts + realistic sample data across all tables. Anyone can test immediately without manually creating data. |

### Real EIDIA Accounts (password: `CampusOps@2026`)
| Email | Role |
|-------|------|
| `hamza.khchichine@eidia.ueuromed.org` | Admin |
| `karima.eddahhak@eidia.ueuromed.org` | Scolarité |
| `imad.adnane@eidia.ueuromed.org` | Enseignant |
| `siham.lyzoul@eidia.ueuromed.org` | Étudiant |
| `brahim.nakkar@eidia.ueuromed.org` | Étudiant |

### Seed Data
- **1 Branch**: EIDIA (UEMF — Route de Meknès, Fès)
- **1 Group**: CS-G1 (2025/2026)
- **7 Modules**: S8 CS & Cyber Security (Intro to AI, Blockchain, DevSecOps, etc.)
- **3 Planning sessions**: Weekly schedule for Imad Adnane
- **6 Absence records**, **4 Payments**, **4 Notifications**

---

## 🔐 Phase 3 — Authentication & Security ✅

| What we built | Why it matters |
|---|---|
| **JWT Access Token** (15 min) | This is how the frontend knows *who* is making a request. Every API call includes this token. Expires fast = more secure. |
| **JWT Refresh Token** (7 days) | When the access token expires, the frontend silently gets a new one without forcing the user to log in again. |
| **Token rotation** | If a hacker steals a refresh token, the system detects it and invalidates *all* tokens. Real-world security pattern used by Google, GitHub, etc. |
| **bcrypt password hashing** (12 rounds) | Passwords are never stored as plain text. Even if the database is hacked, passwords can't be read. |
| **RBAC middleware** (`requireRole`) | Admin can manage everything. Scolarité handles planning/payments. Prof marks absences. Students can only see their own data. One line of code: `requireRole('Admin', 'Scolarite')`. |
| **Rate limiting** | Blocks brute-force attacks: max 15 login attempts per 15 minutes. |
| **Swagger UI** (`/api/docs`) | Interactive API playground — test every endpoint visually in the browser. |

---

## 📡 Phase 4 — Core CRUD APIs (50+ endpoints) ✅

**9 modules, 36 files, 1,800+ lines of code.** Every module follows the same pattern: `schemas.ts → service.ts → controller.ts → routes.ts`.

| Module | What it does | Who can write |
|--------|-------------|--------------|
| **Branches** | Manage campus locations | Admin only |
| **Users** | Manage all accounts | Admin only |
| **Modules** | Academic subjects | Scolarité/Admin |
| **Groups** | Student groups + enroll/unenroll | Scolarité/Admin |
| **Planning** | Class scheduling + `/today` + `/week` | Scolarité/Admin |
| **Absences** | Attendance tracking + bulk marking + stats | Enseignant+ |
| **Progress** | Course completion % | Enseignant/Admin |
| **Payments** | Financial tracking + overdue filter + **email receipts** | Scolarité/Admin |
| **Notifications** | In-app alerts + unread count + mark-all-read | All users (own only) |

---

## 🎨 Phase 5 — Frontend Dashboard ✅

Full React SPA connected to the backend API. Role-based views, dark/light themes, French/English i18n.

| Page | Features |
|------|----------|
| **Login** | Pre-filled EIDIA credentials, JWT token storage |
| **Dashboard** | Role-specific stats (Admin sees all, Student sees their own) |
| **Planning** | Weekly calendar — **CRUD via API** (add/edit/delete sessions, syncs across roles) |
| **Absences** | Attendance table with bulk marking |
| **Grades** | Module grades view |
| **Payments** | **Full CRUD** — add/edit/delete payments, change status, send email receipts |
| **Users** | Add/edit/delete users via API |
| **Groups** | View/edit groups, see enrolled students |
| **Notifications** | Role-based notification feed |
| **Settings** | Telegram link/unlink, theme toggle, language switch |

### Design
- **Outfit** Google Font for premium typography
- CSS variables for dark/light mode
- Responsive sidebar with collapse
- UEMF/EIDIA branding

---

## 🤖 Phase 6 — Integrations ✅

| Integration | What it does |
|------------|-------------|
| **Email (SMTP)** | Send payment receipts, account invitations, alerts via Gmail |
| **Email (IMAP)** | Read incoming emails from the CampusOps mailbox |
| **Telegram Bot** | `@UEMF_CampusOps_bot` — account linking via 6-digit OTP, daily schedule, test messages |
| **OpenClaw Cron** | Daily planning notifications at 7 AM (Africa/Casablanca timezone) |

### Services
- `src/services/email.service.ts` — Nodemailer SMTP transporter + branded HTML templates
- `src/services/telegram.service.ts` — Telegram Bot API, message broadcasting
- `src/modules/telegram/` — Webhook, link/unlink, test endpoints

---

## 📋 Phase 7 — Docs & Tests ✅

- **Swagger/OpenAPI** annotations on all 50+ routes → auto-generated UI at `/api/docs`
- **Automated tests** for auth flow, CRUD operations, RBAC enforcement
- **README** with setup instructions
- **CONTRIBUTING.md** with team workflow
- **DEPLOYMENT.md** with cloud deployment guide

---

## 🚀 Phase 8 — Cloud Deployment ✅

Deployment configurations ready:
- **`render.yaml`** — Render Blueprint (API + managed Postgres + Redis, one-click deploy)
- **`railway.json`** — Railway configuration
- **`Dockerfile`** — Multi-stage production build (dev + prod targets)
- **Health check** at `/health` for uptime monitoring

---

## 🔗 How It All Connects

```
What a user sees:                What we built behind it:
─────────────────                ───────────────────────
Click "Login"                →   JWT + bcrypt + rate limiting
See their dashboard          →   RBAC (only their role's data)
View today's schedule        →   GET /api/planning/today
Mark attendance for a class  →   POST /api/absences/bulk
Add a payment for a student  →   POST /api/payments (saved to DB)
Send receipt to student      →   POST /api/payments/:id/send-receipt (real email)
Check course progress        →   GET /api/progress/group/:id
Get notified of overdue fees →   GET /api/notifications + /unread
Link Telegram account        →   POST /api/telegram/link (6-digit OTP)
Data loads instantly         →   PostgreSQL + Prisma queries
Works on every teammate's PC →   Docker + .env + migrations
Password is safe             →   bcrypt (12 rounds) + Zod validation
Session doesn't expire       →   Refresh token rotation
API is documented            →   Swagger UI at /api/docs
```

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| **Backend modules** | 10 (auth, users, branches, modules, groups, planning, absences, progress, payments, notifications) |
| **API endpoints** | 50+ |
| **Database models** | 10 + 4 enums |
| **Frontend pages** | 10 (dashboard, planning, absences, grades, payments, users, groups, notifications, settings, login) |
| **Integrations** | 4 (SMTP, IMAP, Telegram, Cron) |
| **Phases completed** | 8/8 ✅ |
