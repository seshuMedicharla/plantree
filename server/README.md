# PlanTree API

## MongoDB Atlas setup

The API uses MongoDB Atlas. Planting coordinates use a MongoDB `2dsphere` index for GPS radius checks.

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow your IP address in Atlas Network Access.
4. Copy the Node.js connection string into `.env`.
5. Build indexes:

```bash
npm run db:indexes
```

Example:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=plantree
```

The index setup creates required indexes and starter badge definitions. It does not create demo users, posts, plantings, or zones.

## Run API

```bash
npm run dev:api
```
