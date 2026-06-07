# Rapport du Projet de Fin de Semestre — CampusOps

**Réalisé par :** Hamza Khchichine  
**Formation :** 1ère année Cycle Ingénieur — Cybersécurité (EIDIA - UEMF)  
**Modules concernés :** Applications Réparties et Cloud  
**Dépôt Original du Projet :** [Hamza00-1/CampusOps-](https://github.com/Hamza00-1/CampusOps-)

---

## 1. Présentation Générale
Dans le cadre de la validation des modules d'Applications Réparties et Cloud, j'ai conçu et développé **CampusOps**. Il s'agit d'une plateforme distribuée moderne de gestion de campus universitaire spécifiquement modélisée pour l'EIDIA. 

Le système unifie la gestion de :
- L'administration académique (Filières, Modules, Groupes)
- La scolarité et les plannings
- L'assiduité des étudiants et la progression des cours
- Les paiements et flux financiers (inscriptions, mensualités) avec envois de reçus par email
- Les notifications en temps réel (via Telegram)

L'objectif principal était d'appliquer l'ensemble des concepts vus en cours (architectures distribuées, conteneurisation, sécurité des API, communications asynchrones) dans une application "production-ready".

---

## 2. Architecture et Choix Techniques

### 2.1 L'Architecture Distribuée
Le projet repose sur une architecture micro-services simulée (via Docker) séparant le Frontend, le Backend, la Base de données et le Cache.
- **Frontend :** Interface utilisateur riche développée en React.js, hébergée de manière statique via un serveur Nginx.
- **Backend :** API RESTful développée en Node.js (Express & TypeScript) comprenant plus de 50 endpoints sécurisés.
- **Base de données :** PostgreSQL 16 pour le stockage persistant et relationnel des données académiques.
- **Cache & Queue :** Redis 7 utilisé pour gérer le rate-limiting, les files d'attente d'emails et la mise en cache des requêtes fréquentes.

### 2.2 Choix Technologiques
| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Backend** | Node.js, Express, TS | Écosystème riche, gestion asynchrone native (I/O non bloquant). |
| **ORM** | Prisma | Typage strict de bout en bout et schémas déclaratifs. |
| **Frontend** | React 18, CSS pur | Performance, composants réutilisables. |
| **Sécurité** | JWT, Bcrypt, Zod | Validation stricte des entrées et authentification robuste (Access/Refresh tokens). |
| **Conteneurisation**| Docker & Compose | Reproductibilité de l'environnement, isolation des composants (TP1). |

---

## 3. Démarche et Fonctionnalités Réalisées

Le projet a été développé de manière incrémentale en 8 phases :

1. **Conception de la base de données :** Modélisation de 10 tables relationnelles (Users, Branches, Modules, Groups, Planning, Absences, Payments, etc.).
2. **Authentification & RBAC :** Mise en place d'un système de contrôle d'accès basé sur les rôles (Admin, Scolarité, Enseignant, Étudiant). Chaque rôle possède une vue et des droits spécifiques.
3. **Core APIs :** Développement complet du CRUD pour chaque entité.
4. **Intégrations Externes (Systèmes Distribués) :**
   - **Service Email (SMTP) :** Envoi asynchrone de reçus de paiement et d'alertes via Nodemailer.
   - **Bot Telegram :** Intégration d'un bot permettant aux étudiants de lier leur compte et de consulter leur emploi du temps depuis la messagerie Telegram.
5. **Conteneurisation :** Rédaction de `Dockerfile` multi-stages (pour la sécurité et la taille de l'image) et d'un `docker-compose.yml` global orchestrant les 4 services.

---

## 4. Déploiement et Exécution (Cloud)

Pour lier ce projet aux notions de Cloud, l'application est entièrement conteneurisée.
La procédure de lancement a été simplifiée au maximum grâce à Docker :

```bash
# Lancement de l'intégralité de la stack (Frontend, Backend, DB, Redis)
docker compose up --build -d

# Initialisation de la base de données (Migrations & Seeders)
# => Importe les données réelles de l'EIDIA
npm run db:seed
```

L'application est ensuite directement accessible :
- **Application Web :** `http://localhost:5173`
- **Documentation de l'API (Swagger) :** `http://localhost:3000/api/docs`

---

## 5. Difficultés Rencontrées et Solutions

1. **Sécurité et validation des entrées :** Assurer que chaque rôle n'accède qu'à ses données était complexe. 
   - *Solution :* Implémentation de middlewares Express stricts vérifiant le rôle contenu dans le JWT avant chaque exécution de route.
2. **Envoi d'emails bloquants :** L'envoi de reçus de paiement bloquait la réponse HTTP de l'API.
   - *Solution :* Externalisation de la logique d'envoi vers un traitement asynchrone (Queue), garantissant une réponse en quelques millisecondes à l'utilisateur.
3. **Réseau Docker :** Connecter le frontend Nginx au backend local.
   - *Solution :* Configuration d'un bridge network dans `docker-compose.yml` avec résolution DNS interne (`http://api:3000`).

---

## 6. Synthèse et Apports du Projet

Ce projet a été l'occasion parfaite pour consolider mes connaissances. J'ai pu :
- Appliquer concrètement la **conteneurisation Docker** (TP1) sur une stack complexe.
- Développer une **API robuste et tolérante aux pannes** (TP6).
- Mettre en place une **validation stricte des données et de la sérialisation** (TP7) grâce à Zod.
- Comprendre les enjeux du déploiement asynchrone et de la communication entre services via des Webhooks (Telegram) et des protocoles de messagerie (SMTP).

CampusOps est aujourd'hui une plateforme "production-ready", documentée, sécurisée et conteneurisée, répondant parfaitement aux attentes du module.
