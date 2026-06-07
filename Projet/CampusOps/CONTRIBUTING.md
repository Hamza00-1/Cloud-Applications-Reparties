# CampusOps Team Workflow

Welcome to the CampusOps backend/frontend repository! To keep our codebase clean, avoid merge conflicts, and practice professional distributed development, everyone MUST follow this workflow.

## 🚀 How to Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <REPO_URL>
   cd CampusOps
   ```
2. Make sure you have **Node.js 24+** and **Docker Desktop** installed.
3. Start the backend infrastructure (PostgreSQL & Redis):
   ```bash
   cd backend
   docker compose up -d db redis
   npm install
   ```
4. Ask the lead for the `.env` file! Do NOT commit your `.env` to GitHub.

## 🔀 Branching Strategy (CRITICAL)

**Never commit directly to the `main` branch.**

1. Pick the phase/feature you are working on.
2. Create a new branch with a descriptive name:
   ```bash
   git checkout -b feature/phase3-auth
   # or
   git checkout -b fix/auth-bug
   ```
3. Commit your changes logically:
   ```bash
   git add .
   git commit -m "feat: implemented JWT login"
   ```
4. Push your branch to GitHub:
   ```bash
   git push origin feature/phase3-auth
   ```
5. Go to GitHub and open a **Pull Request (PR)**. Require at least 1 person to review the code before merging.

## 👥 Work Distribution

To avoid merge conflicts, work on different phases simultaneously:

* **Member 1 (Security & Core API)**: Takes **Phase 3** (Auth & Security) and **Phase 4A** (Entity CRUD).
* **Member 2 (Business Logic)**: Takes **Phase 4B** (Planning, Absences, etc.). Wait for Phase 4A to be merged, or mock the database queries in the meantime.
* **Member 3 (Frontend)**: Takes **Phase 5** (React VITE dashboard). You can start immediately and mock the API calls while Member 1 & 2 build the backend.
* **Member 4 (Integrations)**: Takes **Phase 6** (Telegram, Emails). You can start building the bots independently from the API.

> Remember: Ask for help on the group chat, review each other's code, and test everything using Docker before committing!
