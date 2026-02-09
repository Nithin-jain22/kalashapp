# Render Deployment Guide for TeamStock Pro

## Overview

This guide explains how to deploy TeamStock Pro to Render's free tier as a single-server application serving both backend and frontend.

## Prerequisites

- GitHub account (to connect your repository to Render)
- Render account (free tier: https://render.com)
- Git installed locally

## Pre-Deployment Checklist

✅ All changes committed to Git  
✅ Repository pushed to GitHub  
✅ Local build tested: `npm run build`  
✅ Local production mode tested (see below)

## Step 1: Prepare Repository

1. **Create a GitHub repository** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Prepare for Render deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/teamstock-pro.git
   git push -u origin main
   ```

2. **Ensure `.gitignore` excludes**:
   ```
   node_modules/
   client/dist/
   .env
   ```

## Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `teamstock-pro` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses repo root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

   **Advanced Settings:**
   - **Plan**: `Free`
   - **Auto-Deploy**: `Yes` (optional, redeploys on git push)

## Step 3: Environment Variables

Add these in Render dashboard under **Environment**:

| Key          | Value                       | Notes                          |
| ------------ | --------------------------- | ------------------------------ |
| `NODE_ENV`   | `production`                | Required for production mode   |
| `JWT_SECRET` | `your-secure-random-string` | Change from default!           |
| `RENDER`     | `true`                      | Triggers Render-specific paths |

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

## Step 4: Database Persistence

Render free tier provides persistent storage at `/opt/render/project/src`.

The app automatically uses this path when `RENDER=true`:

```javascript
// Configured in server/server.js
const DB_PATH = process.env.RENDER
  ? "/opt/render/project/src/data/db.json"
  : path.resolve(__dirname, "../data/db.json");
```

**Initial database setup:**

- The `data/db.json` file will be copied during build
- Data persists across deploys on Render free tier
- To reset database, delete and redeploy

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (3-5 minutes)
3. Render will show your app URL: `https://teamstock-pro.onrender.com`

## Step 6: Verify Deployment

1. Visit your Render URL
2. Test health endpoint: `https://your-app.onrender.com/api/health`
3. Should return: `{"status":"ok","env":"production","dbPath":"/opt/render/project/src/data/db.json"}`
4. Test login with demo credentials (see README.md)
5. Test PWA installation on mobile

## Troubleshooting

### Build fails

- Check Render build logs
- Ensure `package.json` has correct scripts
- Verify Node version compatibility (18+)

### App runs but shows errors

- Check Render service logs
- Verify environment variables are set
- Check `/api/health` endpoint response

### Database not persisting

- Verify `RENDER=true` in environment variables
- Check logs for DB_PATH confirmation
- Free tier may reset disk on service restart

### Socket.io not connecting

- Ensure CORS is configured for production
- Check browser console for WebSocket errors
- Verify Render URL matches your domain

### PWA not installing

- Ensure manifest.json is served correctly
- Check service worker registration
- Test on actual mobile device (not just emulator)

## Local Production Testing

Test production build locally before deploying:

```bash
# Build the app
npm run build

# Set environment to production
export NODE_ENV=production

# Start server (serves built frontend)
npm start

# Visit http://localhost:4000
```

The server will serve the React build from `client/dist`.

## Render Free Tier Limitations

⚠️ **Important Free Tier Constraints:**

- **Cold starts**: Service spins down after 15 minutes of inactivity
- **First request**: May take 30-60 seconds to wake up
- **Disk persistence**: Limited, data may be lost on service restart
- **Build time**: Limited to 15 minutes
- **Monthly hours**: 750 hours/month (always-on requires paid tier)

**For production use**, consider upgrading to paid tier for:

- No cold starts
- Guaranteed persistence
- Custom domains with SSL
- More resources

## Upgrading to Paid Tier

Benefits:

- Always online (no cold starts)
- Persistent disk guaranteed
- Custom domain support
- More memory and CPU

Steps:

1. Go to Render dashboard
2. Select your service
3. Click "Upgrade"
4. Choose plan (starts at $7/month)

## Custom Domain (Paid Tier)

1. In Render dashboard: **Settings** → **Custom Domain**
2. Add your domain: `app.yourdomain.com`
3. Update DNS records as instructed
4. Render auto-provisions SSL certificate

Update environment variable:

- `CLIENT_URL`: `https://app.yourdomain.com`

## Monitoring

**Render Dashboard:**

- View logs: **Logs** tab
- Check metrics: **Metrics** tab
- Monitor disk usage: **Environment** tab

**Health Checks:**

- Render pings `/api/health` automatically
- Service restarts if health check fails

## Backup & Recovery

**Backup database:**

```bash
# Download from Render shell (if available in paid tier)
curl https://your-app.onrender.com/api/backup
```

**Manual backup** (requires API endpoint):

- Add `/api/backup` route in server.js
- Download `db.json` periodically

**Restore:**

- Update `data/db.json` in repo
- Redeploy

## CI/CD Integration

**Auto-deploy on push:**

1. Enable in Render: **Settings** → **Auto-Deploy**: `Yes`
2. Push to GitHub `main` branch
3. Render automatically rebuilds and deploys

**Deploy notifications:**

- Configure in **Settings** → **Notifications**
- Options: Email, Slack, Discord

## Security Best Practices

✅ Use strong JWT_SECRET (32+ characters)  
✅ Enable HTTPS (automatic on Render)  
✅ Rotate secrets periodically  
✅ Never commit `.env` files  
✅ Review Render access logs

## Cost Optimization

**Free Tier Tips:**

- Deploy during low-traffic periods
- Use caching aggressively
- Monitor build times
- Consider serverless for very low traffic

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: Create issue in your repo

---

## Quick Reference

**Build locally:**

```bash
npm run build
```

**Start production server locally:**

```bash
NODE_ENV=production npm start
```

**Deploy to Render:**

1. Push to GitHub
2. Render auto-deploys (if enabled)

**Check deployment:**

```bash
curl https://your-app.onrender.com/api/health
```

---

**Last Updated**: February 2026  
**Render Free Tier**: Yes  
**Database**: JSON file (persistent on Render at `/opt/render/project/src/data/db.json`)
