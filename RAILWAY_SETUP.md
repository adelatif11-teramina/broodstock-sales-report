# Railway PostgreSQL Setup Guide

## Step 1: Get Railway Database Connection Details

1. Go to your Railway project dashboard
2. Navigate to your PostgreSQL service
3. Go to the "Connect" tab
4. Copy the `DATABASE_URL` connection string

It should look like:
```
postgresql://postgres:[password]@[host]:[port]/railway
```

## Step 2: Update Environment Variables

Replace the placeholder in `backend/.env`:

```bash
# Replace this line:
DATABASE_URL=postgresql://postgres:password@your-railway-host.railway.app:5432/railway

# With your actual Railway connection string:
DATABASE_URL=postgresql://postgres:[your-actual-password]@[your-actual-host]:[port]/railway
```

## Step 3: Verify PostGIS Extension

Railway PostgreSQL should have PostGIS available. If not, you may need to:
1. Connect to your Railway database using `psql` or a GUI tool
2. Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

## Step 4: Run Migrations

Once the environment is configured:

```bash
cd backend
npm run migrate:status    # Check current migration status
npm run migrate:run       # Run all pending migrations
```

## Step 5: Test Connection

Start the backend server to test the connection:

```bash
cd backend
npm run dev
```

You should see:
- ✅ Database connected successfully
- ✅ PostGIS extension available: [version]

## Step 6: Seed Sample Data

After migrations are successful:

```bash
# This will be our next step
npm run seed    # (we'll create this script)
```

## Troubleshooting

### SSL Connection Issues
If you get SSL errors, the configuration is already set to handle Railway's SSL requirements.

### Connection Timeout
- Check that your Railway service is running
- Verify the connection string is correct
- Ensure your IP is not blocked (Railway is usually open)

### PostGIS Not Available
If PostGIS extension is missing:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Next Steps After Railway Setup

1. ✅ Environment variables configured
2. ✅ Database connection working  
3. ✅ Migrations completed
4. 🔄 Seed sample data
5. 🔄 Test API endpoints
6. 🔄 Start frontend development server
7. 🔄 Test full-stack integration