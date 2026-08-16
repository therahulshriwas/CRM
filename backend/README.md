# CRM Backend

REST API + Socket.io backend for the CRM platform. Built with Express, Sequelize (MySQL), JWT auth, Groq-based AI assistant, and real-time chat/dashboard updates.

## Tech Stack

- Node.js + Express 5
- Sequelize ORM + MySQL
- JWT (access/refresh) authentication
- Socket.io (chat + live dashboard)
- Groq SDK (AI assistant)
- Nodemailer (OTP / password reset)
- Multer (file uploads)
- Helmet, CORS, rate limiting

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Fill in the required values (at minimum `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).

4. Start the server:

```bash
npm run dev       # development (nodemon)
npm start         # production
```

The server runs on `http://localhost:5002` by default (set `PORT` in `.env`).

## Configuration

| Variable              | Description                                   |
| --------------------- | --------------------------------------------- |
| `PORT`                | Server port (default `5002`)                  |
| `NODE_ENV`            | `development` or `production`                 |
| `CLIENT_URL`          | Allowed CORS origin                           |
| `DB_HOST` / `DB_PORT` | MySQL host / port                             |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL credentials            |
| `DB_SYNC`             | `true` to auto-sync Sequelize models (dev only) |
| `JWT_ACCESS_SECRET`   | Secret for access tokens                      |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens                     |
| `GROQ_API_KEY`        | API key for the AI assistant                  |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Email sending     |

Migrations (in `migrations/`) run automatically on startup and create all core tables.

## Scripts

- `npm run dev` — start with nodemon
- `npm start` — start with node
- `node utils/migrations.js` — run migrations manually
- `node utils/seed.js` — seed development data

## API Overview

Routes are mounted under `/api`:

- `/api/auth` — register, login, refresh, logout
- `/api/leads`, `/api/deals`, `/api/customers` — core CRM entities
- `/api/dashboard`, `/api/reports` — stats and analytics
- `/api/chat`, `/api/notifications` — real-time features
- `/api/ai` — AI assistant (Groq)
- `/api/calendar`, `/api/invoices`, `/api/employees`, `/api/users`, `/api/uploads` — other modules

Health check: `GET /health`

## Folder Structure

```
backend/
├── config/        # DB connection, socket setup
├── controllers/   # Route handlers
├── middlewares/   # Auth, role, rate limit, query, error handling
├── migrations/    # SQL schema migrations
├── models/        # Sequelize models
├── routes/        # Express routers
├── services/      # AI provider, mail, notifications
├── sockets/       # Socket.io handlers
└── utils/         # Seeds, migrations runner, helpers
```