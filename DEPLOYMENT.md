# PlanTree Deployment Checklist

## Required Environment Variables

Set these in your hosting provider before deploying:

```env
NODE_ENV=production
API_PORT=4000
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/?retryWrites=true&w=majority
MONGODB_DB_NAME=plantree
JWT_SECRET=use-a-new-strong-random-secret-at-least-32-chars
ADMIN_USERNAMES=seshum
CORS_ORIGIN=https://your-domain.com
VITE_API_BASE_URL=
VITE_USE_MOCK_API=false
IPGEOLOCATION_API_KEY=your-key
```

Use blank `VITE_API_BASE_URL` when the same server hosts both API and frontend.

## Commands

```bash
npm ci
npm run predeploy
npm start
```

`predeploy` builds the React app, compiles the API, and creates MongoDB indexes.

## Important Before Public Launch

- Rotate MongoDB Atlas password because credentials were used during local setup.
- Rotate third-party API keys that were shared during local setup.
- Add your deploy server IP to MongoDB Atlas Network Access.
- Use HTTPS. Mobile GPS requires HTTPS outside localhost.
- Configure persistent disk/storage for `server/uploads`, or move uploads to S3/Cloudinary before scaling.
- Set `CORS_ORIGIN` to your real frontend domain, not localhost.
- Keep `.env` out of git. Use provider environment variables.

## Production Output

- Frontend build: `dist`
- API build: `dist-server`
- Upload folder: `server/uploads`
