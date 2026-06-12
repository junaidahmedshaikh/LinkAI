# AI LinkedIn Assistant (LinkAI)

Production-ready SaaS monorepo — **Phase 1**: authentication. **Phase 2**: dashboard, profile, resumes, LinkedIn data, activity, settings. AI features ship in Phase 3.

## Monorepo Structure

```
ai-linkedin-assistant/
├── apps/
│   ├── web/          # React + Vite + TypeScript frontend
│   ├── server/       # Express + MongoDB + TypeScript API
│   └── extension/    # Chrome extension (Phase 2 placeholder)
├── packages/
│   ├── shared/       # Shared constants & API routes
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI utilities
└── docs/
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TypeScript, Tailwind, Redux Toolkit, React Query, React Router, Axios, React Hook Form, Zod, Framer Motion |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Helmet, CORS, rate limiting |
| Auth | JWT access (15m) + refresh (7d, HTTP-only cookie), token rotation, Google OAuth, LinkedIn OAuth (structure), RBAC |

## Prerequisites

- **Node.js** 20+
- **MongoDB** 7+ (local or Docker)
- **npm** 10+

## Quick Start

### 1. Install dependencies

```bash
cd ai-linkedin-assistant
npm install
```

### 2. Environment variables

**Backend** — copy and edit:

```bash
cp apps/server/.env.example apps/server/.env
```

**Frontend**:

```bash
cp apps/web/.env.example apps/web/.env
```

### 3. Start MongoDB (Docker)

```bash
docker compose up mongo -d
```

Or use a local MongoDB instance and set `MONGO_URI` in `apps/server/.env`.

### 4. Build shared packages

```bash
npm run build -w @linkai/types
npm run build -w @linkai/shared
```

### 5. Run development servers

```bash
npm run dev
```

- **API**: http://localhost:5000
- **Web**: http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (protected) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Current user (protected) |
| GET | `/api/auth/verify-email?token=` | Verify email |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/linkedin` | LinkedIn OAuth |
| POST | `/api/users/onboarding` | Complete onboarding (protected) |

## Authentication Flow

1. **Register** — password hashed with bcrypt (12 rounds), JWT pair issued, refresh token hashed in DB.
2. **Login** — credentials verified, tokens issued, refresh stored as SHA-256 hash.
3. **Refresh** — rotation: old refresh invalidated, new pair issued.
4. **OAuth** — Google/LinkedIn via Passport; redirects to onboarding or dashboard.
5. **Protected routes** — `authenticate` middleware validates Bearer token or `accessToken` cookie.

## OAuth Setup (optional)

Add to `apps/server/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/auth/linkedin/callback
```

Without these, OAuth routes return `503` with a configuration message.

## Docker (full stack)

```bash
docker compose up --build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + web concurrently |
| `npm run dev:server` | API only |
| `npm run dev:web` | Frontend only |
| `npm run build` | Production build |

## Phase 2 — Dashboard Routes (after login)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview and usage stats |
| `/dashboard/comments` | AI comment history and tools |
| `/dashboard/settings` | Account, security, notifications |
| `/dashboard/admin` | Admin-only (role: `admin`) |

## Phase 2 API Endpoints

| Method | Endpoint |
|--------|----------|
| GET | `/api/dashboard/overview` |
| GET/PUT | `/api/settings` |
| PUT | `/api/security/change-password` |
| POST | `/api/security/logout-all` |
| GET | `/api/security/sessions` |

## Phase 3 — Chrome Extension

**Load unpacked (recommended):**

```bash
npm run build -w @linkai/types
npm run build -w @linkai/shared
npm run build -w @linkai/extension
```

Then in Chrome → `chrome://extensions` → **Load unpacked** → select `apps/extension/dist`.

**Dev mode (HMR):** keep the dev server running while using the extension:

```bash
npm run dev:extension
```

If you see **Service worker registration failed (status code: 3)**, you loaded a dev build without the Vite server running. Run a production build (above) or start `npm run dev:extension`.

See `apps/extension/README.md` for architecture.

## Phase 4 — Web ↔ Extension Integration

Unified auth, sync APIs, device management, and shared user context.

```bash
npm run dev:server
npm run dev:web
npm run build:extension   # load apps/extension/dist in Chrome
```

**Web ↔ extension auth sync:** After loading the extension, copy its ID from `chrome://extensions` into `apps/web/.env`:

```
VITE_EXTENSION_ID=your-extension-id-here
```

When you log in on the web app, tokens are pushed to the extension automatically.

**New APIs:** `/api/sync/*`, `/api/extension/connect`, `/api/extension/disconnect`

## Phase 5 — AI Features

### 5.1 AI Comment Generator (MVP)

**Extension:** Open side panel on LinkedIn feed → scan post → pick tone → generate → copy or insert.

**API:** `POST /api/ai/comments/generate`, `GET /api/ai/comments/history`

**Optional:** Set `OPENAI_API_KEY` in `apps/server/.env` for real AI (otherwise dev mock comments).

Rebuild extension after changes: `npm run build:extension`

## Phase 5.2 Roadmap

- AI content generation
- LinkedIn Chrome extension sync
- Billing & subscription management
- Email delivery (SendGrid/Resend)

## License

Proprietary — All rights reserved.
