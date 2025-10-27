# Production Deployment Guide

## Prerequisites

### 1. Railway Account Setup
- Create account at [railway.app](https://railway.app)
- Install Railway CLI: `npm install -g @railway/cli`
- Login: `railway login`

### 2. GitHub Secrets Configuration
Required secrets for CI/CD pipeline:
```
RAILWAY_TOKEN=your_railway_token
```

## Deployment Steps

### 1. Environment Configuration

#### Backend (.env)
```bash
# Copy production template
cp backend/.env.production.example backend/.env

# Edit with your actual values:
# - DATABASE_URL (Railway will provide this)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - JWT_REFRESH_SECRET (generate with: openssl rand -base64 32)
# - AWS S3 credentials (if using S3 storage)
# - API keys for external services
```

#### Frontend (.env.local)
```bash
# Copy production template
cp frontend/.env.production.example frontend/.env.local

# Edit with your actual values:
# - NEXT_PUBLIC_API_URL (your Railway backend URL)
# - Map API keys
# - Analytics tracking IDs
```

### 2. Database Setup

#### Create Railway PostgreSQL Database
```bash
railway add postgresql
railway run --service postgresql psql
```

#### Run Migrations
```bash
# Connect to Railway database
railway connect postgresql

# Run migration scripts
\i backend/migrations/001_initial_setup.sql
\i backend/migrations/002_sample_data.sql
```

### 3. Deploy Backend
```bash
cd backend
railway up
```

### 4. Deploy Frontend
```bash
cd frontend
railway up
```

### 5. Configure Custom Domains (Optional)
```bash
railway domain add your-domain.com
```

## Environment Variables

### Critical Production Variables

#### Backend
- `DATABASE_URL`: Railway PostgreSQL connection string
- `JWT_SECRET`: 256-bit secret key for authentication
- `JWT_REFRESH_SECRET`: 256-bit secret key for refresh tokens
- `CORS_ORIGIN`: Your frontend domain
- `NODE_ENV=production`

#### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NODE_ENV=production`

### Optional Enhancements
- `S3_*`: AWS S3 for file storage
- `SENTRY_DSN`: Error tracking
- `GEOCODING_API_KEY`: Address geocoding
- Map service API keys

## Security Checklist

- [ ] All environment variables use production values
- [ ] JWT secrets are cryptographically secure (32+ bytes)
- [ ] Database connection uses SSL
- [ ] CORS is configured for production domains only
- [ ] File uploads are properly validated
- [ ] API rate limiting is enabled
- [ ] Error messages don't expose sensitive information

## Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend.railway.app/health`
- Frontend: `https://your-frontend.railway.app/api/health`

### Logs
```bash
railway logs --service backend
railway logs --service frontend
```

### Database Backup
```bash
railway connect postgresql
pg_dump railway > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify Railway PostgreSQL service is running
   - Ensure SSL connection is enabled

2. **CORS Errors**
   - Update CORS_ORIGIN to match frontend domain
   - Check both HTTP and HTTPS protocols

3. **Build Failures**
   - Verify all dependencies in package.json
   - Check Node.js version compatibility
   - Ensure environment variables are set

4. **Authentication Issues**
   - Verify JWT secrets are properly set
   - Check token expiration times
   - Validate CORS configuration

## Rollback Procedure

### Quick Rollback
```bash
railway rollback --service backend
railway rollback --service frontend
```

### Database Rollback
```bash
railway connect postgresql
\i backup_YYYYMMDD.sql
```