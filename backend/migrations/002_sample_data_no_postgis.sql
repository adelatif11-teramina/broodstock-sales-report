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

-- Insert Indonesian sample customers with lat/lng coordinates
INSERT INTO customers (name, primary_contact_name, primary_contact_phone, email, address_text, latitude, longitude, country, province, district, status, credentials, created_by) VALUES 
(
    'PT Aquafarm Nusantara',
    'Budi Santoso',
    '+62-21-8520-3456',
    'budi@aquafarmnusantara.id',
    'Jl. Gatot Subroto No. 45, Jakarta Selatan',
    -6.2088,
    106.8456,
    'Indonesia',
    'DKI Jakarta',
    'Jakarta Selatan',
    'active',
    '[
        {
            "type": "license",
            "number": "SIUP-001",
            "issued_date": "2024-01-01",
            "expiry_date": "2025-01-01",
            "file_url": "https://example.com/cert1.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'CV Udang Jaya Surabaya',
    'Siti Rahayu',
    '+62-31-567-8901',
    'siti@udangjaya.co.id',
    'Jl. Raya Kenjeran No. 123, Surabaya',
    -7.2575,
    112.7521,
    'Indonesia',
    'Jawa Timur',
    'Surabaya',
    'active',
    '[
        {
            "type": "permit",
            "number": "IUK-002",
            "issued_date": "2024-02-01",
            "expiry_date": "2025-02-01",
            "file_url": "https://example.com/cert2.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'PT Shrimp Indonesia Sejahtera',
    'Agus Wijaya',
    '+62-361-234-5678',
    'agus@shrimpindonesia.id',
    'Jl. Bypass Ngurah Rai, Denpasar, Bali',
    -8.6500,
    115.2167,
    'Indonesia',
    'Bali',
    'Denpasar',
    'active',
    '[
        {
            "type": "certificate",
            "number": "HAL-003",
            "issued_date": "2023-12-01",
            "expiry_date": "2024-12-01",
            "file_url": "https://example.com/cert3.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'Tambak Windu Lampung',
    'Dedi Kurniawan',
    '+62-721-456-7890',
    'dedi@tambakwindu.id',
    'Jl. Soekarno-Hatta KM 15, Bandar Lampung',
    -5.3971,
    105.2668,
    'Indonesia',
    'Lampung',
    'Bandar Lampung',
    'active',
    '[
        {
            "type": "license",
            "number": "SIUP-004",
            "issued_date": "2024-01-15",
            "expiry_date": "2025-01-15",
            "file_url": "https://example.com/cert4.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'PT Aqua Marine Medan',
    'Rahman Hakim',
    '+62-61-789-0123',
    'rahman@aquamarine-medan.co.id',
    'Jl. Sisingamangaraja No. 88, Medan',
    3.5952,
    98.6722,
    'Indonesia',
    'Sumatera Utara',
    'Medan',
    'paused',
    '[
        {
            "type": "permit",
            "number": "ILK-005",
            "issued_date": "2023-06-01",
            "expiry_date": "2024-06-01",
            "file_url": "https://example.com/cert5.pdf"
        }
    ]'::jsonb,
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
);

-- Insert sample orders
INSERT INTO orders (order_number, customer_id, broodstock_batch_id, order_date, species, strain, quantity, unit_price, total_value, unit, packaging_type, shipment_status, created_by) VALUES 
(
    'ORD-2024-001',
    (SELECT id FROM customers WHERE email = 'budi@aquafarmnusantara.id'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-001'),
    '2024-03-01',
    'Penaeus vannamei',
    'High Growth',
    100,
    12.50,
    1250.00,
    'piece',
    'Oxygenated bags',
    'delivered',
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    'ORD-2024-002',
    (SELECT id FROM customers WHERE email = 'siti@udangjaya.co.id'),
    (SELECT id FROM broodstock_batches WHERE batch_code = 'BST-2024-002'),
    '2024-03-05',
    'Penaeus monodon',
    'Premium Black Tiger',
    75,
    15.00,
    1125.00,
    'piece',
    'Live transport tanks',
    'shipped',
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
);

-- Insert sample invoices
INSERT INTO invoices (order_id, invoice_number, invoice_date, due_date, subtotal, tax_rate, tax_amount, total_amount, payment_status, created_by) VALUES 
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-001'),
    'INV-2024-001',
    '2024-03-01',
    '2024-03-31',
    1250.00,
    0.1100,
    137.50,
    1387.50,
    'paid',
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
),
(
    (SELECT id FROM orders WHERE order_number = 'ORD-2024-002'),
    'INV-2024-002',
    '2024-03-05',
    '2024-04-04',
    1125.00,
    0.1100,
    123.75,
    1248.75,
    'pending',
    (SELECT id FROM users WHERE email = 'admin@broodstock.com')
);