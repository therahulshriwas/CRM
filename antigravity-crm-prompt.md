# Antigravity Build Prompt — Sales CRM (Full Stack)

Paste everything below into Antigravity as your build instruction.

---

## Project context

I have an empty parent folder called `crm/` already open in this workspace. Inside `crm/`, create exactly two subfolders:

```
crm/
├── frontend/     ← all frontend code lives here
└── backend/      ← all backend code lives here
```

Do not put frontend and backend code in the same folder. Do not create the project at the root of `crm/` — everything must be nested inside `frontend/` or `backend/` respectively. Do not scaffold anything outside `crm/`.

This is a **Sales CRM** built from scratch. Build it as a real, production-structured app — not a toy demo.

---

## Tech stack

**Frontend** (inside `crm/frontend/`):
- React 18 + Vite
- Material UI (MUI v5) — primary component library
- Tailwind CSS — utility classes for spacing/layout only (disable Tailwind's preflight so it doesn't fight MUI's base styles)
- Framer Motion — page transitions and micro-interactions
- React Router v6
- Zustand — state management
- Axios — API calls
- Socket.io-client — real-time chat and live dashboard updates
- react-apexcharts (+ apexcharts) — live-updating, animated charts

**Backend** (inside `crm/backend/`):
- Node.js + Express.js
- MySQL with Sequelize ORM
- Socket.io — real-time chat server
- JWT (jsonwebtoken) + bcrypt — auth
- dotenv, cors, helmet, morgan

---

## Design system — dark neo-minimalism + aurora gradient

Apply this design language consistently across the app. This is not optional styling — treat it as the brand.

**Color tokens** (add to `tailwind.config.js` theme.extend.colors and MUI theme palette) — "purple cosmic" palette, replaces the earlier draft tokens:
| Token | Hex | Use |
|---|---|---|
| bg-base | #06040B | Page background — deep space black |
| bg-secondary | #0C0817 | Section backgrounds, sidebar |
| bg-surface | #12101C | Default card surface |
| bg-card | #171425 | Elevated card surface (stat cards, modals) |
| bg-hover | #201B31 | Hover state |
| border-soft | rgba(255,255,255,0.05) | 1px borders on cards and panels |
| text-primary | #FFFFFF | Headings, primary text |
| text-secondary | #B7B8C5 | Muted labels, subtext |
| accent-primary | #7C3AED | Primary CTA, active nav indicator |
| accent-glow | #8B5CF6 | Glow shadows, hover states |
| accent-highlight | #A855F7 | Emphasis, gradient mid-stop |
| accent-secondary-glow | #C084FC | Gradient light stop, particle color |
| info | #3B82F6 | Blue chips/dots for categorical data (e.g. "Proposal" stage, "Website" source) — distinct from the purple brand accent |
| success | #10B981 | Positive deltas, closed-won |
| warning | #F59E0B | Follow-up due, at-risk deals |
| danger | #F43F5E | Errors, overdue, lost deals |

Keep this as the single source of truth — every component (buttons, inputs, cards, charts, tables, modals) pulls from this palette, nothing hardcoded elsewhere.

**Typography:**
- Display/headings: "Geist" (fallback: system sans-serif), weight 600, tight letter-spacing
- Body/data: "Inter"
- Mono (IDs, timestamps): "JetBrains Mono"

**Glassmorphism tokens** (used on floating/overlay elements: nav pills, modals, the login/signup card, notification dropdown):
```css
.glass {
  background: rgba(19, 19, 24, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

**Neumorphism tokens** (used on primary stat cards and buttons — dark-mode soft-shadow variant, dual shadow on the same surface color):
```css
.neu-card {
  background: #131318;
  border-radius: 20px;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.5),
    -6px -6px 14px rgba(139, 92, 246, 0.04);
}
.neu-button {
  background: #131318;
  border-radius: 12px;
  box-shadow:
    4px 4px 8px rgba(0, 0, 0, 0.4),
    -3px -3px 8px rgba(139, 92, 246, 0.05);
}
.neu-button:active {
  box-shadow: inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(139,92,246,0.04);
}
```

**How to combine the two**: outer stat cards on the dashboard use `.neu-card` (soft, embedded-in-surface feel). Floating elements that sit above content — the aurora hero overlay panel, modals, the auth card, notification popovers — use `.glass` (translucent, blurred, sits above the aurora glow so the color bleeds through it). Never stack both on the same element.

**Layout principles:**
- Dark sidebar navigation, minimal icons, generous spacing
- Standard content cards: `bg-surface`, `border border-borderSoft`, `rounded-2xl`, flat — reserve `.neu-card` and `.glass` for the dashboard and auth screens specifically, per the rules above
- Aurora background (three layered, blurred, slowly-drifting radial gradient blobs using accent-primary, accent-highlight, and accent-secondary-glow, opacity 0.15–0.3, blur 100–140px) sits behind the dashboard header/hero **and** as a fainter ambient layer (opacity 0.1) behind the login/signup screen. Keep internal data-heavy pages (leads table, settings) flat and disciplined so the glow doesn't fight with readability.
- A subtle static star/particle field (12–20 tiny fixed dots, 1–2px, opacity 0.15–0.3, `text-secondary` color, no animation or a very slow 40s+ drift) can sit behind the aurora on the dashboard and auth screens only — this is a CSS/SVG dot layer, not a physics particle system. Skip it on data-dense pages.
- Framer Motion: subtle fade-up on page load (`opacity 0→1, y 10→0`), smooth spring on kanban card drag, hover scale (1.0→1.02) on cards, staggered children animation when a list/grid of stat cards first mounts. Respect `prefers-reduced-motion` — disable ambient drift and stagger for users who have it set.

---

## Dashboard reference layout (exact visual target)

I'm attaching a reference screenshot (a concept called "NovaCRM") — treat its **layout structure and widget composition as the literal target** for the Phase 1 dashboard, not just inspiration. Colors/typography follow the tokens already defined above (the reference uses a similar purple-cosmic palette, so it maps directly).

**Grid**: sidebar (fixed, ~220px) — main content area (fluid) — persistent right panel (fixed, ~280px). Main content and right panel scroll independently.

**Topbar** (already covered in Navigation section) — matches the reference exactly: logo + tagline, workspace switcher, global search with ⌘K hint, a gradient "Quick Action" button, notification bell with count badge, chat icon, theme toggle, apps grid icon, user avatar with online-status dot and role label.

**Row 1 — greeting**: "Welcome back, {name} 👋" with a date picker and a live clock + pulsing "Live" indicator, right-aligned.

**Row 2 — stat cards** (6 across, `.neu-card`): Total Revenue, Total Profit, Total Customers, New Leads — each with an icon in a colored circle, the value, a percent-change chip (green up / red down), and a tiny sparkline at the bottom. Conversion Rate and Growth use the same card shape but replace the sparkline with a small circular progress ring instead. This sparkline/ring pattern **is** the "chart ceiling" for this row — don't add full-size charts here, the cards stay compact.

**Row 3 — two charts side by side** (this is the dashboard's real analytics, ~60/40 split):
- **Revenue Overview** (left, larger): the glowing area/line chart already specified in the Charts section below, with a hover tooltip showing date + value, x-axis dates, y-axis currency
- **Sales by Source** (right): a donut chart with a glowing multi-color ring (use accent-primary, accent-highlight, info, warning, and a neutral gray across segments), center label showing the total + percent change, and a legend list to the right of the donut with colored dots + percentages

**Row 4 — table + kanban preview side by side**:
- **Recent Deals** (left): a data table — Deal Name, Customer, Value, Stage (colored chip using the stage-color mapping below), Owner (avatar + name), Last Activity (relative time) — with search, a filter icon, and pagination ("Showing 1 to 5 of 25 results")
- **Sales Pipeline** (right): a **condensed reuse of the same kanban component** built for the full Deals/Pipeline page (item 3 below) — same columns (Qualified/Proposal/Negotiation/Won), same cards, just height-capped to show 2–3 cards per column plus a "+N more" link. Don't build a second, separate pipeline widget — render the real kanban component with a `compact` prop.

**Stage/status color mapping** (used consistently in chips, kanban column headers, and the donut): Qualified = `info` blue, Proposal = `accent-highlight` purple, Negotiation = `warning` amber, Won = `success` green, Lost = `danger` red — pick this one mapping and reuse it in the kanban column headers, table chips, and anywhere else a deal stage is shown.

**Right panel (persistent, not a modal)**:
- **Live Activity** feed at the top — icon + title + subtitle + relative time + colored status dot per entry (new deal closed, new lead added, payment received, task completed, new deal created)
- **AI Assistant** panel below it (marked "Beta") — a greeting message bubble, a few insight cards (trend prediction, deals needing attention, follow-up suggestions), and an input box "Ask AI anything..." at the bottom

**Floating action button**: a circular glowing button, bottom-right of the viewport, with a sparkle icon — global AI assistant launcher, visible on every page (not just the dashboard).

**Build-order note**: the Live Activity feed and AI Assistant panel's *visual shell* get built in Phase 1 with static/mock data (so the layout matches the reference from day one) — but they only get wired to real data in Phase 2 (Live Activity → real activity/socket events) and Phase 3 (AI Assistant → real Anthropic API calls) respectively, per the phase plan below. Don't block the Phase 1 UI on backend features that aren't built yet.

---

## Charts & real-time dashboard data

**Chart library**: use `react-apexcharts` (ApexCharts) instead of Recharts — it has smoother built-in transition animations when data updates live, native gradient fill support, and handles real-time `updateSeries()` calls cleanly without a full re-render. This matters for a "live" feel.

**The two dashboard charts** (per the reference layout above):
1. **Revenue Overview** — area chart with an accent-primary → transparent gradient fill, smooth curve, animated draw-in on load
2. **Sales by Source** — donut chart, multi-color segments (see stage/status mapping above), animated count-up on the center total label

Stat-card sparklines and the conversion/growth rings are small ApexCharts instances too (`sparkline: { enabled: true }` mode) — lightweight, no axes or gridlines. This is the full chart budget for the dashboard; anything beyond these belongs on the Phase 4 Reports page, not stacked onto the home screen.

**Styling the charts to match the theme:**
- Chart background transparent (let the `.neu-card` or `.glass` container underneath show through)
- Gridlines: very faint, `border-soft` color at low opacity, or none at all
- Data line/area color: `accent-primary`, with the line itself given a soft `filter: drop-shadow(0 0 6px rgba(124,58,237,0.6))` so it reads as glowing — this achieves the "glowing graph line" effect without any actual bloom/lighting engine
- Area fills: gradient fade from `accent-glow` at ~25% opacity down to transparent
- Tooltips: styled as small `.glass` popovers, not ApexCharts' default white tooltip
- Axis labels: `text-secondary`, small, `Inter` font
- **"Particle traveling along the line" effect** (optional, revenue chart only): a single small circle (6px, `accent-secondary-glow`, soft glow) animated along the SVG path using CSS `offset-path` + `offset-distance` looping over ~4s. This is the real, performant way to do a "particle on a graph line" in a browser — do not attempt a particle-physics system, it will tank performance on a data dashboard that's already running live socket updates.

**Making it actually "live":**
- Backend: add a `dashboardSocket.js` in `backend/sockets/` — on an interval (or triggered whenever a lead/deal changes), emit a `dashboard:update` event with fresh aggregate stats (total leads, deals by stage, today's activity count)
- Frontend: dashboard page subscribes to `dashboard:update` via Socket.io and calls the chart's `updateSeries()` with new data — the chart should animate smoothly from old values to new ones, not jump/flicker
- Add a small pulsing "live" indicator (a dot with a soft glow animation) near the dashboard header to signal the data is real-time, not static
- Stat cards (total leads, revenue, conversion rate) should animate the number itself counting up/down when it changes (a simple count-up animation), not just swap the digit instantly

**Role-based dashboard data**: an `agent` sees only their own leads/deals/stats; a `team_lead` sees their team's; an `admin` sees everything. The backend aggregation query and the socket emit must filter by role + user/team id — don't fetch everything and filter on the frontend.

---

## Navigation — sidebar & topbar

**Left sidebar** (`.glass` background, floating with margin from the viewport edge, not flush): logo, workspace name, then nav items grouped in two tiers —

*Core (built in Phase 1–2, fully functional):*
Dashboard · Leads · Deals/Pipeline · Chat · Reports

*Future modules (rendered as disabled/"coming soon" nav items — visible for the premium feel the brief wants, but not built yet, so scope doesn't balloon into a full ERP):*
Customers · Calendar · Invoices · Employees

Active nav item gets a left-edge vertical bar in `accent-primary` plus a soft glow behind the icon. Hover state: `bg-hover` with a 150ms fade, no layout shift.

**Topbar**: global search (opens a `.glass` command palette, not a plain input — Cmd+K to trigger, matches the Raycast/Linear reference in the brief), notification bell with a small unread-count badge, user avatar with role badge (colored pill: admin = accent-primary, team_lead = accent-highlight, agent = neutral gray), a small pulsing green dot + "Live" label to confirm the socket connection is active.

**Role-based nav/widgets**: keep this scoped to the three roles already in the schema — `admin`, `team_lead`, `agent` — each sees a different dashboard widget set (admin: company-wide stats + team leaderboard; team_lead: team stats + team member list; agent: personal stats + today's follow-ups). Do not build separate HR/Finance/Support dashboards — that's outside a sales CRM's scope. If a future need for those comes up, it should be a new project phase, not bolted onto this one.

---

## Buttons, inputs & icons

**Buttons**: base state uses `.neu-button`. Primary action buttons additionally get a subtle `accent-primary` gradient background (`linear-gradient(135deg, #7C3AED, #A855F7)`) with a glow shadow (`box-shadow: 0 4px 20px rgba(124,58,237,0.35)`) that intensifies slightly on hover. Hover also applies a `scale(1.02)` via Framer Motion — no ripple effect (Material's ripple looks dated against this theme; disable MUI's default ripple globally in the theme).

**Inputs**: `.glass` background, floating label (label sits inline until focus/filled, then animates up and shrinks — MUI's `variant="filled"` customized, or build with Framer Motion), focus state gets a 2px `accent-primary` ring plus a faint glow, no harsh MUI default outline.

**Icons**: use `lucide-react` throughout instead of MUI's default icon set — thinner stroke, more premium look, and it's what Linear/Raycast actually use. Keep one icon weight (1.5px stroke) consistently across the whole app.

---

## Motion principles

Motion must feel physical, not decorative — this is what separates "alive" from "distracting."

- Use Framer Motion's `type: "spring"` with `stiffness: 300, damping: 30` as the default transition for anything that moves on interaction (hover, drag, modal open) — not linear easing.
- **Magnetic hover** (nav items, primary buttons only): track cursor position within the element's bounding box and offset the element slightly (max 4–6px) toward the cursor using `onMouseMove` + Framer Motion's `useMotionValue`/`useSpring`. Reset to 0,0 on mouse leave with a spring.
- **Cursor glow**: a single fixed-position div following the cursor with a large, very low-opacity radial gradient (`accent-glow` at ~6% opacity, 300px blur) — desktop only, disabled on touch devices, disabled under `prefers-reduced-motion`.
- **Sequential entrance**: when the dashboard first mounts, stagger the stat cards and charts in with a 60–80ms delay between each (`staggerChildren` in a Framer Motion `variants` object) — do this once per page load, not on every re-render when live data updates.
- **Breathing idle motion**: reserve for exactly one element — the aurora background blobs — a slow (15–25s) scale/position drift. Do not add idle breathing motion to cards or buttons; it reads as broken/laggy on data-heavy screens, not "alive."
- Every animation respects `prefers-reduced-motion: reduce` — ambient drift, cursor glow, and magnetic hover all disable; functional transitions (page fade, modal open) can stay but should shorten to near-instant.

---

## Core features — build in this order (MVP first)

### Phase 1 — MVP
1. **Auth**: register and login screens built as a centered `.glass` card floating over a faint ambient aurora background — fully on-theme, not a default MUI form. JWT access token + httpOnly refresh token cookie, role-based (admin, team_lead, agent) selected at signup or assigned by an admin.
2. **Leads module**: CRUD, list view with filters (status, source, owner), lead detail page
3. **Deals/Pipeline**: Kanban board with drag-and-drop stage changes (Qualified → Proposal → Negotiation → Won) — same stage names used consistently in the dashboard's condensed pipeline widget, table chips, and donut chart
4. **Dashboard**: build exactly per the "Dashboard reference layout" section above — stat card row, Revenue Overview + Sales by Source charts, Recent Deals table + condensed Sales Pipeline widget, right panel with Live Activity + AI Assistant shells (mock data for now), floating AI launcher button, live-updating via Socket.io, role-filtered data

### Phase 2 — after MVP works
5. **Real-time internal chat**: Socket.io, one-to-one and group conversations, message persistence in MySQL, typing indicator, read receipts
6. **Notifications**: in-app notification bell for follow-up reminders and new messages
7. **Forgot password + OTP flow**: email-based OTP for password reset, same `.glass` auth card styling as login/signup

### Phase 3 — after phase 2 works
8. **AI chatbot module**: build this so the AI provider can be swapped later without touching any controller, route, or frontend code — never call the Anthropic API directly from a controller.
   - `services/ai/providers/anthropicProvider.js` implements a shared function signature, e.g. `async function chat(messages, options)` returning a plain `{ text }` — this file is the ONLY place that knows the request/response shape is Anthropic-specific (`https://api.anthropic.com/v1/messages`, model from `process.env.AI_MODEL`).
   - `services/ai/providerFactory.js` reads `process.env.AI_PROVIDER` (default `"anthropic"`) and returns the matching provider module.
   - `services/ai/aiService.js` is the only file imported anywhere else in the app (controllers, sockets) — it calls the factory internally and exposes one clean function. If I switch to OpenAI, Google, or any other provider later, I only add a new file under `providers/` and change the `AI_PROVIDER` env var — nothing else in the codebase should need to change.
   - Two use cases on top of this: (a) internal assistant — agent asks natural language questions about their leads/deals, (b) auto-drafting follow-up messages.

### Phase 4 — optional, only if the app is still fast and stable after phase 3
9. **2FA** (TOTP-based, e.g. via `speakeasy`) as an opt-in security setting
10. **Reports page**: a dedicated analytics page for the heatmap/extra chart types that don't belong on the home dashboard

Build and verify each phase completely before starting the next. Don't scaffold multiple phases' files at once — I want a working MVP first, and I'll explicitly ask to move forward.

---

## Database schema (MySQL, via Sequelize models in `backend/models/`)

```
users
  id (PK), name, email (unique), password_hash, role (enum: admin/team_lead/agent), created_at

leads
  id (PK), owner_id (FK -> users), name, phone, email, source, status, created_at

deals
  id (PK), lead_id (FK -> leads), owner_id (FK -> users), title, value (decimal), stage, close_date

activities
  id (PK), deal_id (FK -> deals), type, notes (text), created_at

conversations
  id (PK), type (enum: direct/group), created_at

conversation_participants
  id (PK), conversation_id (FK), user_id (FK)

messages
  id (PK), conversation_id (FK), sender_id (FK -> users), content (text), is_read (boolean), created_at
```

---

## Backend folder structure (inside `crm/backend/`)

```
backend/
├── config/
│   ├── db.js
│   └── socket.js
├── models/
├── controllers/
├── routes/
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   └── error.middleware.js
├── sockets/
│   ├── chatSocket.js
│   └── dashboardSocket.js
├── services/
│   └── ai/
│       ├── aiService.js         # the ONLY file the rest of the app imports — exposes chat(messages), never provider-specific
│       ├── providerFactory.js   # picks a provider based on process.env.AI_PROVIDER
│       └── providers/
│           └── anthropicProvider.js   # implements the shared interface for Anthropic; add openaiProvider.js etc. later without touching aiService.js
├── utils/
├── .env.example
└── server.js
```

## Frontend folder structure (inside `crm/frontend/`)

```
frontend/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── common/
│   │   ├── leads/
│   │   ├── deals/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   │   ├── charts/       # RevenueOverviewChart.jsx, SalesBySourceDonut.jsx, StatSparkline.jsx
│   │   │   └── rightPanel/   # LiveActivityFeed.jsx, AIAssistantPanel.jsx
│   │   └── layout/           # Sidebar.jsx, Topbar.jsx, FloatingAIButton.jsx
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── animations/
│   │   └── variants.js
│   ├── store/
│   ├── theme/
│   │   └── muiTheme.js
│   └── App.jsx
├── tailwind.config.js
└── vite.config.js
```

---

## API endpoints (Phase 1 scope)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id

GET    /api/deals
POST   /api/deals
PUT    /api/deals/:id/stage

GET    /api/dashboard/stats   # role-filtered aggregate stats, also emitted via dashboard:update socket event
```

---

## Environment variables

Never hardcode secrets, ports, or API keys anywhere in the codebase — everything configurable lives in `.env` files, and both `frontend/` and `backend/` get a checked-in `.env.example` (with placeholder values, no real secrets) so the project is easy to set up on any machine.

**`backend/.env.example`:**
```
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crm_db
DB_USER=root
DB_PASSWORD=

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI provider — provider-agnostic by design, see the AI provider abstraction section
AI_PROVIDER=anthropic
AI_API_KEY=
AI_MODEL=claude-sonnet-4-6

# Email (for OTP / password reset, Phase 2)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

**`frontend/.env.example`:**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Switching AI providers later — this is the point of `AI_PROVIDER` and `AI_MODEL` being separate env vars from the code**: today it's `AI_PROVIDER=anthropic`. If I move to a different provider later, I change `AI_PROVIDER` and `AI_API_KEY` in `.env`, add one new file under `backend/services/ai/providers/`, and register it in `providerFactory.js` — no other file in the app touches an AI API directly, so nothing else breaks. Confirm this works by never importing `anthropicProvider.js` from anywhere except `providerFactory.js`.

`.env` itself (with real values) must be in `.gitignore` — only `.env.example` gets committed.

---

## Code documentation standard

Every file follows this, no exceptions:

- **Top-of-file comment** (2–4 lines): what this file is, what it's responsible for, and — for components — where it's used. Example:
```js
// LeadCard.jsx
// Displays a single lead as a compact card (avatar, name, budget, last contact).
// Used in: Leads list page, Dashboard's condensed activity views.
// Reusable — accepts a `lead` object and an optional `onClick` handler, no page-specific logic inside it.
```
- **Function/hook-level comments**: any non-trivial function (more than a few lines, or with a non-obvious purpose) gets a one-line comment above it explaining what it does — not restating the code, explaining the *why* when it's not obvious from the *what*.
- **Inline comments** only where the logic itself is non-obvious (a regex, a workaround, a specific business rule) — don't comment obvious lines like `// set loading to true`.
- Backend controllers/routes: comment each route with what it does, who's allowed to call it (which roles), and what it returns.

The goal: I should be able to open any file cold and understand its purpose within 10 seconds, without reading the whole implementation.

---

## Reusability & code hygiene — no dead weight

This matters as much as the visual design. Keep the codebase lean:

- **Every component must be reusable or justified.** Before creating a new component, check if an existing one in `components/common/` already does the job with different props. A `StatCard`, `Modal`, `Button`, `Input`, `Badge`, `Avatar`, `EmptyState`, and `Skeleton` loader belong in `common/` and get reused everywhere — never copy-pasted with small tweaks into a page-specific version.
- **No single-use throwaway files.** If a component is only ever rendered once, in one place, with no props that vary — ask whether it needs to be its own file at all, or whether it should just be inline JSX in its parent. Don't create a component "just in case it's reused later."
- **No dead code.** No commented-out blocks of old code left in files, no unused imports, no unused variables, no placeholder functions that do nothing. If something was scaffolded for an earlier phase and got replaced, delete it — don't leave it in the file "in case."
- **Everything data-driven, nothing hardcoded.** Nav items, stat card definitions, table columns, kanban stage names — these live in config arrays/objects (e.g. `config/navItems.js`, `config/dealStages.js`) that components map over, not hardcoded JSX repeated per item. Adding a new stat card or nav item later should mean editing one config array, not touching multiple component files.
- **Keep the bundle light**: lazy-load route-level pages with `React.lazy` + `Suspense`, don't import the entire icon set from `lucide-react` (import icons individually), and don't pull in a heavy library for something three lines of vanilla JS can do.
- Before finishing each phase, do a pass: delete unused files, remove console.logs, remove commented-out code, confirm every component in `components/` is actually imported somewhere. A component that exists but is never imported is dead weight — delete it, don't leave it "just in case."

---

## Instructions to the agent

1. First, create the `frontend/` and `backend/` folder structure exactly as specified above — nothing at the root of `crm/`. Create `.env.example` in both folders per the Environment variables section, and add a `.gitignore` that excludes `.env`, `node_modules`, and build output.
2. Scaffold the backend first: Express server, MySQL connection via Sequelize, the four Phase 1 models, auth routes with JWT, and leads + deals CRUD routes. Confirm the server runs and I can hit `/api/auth/register` before moving on.
3. Then scaffold the frontend: Vite + React app, install MUI + Tailwind (with preflight disabled) + Framer Motion + lucide-react + react-apexcharts, set up the MUI theme and Tailwind config using the exact color tokens above, build the login/signup pages (glass card + ambient aurora + floating labels), the sidebar and topbar (per the Navigation section), the dashboard (built exactly per the "Dashboard reference layout" section — I'm attaching the reference screenshot alongside this prompt, use it as the literal visual target), leads list/detail pages, and the kanban pipeline board. Apply the button/input/motion specs globally via the MUI theme and shared components — don't restyle each screen ad hoc.
4. Wire the frontend to the backend via Axios, with JWT stored appropriately and attached to requests.
5. Apply the Code documentation standard and Reusability & code hygiene rules from the start, not as cleanup at the end — every file gets its top comment when it's created, and every component goes in `common/` if it's genuinely reusable.
6. Do not add chat or AI features yet — stop after Phase 1 is working end-to-end and ask me before continuing to Phase 2.
