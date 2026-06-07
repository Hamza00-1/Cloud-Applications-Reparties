# CampusOps

**CampusOps** is a modern, distributed campus management platform built for **EIDIA — UEMF**. It handles planning, attendance, payments, academic progress, and notifications in one unified system — with a professional React dashboard and a full REST API backend.

## 🌟 Features

- **Role-Based Dashboard**: Specialized interfaces for Admin, Scolarité, Enseignant, and Étudiant
- **Academic Management**: Branch, Module, and Group hierarchy (EIDIA → CS-G1)
- **Planning & Attendance**: Weekly schedule with real-time CRUD — sessions sync across all roles
- **Financial Module**: Payment tracking (Inscription + Mensualité) with email receipts
- **Progress Tracking**: Course completion percentage per module/group
- **Telegram Bot**: `@UEMF_CampusOps_bot` — account linking, daily schedule queries
- **Email Notifications**: SMTP (Gmail) — payment receipts, account invitations, alerts
- **IMAP Inbox**: Read incoming emails from the CampusOps mailbox
- **Swagger API Docs**: Interactive playground at `/api/docs` with 50+ endpoints

> ⚠️ **Note to Professor (Email Delivery):** The system uses a standard SMTP server to send automated emails (like forgot password tokens). While this works flawlessly for personal addresses (e.g., `@gmail.com`), institutional firewalls like the one at `@eidia.ueuromed.org` often silently block or route these automated emails to the Spam/Junk folder because they lack official domain signing (SPF/DKIM). This is standard network behavior. You can always check the terminal logs or use a personal email to test the workflow.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, TypeScript, Zod validation |
| **Database** | PostgreSQL 16 via Prisma ORM |
| **Cache** | Redis 7 |
| **Frontend** | React 18 (Babel), Outfit font, CSS variables |
| **Email** | Nodemailer (SMTP + IMAP) |
| **Bot** | Telegram Bot API |
| **Infrastructure** | Docker Compose, Render/Railway deployment configs |

---

## 🚀 Quick Setup (5 minutes)

### Prerequisites
1. **[Node.js 20+](https://nodejs.org/)**
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**

### Step 1: Clone & install
```bash
git clone https://github.com/Hamza00-1/CampusOps-.git
cd CampusOps-/backend
npm install
```

### Step 2: Create `.env`
Create `backend/.env`:
```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api

DATABASE_URL=postgresql://campusops:campusops_secret@localhost:5432/campusops_db?schema=public
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=dev-access-secret-campusops-2026
JWT_REFRESH_SECRET=dev-refresh-secret-campusops-2026
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000
CORS_ORIGIN=*
LOG_LEVEL=debug

# Optional: SMTP for email receipts
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=CampusOps <your@gmail.com>
```

### Step 3: Start database + seed + run
```bash
docker compose up -d db redis
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Step 4: Open the frontend
Open **http://localhost:5173/CampusOps.html** in your browser.

### Step 5: Login with EIDIA accounts

| Email | Password | Role |
|-------|----------|------|
| `hamza.khchichine@eidia.ueuromed.org` | `CampusOps@2026` | **Admin** |
| `karima.eddahhak@eidia.ueuromed.org` | `CampusOps@2026` | **Scolarité** |
| `imad.adnane@eidia.ueuromed.org` | `CampusOps@2026` | **Enseignant** |
| `siham.lyzoul@eidia.ueuromed.org` | `CampusOps@2026` | **Étudiant** |
| `brahim.nakkar@eidia.ueuromed.org` | `CampusOps@2026` | **Étudiant** |

> **API Docs**: http://localhost:3000/api/docs (Swagger UI — test all 50+ endpoints)

---

## 📁 Project Structure

```
CampusOps-/
├── README.md
├── CONTRIBUTING.md            ← Team workflow & branching rules
├── CampusOps_Roadmap.md       ← Full Phase 1-8 implementation plan
├── DEPLOYMENT.md              ← Cloud deployment guide
├── render.yaml                ← Render blueprint (auto-deploy)
├── railway.json               ← Railway config
│
├── CompusOS_Frontend/         ← React Frontend
│   ├── CampusOps.html         ← Entry point
│   └── co2/
│       ├── api.js             ← API client (JWT auto-refresh)
│       ├── data.js            ← EIDIA seed data (fallback)
│       ├── login.jsx          ← Login page
│       ├── app.jsx            ← App shell + data sync
│       ├── shell.jsx          ← Sidebar + topbar layout
│       ├── pages1.jsx         ← Dashboard, Planning, Absences, Grades
│       ├── pages2.jsx         ← Payments, Users, Groups, Notifications, Settings
│       └── styles.css         ← Design system (dark/light themes)
│
├── backend/
│   ├── docker-compose.yml     ← PostgreSQL + Redis containers
│   ├── Dockerfile             ← Multi-stage production build
│   ├── prisma/
│   │   ├── schema.prisma      ← 10 database models, 4 enums
│   │   └── seed.ts            ← EIDIA real data seeder
│   └── src/
│       ├── config/            ← env, database, redis, swagger
│       ├── middleware/        ← auth, RBAC, validation, logging, errors
│       ├── modules/           ← 10 feature modules (auth, users, planning, etc.)
│       ├── services/          ← email.service.ts, telegram.service.ts
│       ├── utils/             ← JWT, hashing, response helpers
│       ├── app.ts             ← Express app + security middleware
│       └── index.ts           ← Bootstrap + graceful shutdown
│
└── doc/                       ← Project specification (PDF)
```

---

## 📡 API Endpoints (50+)

| Module | Key Endpoints |
|--------|--------------|
| **Auth** | `POST /login`, `/register`, `/refresh`, `/logout`, `PUT /change-password`, `GET /profile` |
| **Branches** | Full CRUD |
| **Users** | CRUD + search + filter by role/branch |
| **Modules** | CRUD (branch-scoped) |
| **Groups** | CRUD + enroll/unenroll students |
| **Planning** | CRUD + `/today` + `/week` (role-aware) |
| **Absences** | Single + bulk marking, justify, attendance stats |
| **Progress** | Upsert per module/group, group summary |
| **Payments** | CRUD + overdue filter + student summary + **email receipts** |
| **Notifications** | List + unread count + mark-read + mark-all-read |
| **Telegram** | Webhook, link/unlink, test message |

---

## 🏗️ Implementation Phases

| Phase | Description | Status |
|-------|------------|--------|
| Phase 1 | Scaffolding & Infrastructure | ✅ Done |
| Phase 2 | Database & Models (10 Prisma models) | ✅ Done |
| Phase 3 | Authentication & Security (JWT + RBAC) | ✅ Done |
| Phase 4 | Core CRUD APIs (50+ endpoints) | ✅ Done |
| Phase 5 | Frontend Dashboard (React) | ✅ Done |
| Phase 6 | Integrations (Email, Telegram, IMAP) | ✅ Done |
| Phase 7 | API Docs & Testing | ✅ Done |
| Phase 8 | Cloud Deployment Configs | ✅ Done |

---

## 👥 Team

- **Hamza Khchichine** — Lead Developer
- Built at **EIDIA — UEMF** (Université Euro-Méditerranéenne de Fès)

> 🤝 See `CONTRIBUTING.md` for the team workflow and branching rules.
