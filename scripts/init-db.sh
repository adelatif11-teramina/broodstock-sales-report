#!/bin/bash
set -e

# This script runs when the PostgreSQL container starts for the first time
# It ensures PostGIS extension is available

echo "Initializing PostGIS database..."

# Connect to the default postgres database and create our application database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Verify PostGIS installation
    SELECT PostGIS_Version();
EOSQL

echo "PostGIS database initialization completed."