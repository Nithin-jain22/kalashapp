# Pre-Deployment Verification Checklist

Use this checklist before deploying to Render.

## ✅ Code Changes

- [x] Root package.json has `build`, `start`, and `postinstall` scripts
- [x] server/server.js serves static files in production
- [x] server/server.js has catch-all route for React Router
- [x] server/server.js uses Render-compatible DB path (`/opt/render/project/src/data/db.json`)
- [x] server/server.js handles `process.env.PORT`
- [x] server/server.js has production CORS configuration
- [x] server/socket.js has production CORS configuration
- [x] client/src/context/AuthContext.jsx uses dynamic API URL

## ✅ Local Testing

### Development Mode

- [x] `npm install` completes successfully
- [x] `npm run dev` starts both servers
- [x] Client loads at http://localhost:5173
- [x] Server responds at http://localhost:4000
- [x] Login works
- [x] Team creation works
- [x] PWA features work

### Production Mode

- [x] `npm run build` completes without errors
- [x] Build creates `client/dist` folder
- [x] `NODE_ENV=production npm start` works
- [x] Server serves React app at http://localhost:4000
- [x] All routes work (/, /login, /products, /sales, etc.)
- [x] API endpoints work (/api/health, /api/auth/login, etc.)
- [x] Health check shows production environment

## ✅ Documentation

- [x] README.md updated with deployment section
- [x] RENDER_DEPLOYMENT.md created with complete guide
- [x] DEPLOYMENT_SUMMARY.md created with technical details
- [x] PWA_NOTES.md exists with PWA implementation details

## ✅ Git Repository

- [ ] All changes committed
- [ ] Repository pushed to GitHub
- [ ] .gitignore excludes node_modules and client/dist
- [ ] Repository is public or Render has access

## 📋 Render Configuration Checklist

### Service Setup

- [ ] GitHub repository connected
- [ ] Branch: `main`
- [ ] Build Command: `npm run build`
- [ ] Start Command: `npm start`
- [ ] Plan: Free (or higher)
- [ ] Auto-Deploy: Enabled (optional)

### Environment Variables

- [ ] `NODE_ENV` = `production`
- [ ] `RENDER` = `true`
- [ ] `JWT_SECRET` = `<secure-random-string>` (generate with: `openssl rand -base64 32`)
- [ ] `CLIENT_URL` = `https://your-app.onrender.com` (optional)

### After Deployment

- [ ] Build logs show no errors
- [ ] Service is running
- [ ] Health check passes: `curl https://your-app.onrender.com/api/health`
- [ ] Login page loads
- [ ] Can create team
- [ ] Can join team
- [ ] Can login
- [ ] PWA installable on mobile
- [ ] Socket.io connects (test real-time messages)

## 🔧 Pre-Flight Commands

Run these locally before deploying:

```bash
# 1. Clean install
rm -rf node_modules client/node_modules server/node_modules
npm install

# 2. Build
npm run build

# 3. Test production locally
NODE_ENV=production npm start
# Visit http://localhost:4000

# 4. Test health endpoint
curl http://localhost:4000/api/health
# Should return: {"status":"ok","env":"production","dbPath":"..."}

# 5. Commit and push
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## ⚠️ Important Notes

### Database Persistence

- Render free tier provides `/opt/render/project/src` for persistent storage
- Database persists across deploys
- Database may be lost if service is deleted
- Consider manual backups for production use

### Cold Starts

- Free tier spins down after 15 minutes inactivity
- First request after sleep takes 30-60 seconds
- Paid tier eliminates cold starts

### Single Server Deployment

- Frontend and backend run on same URL
- No CORS issues in production (same origin)
- Simpler deployment than separate services

### PWA Requirements

- HTTPS required for PWA (Render provides this)
- Service Worker requires HTTPS (works on Render)
- Manifest must be accessible

## 🚨 Common Issues

### Build fails

- **Error**: "Cannot find module"
  - **Fix**: Check package.json dependencies
- **Error**: "Build timeout"
  - **Fix**: Reduce build time or upgrade plan

### App doesn't load

- **Error**: White screen
  - **Fix**: Check catch-all route in server.js
- **Error**: 404 on routes
  - **Fix**: Verify static file serving is enabled

### Database issues

- **Error**: "Cannot read db.json"
  - **Fix**: Ensure `RENDER=true` is set
  - **Fix**: Check DB_PATH in health endpoint

### Socket.io doesn't connect

- **Error**: WebSocket connection fails
  - **Fix**: Check CORS configuration
  - **Fix**: Verify Socket.io production config

## ✅ Success Criteria

Deployment is successful when:

1. ✅ Health check returns: `{"status":"ok","env":"production"}`
2. ✅ Login page loads correctly
3. ✅ Can create a new team
4. ✅ Can join a team with code
5. ✅ Can login with credentials
6. ✅ Products page shows correctly
7. ✅ PWA "Add to Home Screen" appears on mobile
8. ✅ Real-time messages work (Socket.io)
9. ✅ Data persists across page reloads
10. ✅ All routes work (no 404s)

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com
- **Project README**: See README.md for feature documentation
- **Deployment Guide**: See RENDER_DEPLOYMENT.md for detailed steps

---

**Last Updated**: February 2026  
**Deployment Target**: Render Free Tier  
**Database**: JSON file (persistent on Render)
