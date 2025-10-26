-- Enable UUID extension
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

-- Customers table (without PostGIS)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_contact_name VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    email VARCHAR(255),
    address_text TEXT,
    latitude DECIMAL(10, 8), -- Store lat/lng as separate columns
    longitude DECIMAL(11, 8),
    country VARCHAR(100),
    province VARCHAR(100),
    district VARCHAR(100),
    status customer_status NOT NULL DEFAULT 'active',
    credentials JSONB, -- Array of credential objects
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for location
CREATE INDEX idx_customers_latitude ON customers (latitude);
CREATE INDEX idx_customers_longitude ON customers (longitude);

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
    delivery_date DATE, -- actual delivery date
    shipment_status shipment_status NOT NULL DEFAULT 'pending',
    tracking_number VARCHAR(255),
    quality_notes TEXT,
    quality_flag quality_flag NOT NULL DEFAULT 'ok',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    tax_amount_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_date DATE,
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs (changed_at);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_invoices_order_id ON invoices (order_id);
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_country ON customers (country);