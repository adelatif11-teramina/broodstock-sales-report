-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('viewer', 'editor', 'manager', 'admin');
CREATE TYPE customer_status AS ENUM ('active', 'paused', 'blacklisted');
CREATE TYPE shipment_status AS ENUM ('pending', 'shipped', 'delivered', 'problem');
CREATE TYPE quality_flag AS ENUM ('ok', 'minor_issue', 'critical_issue');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE credential_type AS ENUM ('license', 'permit', 'certificate', 'registration');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- BroodstockBatch table
CREATE TABLE broodstock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    hatchery_origin VARCHAR(255) NOT NULL,
    grade VARCHAR(100),
    arrival_date DATE NOT NULL,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_broodstock_batches_updated_at 
    BEFORE UPDATE ON broodstock_batches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_contact_name VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    email VARCHAR(255),
    address_text TEXT,
    location GEOMETRY(POINT, 4326), -- PostGIS point for lat/lng
    country VARCHAR(100),
    province VARCHAR(100),
    district VARCHAR(100),
    status customer_status NOT NULL DEFAULT 'active',
    credentials JSONB, -- Array of credential objects
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for location
CREATE INDEX idx_customers_location ON customers USING GIST (location);

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    broodstock_batch_id UUID REFERENCES broodstock_batches(id),
    order_date DATE NOT NULL,
    species VARCHAR(255) NOT NULL,
    strain VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    unit_price DECIMAL(10,2) NOT NULL,
    total_value_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_value DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'piece',
    packaging_type VARCHAR(100),
    shipment_date DATE, -- planned shipment date
    shipped_date DATE, -- actual shipment date
    shipment_status shipment_status NOT NULL DEFAULT 'pending',
    quality_flag quality_flag NOT NULL DEFAULT 'ok',
    mortality_reported INTEGER DEFAULT 0,
    test_results JSONB, -- Array of test objects
    files JSONB, -- Array of file objects (invoices, photos, certificates)
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_orders_shipment_status ON orders (shipment_status);
CREATE INDEX idx_orders_species ON orders (species);

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    issued_date DATE NOT NULL,
    paid_date DATE,
    payment_method VARCHAR(100),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_order_id ON invoices (order_id);
CREATE INDEX idx_invoices_status ON invoices (status);

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL, -- 'customer', 'order', 'invoice', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    user_id UUID REFERENCES users(id),
    changes JSONB, -- The actual changes made (diff)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);

-- Function to automatically create audit logs
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    entity_type_val TEXT;
    changes_val JSONB;
BEGIN
    -- Get the table name as entity type
    entity_type_val := TG_TABLE_NAME;
    
    -- Create changes object based on operation
    IF TG_OP = 'DELETE' THEN
        changes_val := to_jsonb(OLD);
        INSERT INTO audit_logs (entity_type, entity_id, action, changes)
        VALUES (entity_type_val, OLD.id, 'delete', changes_val);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        changes_val := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
        INSERT INTO audit_logs (entity_type, entity_id, action, changes)
        VALUES (entity_type_val, NEW.id, 'update', changes_val);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        changes_val := to_jsonb(NEW);
        INSERT INTO audit_logs (entity_type, entity_id, action, changes)
        VALUES (entity_type_val, NEW.id, 'create', changes_val);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to main tables
CREATE TRIGGER audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_broodstock_batches
    AFTER INSERT OR UPDATE OR DELETE ON broodstock_batches
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();