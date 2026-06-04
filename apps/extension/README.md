# LinkAI Chrome Extension (Manifest V3)

Production-ready foundation for LinkedIn integration. AI features plug in via side panel and content scripts in Phase 4.

## Stack

- React 18 + TypeScript + Vite
- `@crxjs/vite-plugin` for MV3 builds
- Redux Toolkit
- Tailwind CSS
- Axios + JWT refresh

## Load in Chrome (recommended — production build)

The `dist` folder from **dev mode** uses `service-worker-loader.js` and requires the Vite dev server. For a standalone extension, use a **production build**:

```bash
# From monorepo root
npm install
npm run build -w @linkai/types
npm run build -w @linkai/shared
npm run build -w @linkai/extension
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `ai-linkedin-assistant/apps/extension/dist`

The production manifest uses a bundled service worker (not `service-worker-loader.js`).

Copy env before building:

```bash
cp apps/extension/.env.example apps/extension/.env
```

## Development (HMR)

If you use `npm run dev -w @linkai/extension`, you **must keep that terminal running**. The dev build loads the service worker from `http://localhost:5174`.

```bash
npm run dev:extension   # from monorepo root
# Load apps/extension/dist — reload extension after code changes
```

If you see **"Service worker registration failed. Status code: 3"**, either:

- Start the dev server (`npm run dev -w @linkai/extension`), **or**
- Run a production build (see above) and reload the extension

## Architecture

| Layer | Role |
|-------|------|
| `background/` | Service worker: auth, API, tabs, heartbeat |
| `content/` | LinkedIn DOM: page detect, extractors, SPA routing |
| `popup/` | Toolbar popup: login, stats, quick actions |
| `sidepanel/` | Primary AI workspace shell |
| `services/` | API, auth, storage, messaging |
| `store/` | Redux: auth, user, linkedin, ui |

## Backend APIs

- `GET /api/extension/me`
- `GET /api/extension/settings`
- `POST /api/extension/activity`
- `POST /api/extension/heartbeat`

Start the API: `npm run dev:server` (port 5000).

## Debug mode

Set `import.meta.env.DEV` — logs to console and `chrome.storage.local.debug_logs`.
