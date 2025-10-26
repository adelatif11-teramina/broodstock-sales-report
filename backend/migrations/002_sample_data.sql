-- Insert sample users (default password: Shrimp123!)
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

-- Insert sample customers with locations
INSERT INTO customers (name, primary_contact_name, primary_contact_phone, email, address_text, location, country, province, district, status, credentials, created_by) VALUES 
(
    'Coastal Aquaculture Ltd.', 
    'Roberto Silva', 
    '+66-2-555-0123', 
    'roberto@coastal-aqua.com',
    '123 Harbor Drive, Samut Prakan, Thailand',
    ST_SetSRID(ST_MakePoint(100.5918, 13.5993), 4326), -- Bangkok area
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
    ST_SetSRID(ST_MakePoint(120.9819, 14.4818), 4326), -- Manila area
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
    ST_SetSRID(ST_MakePoint(105.7851, 10.0359), 4326), -- Can Tho
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
    ST_SetSRID(ST_MakePoint(106.8451, -6.2088), 4326), -- Jakarta
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
);
