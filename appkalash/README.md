# TeamStock Pro

Production-ready, fully local, self-contained team inventory and sales app with real-time updates.

**Now with PWA support** — Install on mobile as a native app!  
**Ready for Render deployment** — Single-server, free tier compatible!

## Tech Stack

- Backend: Node.js 18+, Express, JSON file DB (./data/db.json), JWT, bcrypt, Socket.io
- Frontend: React 18, Vite, Tailwind CSS
- PWA: Service Worker, Web App Manifest, offline support
- Deployment: Render-ready (single server, free tier)

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:4000

### Production Build (Local Testing)

```bash
npm run build
NODE_ENV=production npm start
```

Visit http://localhost:4000 (server serves React build)

### Deploy to Render

See **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** for complete deployment guide.

**Quick steps:**

1. **Push to GitHub:** Create a new GitHub repository and push your code
2. **Create Render Web Service:** Connect your GitHub repo to a new Web Service
3. **Configure Build & Start:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Set Environment Variables:**
   - `NODE_ENV` = `production`
   - `RENDER` = `true`
   - `JWT_SECRET` = (generate a random 32+ char string)

**Free Tier Notes:**

- Apps go to sleep after 15 minutes of inactivity (first request may be slow)
- Database persists at `/opt/render/project/src/data/db.json`
- Cold starts take ~30 seconds — plan accordingly

See **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** for detailed deployment guide and troubleshooting.

## PWA Installation

### Android (Chrome)

1. Open the app in Chrome
2. Tap the menu icon (⋮)
3. Select "Install app" or "Add to Home Screen"
4. Tap "Install"

### iOS (Safari)

1. Open the app in Safari
2. Tap the Share button (↑ at bottom)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

The app will work offline and cache assets automatically.

## Demo Data

`data/db.json` includes a sample team and product.

- Team code: `123456`
- Leader username: `leader`
- Leader password: `password`
- Profit PIN: `1234`

## Core Flows

- Leader creates team (auto 6-digit string team code).
- Members join with team code (server validates) and enter pending status.
- Leader approves members.
- Login uses username + password only.

## Mobile Features

- Touch-friendly buttons (min 44px height)
- Responsive layout for phones to tablets
- Safe area support for notched devices
- Service Worker for offline access
- Optimized for both portrait and landscape

## Notes & Decisions

- JSON file database at `./data/db.json` is the only source of truth.
- Team codes are stored and compared as strings.
- Realtime updates use Socket.io events for team messages and product updates.
- PWA icons are SVG placeholders — replace with proper design assets in `client/public/icon-*.svg`
- **Production deployment**: Database persists at `/opt/render/project/src/data/db.json` on Render
- **Single server deployment**: Frontend and backend run on same URL in production
- **Environment detection**: Uses `NODE_ENV=production` to enable production mode

## Architecture

### Development Mode

- Client: Vite dev server on port 5173
- Server: Express on port 4000
- CORS: Allows localhost:5173
- Socket.io: Connects to localhost:4000
- Database: ./data/db.json

### Production Mode (Render)

- Server: Express on dynamic port (process.env.PORT)
- Client: Served from server as static files (client/dist)
- CORS: Allows same origin
- Socket.io: Same origin connection
- Database: /opt/render/project/src/data/db.json (persistent)
- Single URL: https://your-app.onrender.com

## Files Modified for Deployment

- `server/server.js` — Static file serving, catch-all route, production CORS, Render DB path
- `server/socket.js` — Production CORS for Socket.io
- `client/src/context/AuthContext.jsx` — Dynamic API base URL (same origin in prod)
- `package.json` — Deployment scripts (build, start, postinstall)

## Deployment Checklist

- [x] Static file serving configured
- [x] Catch-all route for React Router
- [x] CORS configured for production
- [x] Socket.io production-ready
- [x] Environment-based DB path
- [x] Dynamic PORT handling
- [x] Build scripts ready
- [x] PWA manifest and service worker
- [x] Documentation complete
