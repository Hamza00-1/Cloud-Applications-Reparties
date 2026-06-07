# CampusOps — Developer Setup Guide

Welcome to the team! This document explains exactly how to get the CampusOps project running on your own computer in under 5 minutes.

Because we use **Docker**, you do **not** need to manually install or configure PostgreSQL or Redis. It is entirely automated.

## 📋 Prerequisites
Before you start, make sure you have installed:
1. **Node.js** (v18 or higher)
2. **Docker Desktop** (Make sure it is running!)
3. **Git**

---

## 🚀 Quick Start (Do this exactly in order)

### 1. Clone the repository
Open your terminal and clone the repository to your computer:
```bash
git clone <YOUR-GITHUB-REPO-LINK-HERE>
cd Openclaw
```

### 2. Install dependencies
Navigate into the `backend` folder and install all the Node packages:
```bash
cd backend
npm install
```

### 3. Start the Database Environment
Make sure Docker Desktop is open. Then run this command to magically spawn your PostgreSQL database and Redis server:
```bash
docker compose up -d
```
*(Wait a few seconds for them to fully boot up)*

### 4. Create Tables & Insert Demo Data
Now, we need to create our tables and fill them with the fake students, teachers, and modules:
```bash
npx prisma db push
npx prisma db seed
```

### 5. Start the API Server
Start the CampusOps backend natively:
```bash
npx tsx src/index.ts
```
*You should see a message saying the API is running on port 3000 and the Database is connected!*

### 6. Open the Frontend
Leave the backend running in that terminal. 
Now, you can just open the `CampusOps.html` file located in the `CompusOS_Frontend` folder.

If your browser blocks it (giving a blank page), simply serve it using `npx`:
```bash
# Open a new terminal tab
cd CompusOS_Frontend
npx serve -p 5000 .
```
Then visit `http://localhost:5000/CampusOps.html` in your browser.

---

## 🔑 Demo Accounts
Use these to log in and test your changes:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campusops.ma` | `Admin123!` |
| Scolarité | `scolarite@campusops.ma` | `Scolar123!` |
| Enseignant | `prof@campusops.ma` | `Prof123!` |
| Étudiant | `student@campusops.ma` | `Student123!` |

*(The 2FA code in demo mode is always `111111`)*

Happy coding! 🚀
