-- Initialize Abyss Central Database
-- This script creates the necessary databases for each service

-- Create databases for each service
CREATE DATABASE IF NOT EXISTS abyss_auth;
CREATE DATABASE IF NOT EXISTS abyss_inventory;
CREATE DATABASE IF NOT EXISTS abyss_orders;
CREATE DATABASE IF NOT EXISTS abyss_analytics;

-- Grant privileges to the abyss user
GRANT ALL PRIVILEGES ON DATABASE abyss_auth TO abyss;
GRANT ALL PRIVILEGES ON DATABASE abyss_inventory TO abyss;
GRANT ALL PRIVILEGES ON DATABASE abyss_orders TO abyss;
GRANT ALL PRIVILEGES ON DATABASE abyss_analytics TO abyss;

-- Create extensions
\c abyss_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c abyss_inventory;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c abyss_orders;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c abyss_analytics;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;