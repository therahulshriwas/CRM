# CRM Frontend

React SPA for the CRM platform. Built with React 19, Vite, Tailwind CSS, Zustand, React Router, ApexCharts, Framer Motion, and Socket.io client for real-time updates.

## Tech Stack

- React 19 + Vite
- Tailwind CSS 4 + PostCSS
- Zustand (state management)
- React Router v7
- ApexCharts + react-apexcharts (dashboard widgets)
- Framer Motion (animations)
- Socket.io client (chat + live dashboard)
- Axios (API requests)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Environment Variables

| Variable              | Description                              |
| --------------------- | ---------------------------------------- |
| `VITE_API_BASE_URL`   | Backend REST API URL (`.../api`)         |
| `VITE_SOCKET_URL`     | Backend Socket.io URL                    |

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — lint with Oxlint

## Pages

- Auth: Login, Register, Forgot Password, Reset Password, Landing
- CRM: Dashboard, Deals (kanban), Leads, Customers, Reports, Analytics
- Tools: Chat, Calendar, Tasks, Notes/Projects, Invoices, Employees, Notifications
- System: AI Workspace, Admin, Search, Profile, Settings, Help

## Folder Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── api/         # Axios instance + API wrappers
│   ├── components/  # UI primitives, layout, dashboard widgets, AI assistant
│   ├── config/      # Nav items, deal stages, lead config
│   ├── pages/       # Route-level views
│   ├── store/       # Zustand stores
│   ├── theme/       # Design tokens
│   └── utils/       # Formatting, validation, security helpers
```