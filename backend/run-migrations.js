const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: 'postgresql://postgres:manosKAGptGPXULSkktQDBMdButFToAY@mainline.proxy.rlwy.net:30366/railway',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if tables exist, skip initial setup if they do
    const tablesCheck = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
    
    if (tablesCheck.rows.length === 0) {
      // Tables don't exist, run initial setup
      const migration1 = `-- Modified migration without PostGIS for Railway deployment
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

-- Customers table (using lat/lng columns instead of PostGIS GEOMETRY)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_contact_name VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    email VARCHAR(255),
    address_text TEXT,
    latitude DECIMAL(10, 8), -- latitude coordinate
    longitude DECIMAL(11, 8), -- longitude coordinate
    country VARCHAR(100),
    province VARCHAR(100),
    district VARCHAR(100),
    status customer_status NOT NULL DEFAULT 'active',
    credentials JSONB, -- Array of credential objects
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for location queries
CREATE INDEX idx_customers_lat_lng ON customers (latitude, longitude);

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
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();`;
      console.log('Running initial setup migration...');
      await client.query(migration1);
      console.log('Initial setup completed');
    } else {
      console.log('Tables already exist, skipping initial setup');
    }

    // Read and execute sample data migration (modified for lat/lng columns)
    const migration2 = `-- Insert sample users (default password: Shrimp123!)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@broodstock.com', '$2b$12$5ramTzRcvgenTc1oigWZoemby/p/R3RuAuMD4E.nhUc8g/iGELb5K', 'admin'),
('John Manager', 'john@broodstock.com', '$2b$12$5ramTzRcvgenTc1oigWZoemby/p/R3RuAuMD4E.nhUc8g/iGELb5K', 'manager'),
('Jane Editor', 'jane@broodstock.com', '$2b$12$5ramTzRcvgenTc1oigWZoemby/p/R3RuAuMD4E.nhUc8g/iGELb5K', 'editor'),
('Mike Viewer', 'mike@broodstock.com', '$2b$12$5ramTzRcvgenTc1oigWZoemby/p/R3RuAuMD4E.nhUc8g/iGELb5K', 'viewer');

-- Insert sample broodstock batches
INSERT INTO broodstock_batches (batch_code, hatchery_origin, grade, arrival_date, available_quantity) VALUES 
('BST-2024-001', 'Pacific Hatchery Co.', 'Premium', '2024-01-15', 500),
('BST-2024-002', 'Golden Coast Aqua', 'Standard', '2024-02-01', 300),
('BST-2024-003', 'Blue Waters Ltd.', 'Premium', '2024-02-15', 750),
('BST-2024-004', 'Ocean Harvest Inc.', 'Standard', '2024-03-01', 400);

-- Insert sample customers with lat/lng coordinates
INSERT INTO customers (name, primary_contact_name, primary_contact_phone, email, address_text, latitude, longitude, country, province, district, status, credentials, created_by) VALUES 
(
    'Coastal Aquaculture Ltd.', 
    'Roberto Silva', 
    '+66-2-555-0123', 
    'roberto@coastal-aqua.com',
    '123 Harbor Drive, Samut Prakan, Thailand',
    13.5993, -- Bangkok area latitude
    100.5918, -- Bangkok area longitude
    'Thailand',
    'Samut Prakan',
    'Muang',
    'active',
    '[
        {
            "type": "license",
            "number": "AQ-TH-2024-001",
            "issued_date": "2024-01-01",
            "expiry_date": "2025-01-01",
            "file_url": "https://example.com/cert1.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'Manila Shrimp Farms', 
    'Maria Santos', 
    '+63-2-555-0456', 
    'maria@manila-shrimp.ph',
    '456 Coastal Road, Cavite, Philippines',
    14.4818, -- Manila area latitude
    120.9819, -- Manila area longitude
    'Philippines',
    'Cavite',
    'Bacoor',
    'active',
    '[
        {
            "type": "permit",
            "number": "SH-PH-2024-002",
            "issued_date": "2024-02-01",
            "expiry_date": "2025-02-01",
            "file_url": "https://example.com/cert2.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'Vietnam Aqua Solutions', 
    'Nguyen Van Duc', 
    '+84-28-555-0789', 
    'duc@vn-aqua.vn',
    '789 Delta Street, Can Tho, Vietnam',
    10.0359, -- Can Tho latitude
    105.7851, -- Can Tho longitude
    'Vietnam',
    'Can Tho',
    'Ninh Kieu',
    'active',
    '[
        {
            "type": "license",
            "number": "AQ-VN-2024-003",
            "issued_date": "2024-01-15",
            "expiry_date": "2024-12-15",
            "file_url": "https://example.com/cert3.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'Indonesian Marine Exports', 
    'Siti Rahayu', 
    '+62-21-555-0321', 
    'siti@indo-marine.id',
    '321 Port Boulevard, Jakarta, Indonesia',
    -6.2088, -- Jakarta latitude
    106.8451, -- Jakarta longitude
    'Indonesia',
    'Jakarta',
    'North Jakarta',
    'paused',
    '[
        {
            "type": "certificate",
            "number": "EX-ID-2024-004",
            "issued_date": "2024-03-01",
            "expiry_date": "2025-03-01",
            "file_url": "https://example.com/cert4.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
);

-- Insert sample orders
INSERT INTO orders (
    order_number, customer_id, broodstock_batch_id, order_date, species, strain, 
    quantity, unit_price, total_value, shipment_date, shipment_status, 
    quality_flag, notes, created_by
) VALUES 
(
    'ORD-2024-001',
    (SELECT id FROM customers WHERE name = 'Coastal Aquaculture Ltd.'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-001'),
    '2024-09-01',
    'Penaeus monodon',
    'Black Tiger Premium',
    100,
    25.50,
    2550.00,
    '2024-09-15',
    'delivered',
    'ok',
    'High priority order for premium customer',
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'ORD-2024-002',
    (SELECT id FROM customers WHERE name = 'Manila Shrimp Farms'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-002'),
    '2024-09-05',
    'Penaeus vannamei',
    'White Shrimp Standard',
    150,
    18.75,
    2812.50,
    '2024-09-20',
    'shipped',
    'ok',
    'Regular monthly order',
    (SELECT id FROM users WHERE email = 'jane@broodstock.com')
),
(
    'ORD-2024-003',
    (SELECT id FROM customers WHERE name = 'Vietnam Aqua Solutions'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-003'),
    '2024-09-10',
    'Penaeus monodon',
    'Black Tiger Premium',
    200,
    25.50,
    5100.00,
    '2024-09-25',
    'pending',
    'ok',
    'Large order for farm expansion',
    (SELECT id FROM users WHERE email = 'jane@broodstock.com')
),
(
    'ORD-2024-004',
    (SELECT id FROM customers WHERE name = 'Indonesian Marine Exports'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-004'),
    '2024-09-12',
    'Penaeus vannamei',
    'White Shrimp Standard',
    75,
    18.75,
    1406.25,
    '2024-09-28',
    'pending',
    'minor_issue',
    'Customer requested specific packaging',
    (SELECT id FROM users WHERE email = 'jane@broodstock.com')
);

-- Insert sample invoices
INSERT INTO invoices (order_id, amount, currency, status, issued_date, paid_date, payment_method) VALUES 
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-001'),
    2550.00,
    'USD',
    'paid',
    '2024-09-01',
    '2024-09-08',
    'Bank Transfer'
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-002'),
    2812.50,
    'USD',
    'paid',
    '2024-09-05',
    '2024-09-12',
    'Credit Card'
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-003'),
    5100.00,
    'USD',
    'pending',
    '2024-09-10',
    NULL,
    NULL
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-004'),
    1406.25,
    'USD',
    'pending',
    '2024-09-12',
    NULL,
    NULL
);`;
    console.log('Running sample data migration...');
    await client.query(migration2);
    console.log('Sample data inserted');

    // Verify tables were created
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables created:');
    result.rows.forEach(row => console.log('- ' + row.table_name));

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

runMigrations();