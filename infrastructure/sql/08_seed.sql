-- =============================================================
-- SmartMart Retail System - SEED DATA
-- File: 08_seed.sql
-- Runs automatically on first postgres container start
-- Plain-text passwords documented in: infrastructure/sql/SEED_CREDENTIALS.md
--
-- Password reference:
--   Admin accounts  → SmartMart@Admin2026
--   Employee logins → SmartMart@Emp2026
--   (bcrypt cost 10 hashes generated below)
-- =============================================================


-- =============================================================
-- 1. POS DATABASE
-- =============================================================
\c pos_db;

-- BRANCHES
INSERT INTO branches (branch_name, location, is_active) VALUES
  ('SmartMart Downtown',   'No.12, Anna Salai, Chennai',     TRUE),
  ('SmartMart Velachery',  'Plot 5, Velachery Main Rd, Chennai', TRUE),
  ('SmartMart Coimbatore', '45, Avinashi Rd, Coimbatore',    TRUE),
  ('SmartMart Madurai',    '22, Racecourse Rd, Madurai',     FALSE);

-- CUSTOMERS
INSERT INTO customers (first_name, last_name, phone, email, address, city, country, is_active) VALUES
  ('Arjun',    'Krishnan',   '9000000001', 'arjun.krishnan@email.com',   '10 Nungambakkam High Rd',   'Chennai',    'India', TRUE),
  ('Priya',    'Sundaram',   '9000000002', 'priya.sundaram@email.com',   '55 Anna Nagar West',         'Chennai',    'India', TRUE),
  ('Ramesh',   'Babu',       '9000000003', 'ramesh.babu@email.com',      '8 RS Puram',                 'Coimbatore', 'India', TRUE),
  ('Kavitha',  'Nair',       '9000000004', 'kavitha.nair@email.com',     '34 Mattuthavani',            'Madurai',    'India', TRUE),
  ('Suresh',   'Raj',        '9000000005', 'suresh.raj@email.com',       '101 Gandhipuram',            'Coimbatore', 'India', TRUE),
  ('Divya',    'Menon',      '9000000006', 'divya.menon@email.com',      '77 Besant Nagar',            'Chennai',    'India', TRUE),
  ('Venkat',   'Subramani',  '9000000007', 'venkat.subramani@email.com', '23 West Masi St',            'Madurai',    'India', TRUE),
  ('Anitha',   'Gopal',      '9000000008', 'anitha.gopal@email.com',     '14 Saibaba Colony',          'Coimbatore', 'India', TRUE),
  ('Karthik',  'Raj',        '9000000009', 'karthik.raj@email.com',      '9 Adyar Bridge Rd',          'Chennai',    'India', TRUE),
  ('Meena',    'Lakshmi',    '9000000010', 'meena.lakshmi@email.com',    '60 Palani Rd',               'Madurai',    'India', FALSE);

-- CUSTOMER FEEDBACK
INSERT INTO customer_feedback (customer_id, rating, comments) VALUES
  (1, 5, 'Excellent service and product quality!'),
  (2, 4, 'Good variety but billing was a bit slow.'),
  (3, 5, 'Very happy with my purchase.'),
  (4, 3, 'Average experience, staff could be more helpful.'),
  (5, 4, 'Nice store layout and easy to find products.');

-- SALES TRANSACTIONS  (processed_by = employee_id from hr_db, kept as integer)
INSERT INTO sales_transactions
  (branch_id, invoice_number, customer_id, total_amount, other_discount, tax_amount, transaction_status, processed_by)
VALUES
  (1, 'INV-100001', 1, 1500.00, 50.00,  180.00, 'COMPLETED', 1),
  (1, 'INV-100002', 2, 3200.00, 100.00, 384.00, 'COMPLETED', 2),
  (2, 'INV-100003', 3,  850.00,  0.00,  102.00, 'COMPLETED', 3),
  (2, 'INV-100004', 4, 5600.00, 200.00, 672.00, 'COMPLETED', 4),
  (3, 'INV-100005', 5, 2100.00,  75.00, 252.00, 'COMPLETED', 5),
  (1, 'INV-100006', 6,  450.00,  0.00,   54.00, 'CANCELLED', 1),
  (3, 'INV-100007', 7, 7800.00, 300.00, 936.00, 'COMPLETED', 6),
  (2, 'INV-100008', 8,  960.00,  30.00, 115.20, 'REFUNDED',  3);

-- SALES ITEMS  (product_id references inventory_db.products — cross-db denormalized)
INSERT INTO sales_items (transaction_id, product_id, batch_id, quantity_sold, selling_price, discount) VALUES
  (1, 1,  1, 2,  350.00,  0.00),
  (1, 3,  3, 1,  800.00, 50.00),
  (2, 5,  5, 3,  600.00,  0.00),
  (2, 7,  7, 2,  700.00,100.00),
  (3, 2,  2, 5,  170.00,  0.00),
  (4, 9,  9, 1, 5600.00,200.00),
  (5, 4,  4, 4,  525.00, 75.00),
  (7, 6,  6, 6,  800.00, 50.00),
  (8, 8,  8, 2,  480.00, 30.00);

-- PAYMENTS
INSERT INTO payments (transaction_id, payment_method, amount, payment_status, payment_reference) VALUES
  (1, 'UPI',         1630.00, 'SUCCESS', 'UPI-TXN-001'),
  (2, 'CREDIT_CARD', 3484.00, 'SUCCESS', 'CC-TXN-002'),
  (3, 'CASH',         952.00, 'SUCCESS', NULL),
  (4, 'DEBIT_CARD',  6072.00, 'SUCCESS', 'DC-TXN-004'),
  (5, 'WALLET',      2277.00, 'SUCCESS', 'WLT-TXN-005'),
  (6, 'CASH',         504.00, 'FAILED',  NULL),
  (7, 'UPI',         8436.00, 'SUCCESS', 'UPI-TXN-007'),
  (8, 'CREDIT_CARD', 1045.20, 'SUCCESS', 'CC-TXN-008');

-- REFUND TRANSACTIONS
INSERT INTO refund_transactions (original_transaction_id, refund_reason, refund_status) VALUES
  (8, 'Product damaged on delivery', 'FULL');

-- REFUND ITEMS
INSERT INTO refund_items (refund_id, product_id, batch_id, quantity_returned, refund_amount) VALUES
  (1, 8, 8, 2, 960.00);


-- =============================================================
-- 2. HR DATABASE
-- =============================================================
\c hr_db;

-- DEPARTMENTS
INSERT INTO departments (department_name) VALUES
  ('Store Operations'),
  ('Human Resources'),
  ('Finance & Accounts'),
  ('IT & Systems'),
  ('Procurement'),
  ('Inventory Management'),
  ('Sales & Marketing');

-- EMPLOYEES
-- Password: SmartMart@Emp2026
-- bcrypt hash (cost 10): $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O
INSERT INTO employees
  (branch_id, first_name, last_name, department_id, phone, email, address,
   dob, gender, emergency_contact, hire_date, status, password_hash,
   bank_account_number, bank_name, ifsc_code, account_holder_name, salary, allowed_leaves)
VALUES
-- Branch 1 – Downtown
  (1, 'Rajesh',   'Kumar',      1, '9100000001', 'rajesh.kumar@smartmart.com',    '12 Anna Salai, Chennai',
   '1990-06-15', 'Male',   '9100009901', '2020-01-10', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100001', 'State Bank of India', 'SBIN0001234', 'Rajesh Kumar',   45000.00, 12),

  (1, 'Deepa',    'Venkatesh',  2, '9100000002', 'deepa.venkatesh@smartmart.com', '4 Nungambakkam, Chennai',
   '1993-03-22', 'Female', '9100009902', '2021-03-01', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100002', 'HDFC Bank',           'HDFC0001234', 'Deepa Venkatesh', 42000.00, 12),

  (1, 'Muthu',    'Krishnan',   3, '9100000003', 'muthu.krishnan@smartmart.com',  '7 T Nagar, Chennai',
   '1988-11-05', 'Male',   '9100009903', '2019-07-15', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100003', 'ICICI Bank',          'ICIC0001234', 'Muthu Krishnan',  55000.00, 15),

-- Branch 2 – Velachery
  (2, 'Saranya',  'Rajan',      1, '9100000004', 'saranya.rajan@smartmart.com',   '22 Velachery Main Rd, Chennai',
   '1995-08-12', 'Female', '9100009904', '2022-01-20', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100004', 'Axis Bank',           'UTIB0001234', 'Saranya Rajan',   38000.00, 12),

  (2, 'Praveen',  'Selvaraj',   6, '9100000005', 'praveen.selvaraj@smartmart.com','10 Velachery, Chennai',
   '1991-01-30', 'Male',   '9100009905', '2020-09-01', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100005', 'Kotak Mahindra Bank', 'KKBK0001234', 'Praveen Selvaraj',40000.00, 12),

-- Branch 3 – Coimbatore
  (3, 'Anand',    'Murugan',    5, '9100000006', 'anand.murugan@smartmart.com',   '45 Avinashi Rd, Coimbatore',
   '1987-04-19', 'Male',   '9100009906', '2018-06-01', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100006', 'State Bank of India', 'SBIN0005678', 'Anand Murugan',   62000.00, 18),

  (3, 'Nithya',   'Subramanian',7, '9100000007', 'nithya.subramanian@smartmart.com','30 RS Puram, Coimbatore',
   '1996-09-08', 'Female', '9100009907', '2023-02-14', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100007', 'HDFC Bank',           'HDFC0005678', 'Nithya Subramanian',36000.00, 12),

  (3, 'Balamurugan','Pillai',   4, '9100000008', 'bala.pillai@smartmart.com',     '12 Gandhipuram, Coimbatore',
   '1985-12-25', 'Male',   '9100009908', '2017-11-01', 'Active',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O',
   'SB0000100008', 'ICICI Bank',          'ICIC0005678', 'Balamurugan Pillai',70000.00, 20);

-- Set department managers
UPDATE departments SET manager_id = 1 WHERE department_id = 1;
UPDATE departments SET manager_id = 2 WHERE department_id = 2;
UPDATE departments SET manager_id = 3 WHERE department_id = 3;
UPDATE departments SET manager_id = 8 WHERE department_id = 4;
UPDATE departments SET manager_id = 6 WHERE department_id = 5;
UPDATE departments SET manager_id = 5 WHERE department_id = 6;
UPDATE departments SET manager_id = 7 WHERE department_id = 7;

-- ATTENDANCE (sample for April 2026)
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, total_hours, overtime_hours) VALUES
  (1,'2026-04-01','09:00','18:00',9.00,1.00),
  (1,'2026-04-02','09:05','17:55',8.83,0.00),
  (1,'2026-04-07','09:00','20:00',11.00,3.00),
  (2,'2026-04-01','08:55','17:55',9.00,1.00),
  (2,'2026-04-02','09:10','18:10',9.00,1.00),
  (3,'2026-04-01','09:15','18:00',8.75,0.00),
  (3,'2026-04-02','09:00','19:30',10.50,2.50),
  (4,'2026-04-01','08:45','17:45',9.00,1.00),
  (5,'2026-04-01','09:00','18:00',9.00,1.00),
  (6,'2026-04-01','09:00','19:00',10.00,2.00),
  (7,'2026-04-01','09:30','17:30',8.00,0.00),
  (8,'2026-04-01','08:00','18:00',10.00,2.00);

-- LEAVE BALANCE
INSERT INTO leave_balance (employee_id, total_allowed, used_leaves) VALUES
  (1,12,2),(2,12,1),(3,15,3),(4,12,0),(5,12,4),(6,18,2),(7,12,0),(8,20,5);

-- LEAVE REQUESTS
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, status) VALUES
  (1,'Casual',  '2026-04-10','2026-04-11','Approved'),
  (2,'Sick',    '2026-03-20','2026-03-20','Approved'),
  (3,'Annual',  '2026-05-01','2026-05-03','Pending'),
  (5,'Casual',  '2026-04-14','2026-04-17','Approved'),
  (8,'Annual',  '2026-03-01','2026-03-05','Approved');

-- PAYROLL (March 2026)
INSERT INTO payroll (employee_id, payroll_month, payroll_year, base_salary, leave_deduction, bonus) VALUES
  (1,3,2026,45000.00,0.00,   2000.00),
  (2,3,2026,42000.00,1400.00,0.00),
  (3,3,2026,55000.00,0.00,   5000.00),
  (4,3,2026,38000.00,0.00,   0.00),
  (5,3,2026,40000.00,2666.67,0.00),
  (6,3,2026,62000.00,0.00,   8000.00),
  (7,3,2026,36000.00,0.00,   0.00),
  (8,3,2026,70000.00,0.00,   10000.00);


-- =============================================================
-- 3. INVENTORY DATABASE
-- =============================================================
\c inventory_db;

-- CATEGORIES
INSERT INTO product_categories (category_name) VALUES
  ('Groceries'),
  ('Electronics'),
  ('Clothing & Apparel'),
  ('Home & Kitchen'),
  ('Personal Care'),
  ('Beverages'),
  ('Dairy & Eggs'),
  ('Snacks & Confectionery');

-- SUBCATEGORIES
INSERT INTO product_subcategories (category_id, subcategory_name) VALUES
  (1,'Rice & Grains'),(1,'Pulses & Lentils'),(1,'Spices & Masalas'),
  (2,'Mobile Phones'),(2,'Accessories'),(2,'Audio'),
  (3,'Men''s Wear'),(3,'Women''s Wear'),(3,'Footwear'),
  (4,'Cookware'),(4,'Storage & Containers'),
  (5,'Skincare'),(5,'Hair Care'),(5,'Oral Care'),
  (6,'Soft Drinks'),(6,'Juices'),(6,'Water'),
  (7,'Milk'),(7,'Cheese & Butter'),(7,'Eggs'),
  (8,'Biscuits & Cookies'),(8,'Chips & Namkeen'),(8,'Chocolates');

-- BRANDS
INSERT INTO brands (brand_name) VALUES
  ('Aashirvaad'),('Fortune'),('MTR'),('Samsung'),('boAt'),
  ('Peter England'),('W for Woman'),('Bata'),('Prestige'),
  ('Milton'),('Nivea'),('Dove'),('Colgate'),
  ('Coca-Cola'),('Tropicana'),('Bisleri'),
  ('Amul'),('Mother Dairy'),('Britannia'),('Lay''s'),('KitKat');

-- PRODUCTS  (15 sample products)
INSERT INTO products (sku, barcode, product_name, brand_id, category_id, subcategory_id, unit, reorder_level, tax_percentage, is_active) VALUES
  ('SKU-GR-001','BAR-001','Aashirvaad Atta 5kg',        1,1, 1,'Bag',  20, 0.00,TRUE),
  ('SKU-GR-002','BAR-002','Fortune Sunflower Oil 1L',   2,1, 1,'Bottle',15, 5.00,TRUE),
  ('SKU-GR-003','BAR-003','MTR Sambar Masala 100g',     3,1, 3,'Pack', 30, 12.00,TRUE),
  ('SKU-EL-001','BAR-004','Samsung Galaxy A35',         4,2, 4,'Piece', 5, 18.00,TRUE),
  ('SKU-EL-002','BAR-005','boAt Rockerz 255 Pro',       5,2, 6,'Piece',10, 18.00,TRUE),
  ('SKU-CL-001','BAR-006','Peter England Formal Shirt', 6,3, 7,'Piece',10, 12.00,TRUE),
  ('SKU-CL-002','BAR-007','W Floral Kurta',             7,3, 8,'Piece', 8, 12.00,TRUE),
  ('SKU-HK-001','BAR-008','Prestige Pressure Cooker 3L',9,4,10,'Piece', 5, 18.00,TRUE),
  ('SKU-HK-002','BAR-009','Milton Steel Tiffin Box',   10,4,11,'Piece',15,  5.00,TRUE),
  ('SKU-PC-001','BAR-010','Nivea Body Lotion 200ml',   11,5,12,'Bottle',20, 12.00,TRUE),
  ('SKU-PC-002','BAR-011','Dove Shampoo 340ml',        12,5,13,'Bottle',20, 12.00,TRUE),
  ('SKU-PC-003','BAR-012','Colgate MaxFresh 200g',     13,5,14,'Tube', 25,  5.00,TRUE),
  ('SKU-DA-001','BAR-013','Amul Full Cream Milk 1L',   17,7,18,'Pouch',50,  0.00,TRUE),
  ('SKU-SN-001','BAR-014','Britannia Good Day 200g',   19,8,21,'Pack', 40,  5.00,TRUE),
  ('SKU-SN-002','BAR-015','Lay''s Classic Salted 52g', 20,8,22,'Pack', 50, 12.00,TRUE);

-- INVENTORY BATCHES  (stock across branches 1,2,3)
INSERT INTO inventory_batches (branch_id, product_id, supplier_id, quantity, expiry_date, cost_per_unit, purchase_rate, mrp, sales_rate, date_received) VALUES
  (1,  1, 1, 200, '2027-06-30',  180.00, 180.00,  220.00,  210.00, '2026-03-01'),
  (1,  2, 1, 150, '2027-03-31',   95.00,  95.00,  125.00,  119.00, '2026-03-05'),
  (1,  3, 2,  80, '2027-01-31',   40.00,  40.00,   55.00,   52.00, '2026-03-10'),
  (1,  4, 3,  20, NULL,        18000.00,18000.00,24999.00,24499.00, '2026-03-15'),
  (1,  5, 3,  35, NULL,          900.00,  900.00, 1299.00, 1199.00, '2026-03-15'),
  (2,  6, 4,  50, NULL,          700.00,  700.00, 1099.00,  999.00, '2026-03-20'),
  (2,  7, 4,  40, NULL,          500.00,  500.00,  799.00,  749.00, '2026-03-20'),
  (2,  8, 5,  15, NULL,         1800.00, 1800.00, 2499.00, 2299.00, '2026-03-22'),
  (2,  9, 5,  60, NULL,          280.00,  280.00,  399.00,  369.00, '2026-03-22'),
  (3, 10, 6,  90, '2027-12-31',  180.00,  180.00,  249.00,  229.00, '2026-03-25'),
  (3, 11, 6, 100, '2027-12-31',  160.00,  160.00,  239.00,  219.00, '2026-03-25'),
  (3, 12, 2, 120, '2028-06-30',   50.00,   50.00,   79.00,   75.00, '2026-03-28'),
  (3, 13, 7, 300, '2026-05-31',   48.00,   48.00,   65.00,   62.00, '2026-04-02'),
  (1, 14, 2, 400, '2026-12-31',   20.00,   20.00,   30.00,   28.00, '2026-04-05'),
  (2, 15, 2, 500, '2026-10-31',   18.00,   18.00,   25.00,   24.00, '2026-04-05');

-- STOCK MOVEMENTS
INSERT INTO stock_movements (branch_id, product_id, batch_id, movement_type, quantity, reference_id) VALUES
  (1,1,1,'PURCHASE', 200,1),
  (1,2,2,'PURCHASE', 150,2),
  (1,3,3,'PURCHASE',  80,3),
  (1,4,4,'PURCHASE',  20,4),
  (1,5,5,'PURCHASE',  35,5),
  (2,6,6,'PURCHASE',  50,6),
  (2,7,7,'PURCHASE',  40,7),
  (2,8,8,'PURCHASE',  15,8),
  (2,9,9,'PURCHASE',  60,9),
  (3,10,10,'PURCHASE', 90,10),
  (3,11,11,'PURCHASE',100,11),
  (3,12,12,'PURCHASE',120,12),
  (3,13,13,'PURCHASE',300,13),
  (1,14,14,'PURCHASE',400,14),
  (2,15,15,'PURCHASE',500,15),
  (1,1,1,'SALE',       2,1),
  (1,3,3,'SALE',       1,1),
  (1,5,5,'SALE',       3,2),
  (2,7,7,'SALE',       2,2),
  (2,2,2,'SALE',       5,3),
  (2,9,9,'SALE',       1,4);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW stock_valuation;


-- =============================================================
-- 4. PROCUREMENT DATABASE
-- =============================================================
\c procurement_db;

-- SUPPLIERS
INSERT INTO suppliers (supplier_name, contact_person, phone, email, gst_number, status) VALUES
  ('Agro Fresh Supplies Pvt Ltd',  'Ravi Shankar',   '9200000001', 'ravi@agrofresh.com',     'GST33AAC1234A1Z5', 'Active'),
  ('Spice Garden Traders',         'Lalitha Devi',   '9200000002', 'lalitha@spicegarden.com','GST33AAC5678B2Z3', 'Active'),
  ('TechWorld Distributors',       'Kiran Rao',      '9200000003', 'kiran@techworld.com',    'GST29AAC9012C3Z1', 'Active'),
  ('Fashion Forward Wholesale',    'Meera Joshi',    '9200000004', 'meera@fashionfwd.com',   'GST27AAC3456D4Z9', 'Active'),
  ('Homecraft Suppliers',          'Arif Shaikh',    '9200000005', 'arif@homecraft.com',     'GST27AAC7890E5Z7', 'Active'),
  ('Beauty Essentials Co.',        'Sunita Patil',   '9200000006', 'sunita@beautyess.com',   'GST29AAC2345F6Z5', 'Active'),
  ('Dairy Direct Pvt Ltd',         'Srinivas Reddy', '9200000007', 'srinivas@dairydirect.com','GST36AAC6789G7Z3','Active');

-- SUPPLIER ORDERS
INSERT INTO supplier_orders (branch_id, supplier_id, total_cost, expected_delivery_date, status, invoice_number) VALUES
  (1,1,54000.00,'2026-03-03','Completed',   'SO-AGR-001'),
  (1,2,23200.00,'2026-03-12','Completed',   'SO-SPC-001'),
  (1,3,72000.00,'2026-03-18','Completed',   'SO-TWD-001'),
  (2,4,57500.00,'2026-03-22','Completed',   'SO-FFW-001'),
  (2,5,50400.00,'2026-03-25','Completed',   'SO-HCS-001'),
  (3,6,48200.00,'2026-03-28','Completed',   'SO-BEC-001'),
  (3,7,14400.00,'2026-04-04','Partially_Received','SO-DD-001'),
  (1,1,35000.00,'2026-04-20','Pending',     'SO-AGR-002');

-- SUPPLIER ORDER ITEMS
INSERT INTO supplier_order_items (order_id, product_id, quantity_supplied, quantity_received, unit_cost, expiry_date) VALUES
  (1,1,200,200, 180.00,'2027-06-30'),
  (1,2,150,150,  95.00,'2027-03-31'),
  (2,3, 80, 80,  40.00,'2027-01-31'),
  (3,4, 20, 20,18000.00,NULL),
  (3,5, 35, 35, 900.00,NULL),
  (4,6, 50, 50, 700.00,NULL),
  (4,7, 40, 40, 500.00,NULL),
  (5,8, 15, 15,1800.00,NULL),
  (5,9, 60, 60, 280.00,NULL),
  (6,10,90, 90, 180.00,'2027-12-31'),
  (6,11,100,100, 160.00,'2027-12-31'),
  (6,12,120,120,  50.00,'2028-06-30'),
  (7,13,300,150,  48.00,'2026-05-31'),
  (8,1, 150,  0, 180.00,'2027-06-30'),
  (8,14,400,  0,  20.00,'2026-12-31');

-- SUPPLIER PAYMENTS
INSERT INTO supplier_payments (supplier_id, order_id, amount, payment_status) VALUES
  (1,1,54000.00,'COMPLETED'),
  (2,2,23200.00,'COMPLETED'),
  (3,3,72000.00,'COMPLETED'),
  (4,4,57500.00,'COMPLETED'),
  (5,5,50400.00,'COMPLETED'),
  (6,6,48200.00,'COMPLETED'),
  (7,7, 7200.00,'PARTIAL'),
  (1,8,    0.00,'PENDING');


-- =============================================================
-- 5. ADMIN DATABASE
-- =============================================================
\c admin_db;

-- ROLES
INSERT INTO roles (role_name) VALUES
  ('Super Admin'),
  ('Store Manager'),
  ('Cashier'),
  ('HR Manager'),
  ('Inventory Manager'),
  ('Procurement Officer'),
  ('Analyst');

-- PERMISSIONS  (format: module:action)
INSERT INTO permissions (permission_name) VALUES
  -- Admin
  ('admin:view'),('admin:create'),('admin:update'),('admin:delete'),
  -- Users
  ('users:view'),('users:create'),('users:update'),('users:delete'),
  -- POS / Sales
  ('pos:view'),('pos:create'),('pos:update'),('pos:delete'),('pos:refund'),
  -- Inventory
  ('inventory:view'),('inventory:create'),('inventory:update'),('inventory:delete'),
  -- Procurement
  ('procurement:view'),('procurement:create'),('procurement:update'),('procurement:delete'),
  -- HR
  ('hr:view'),('hr:create'),('hr:update'),('hr:delete'),('hr:payroll'),
  -- Analytics
  ('analytics:view'),('analytics:export'),
  -- Config
  ('config:view'),('config:update'),
  -- Reports
  ('reports:view'),('reports:export');

-- ROLE → PERMISSIONS
-- Super Admin: all
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Store Manager: most except admin:delete, users:delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions
WHERE permission_name NOT IN ('admin:delete','users:delete','config:update');

-- Cashier: POS only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions
WHERE permission_name IN ('pos:view','pos:create','pos:update','pos:refund','inventory:view');

-- HR Manager: HR + reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions
WHERE permission_name LIKE 'hr:%' OR permission_name IN ('reports:view','reports:export','users:view');

-- Inventory Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions
WHERE permission_name LIKE 'inventory:%' OR permission_name IN ('reports:view','analytics:view');

-- Procurement Officer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM permissions
WHERE permission_name LIKE 'procurement:%' OR permission_name IN ('inventory:view','reports:view');

-- Analyst: read-only analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, permission_id FROM permissions
WHERE permission_name IN ('analytics:view','analytics:export','reports:view','reports:export',
                          'pos:view','inventory:view','hr:view','procurement:view');

-- ADMIN USERS
-- Super Admin password: SmartMart@Admin2026
-- bcrypt hash (cost 10): $2b$10$XuM6z9j5bYuK8gL2mNpOoOk.K7Q4q1H3lTa9XcVYWAn5Rl2mN7Ue2
INSERT INTO admin_users (employee_id, username, password_hash, role_id, is_active) VALUES
  (NULL, 'superadmin',    '$2b$10$XuM6z9j5bYuK8gL2mNpOoOk.K7Q4q1H3lTa9XcVYWAn5Rl2mN7Ue2', 1, TRUE),
  (3,    'mgr.downtown',  '$2b$10$XuM6z9j5bYuK8gL2mNpOoOk.K7Q4q1H3lTa9XcVYWAn5Rl2mN7Ue2', 2, TRUE),
  (4,    'mgr.velachery', '$2b$10$XuM6z9j5bYuK8gL2mNpOoOk.K7Q4q1H3lTa9XcVYWAn5Rl2mN7Ue2', 2, TRUE),
  (6,    'mgr.coimbatore','$2b$10$XuM6z9j5bYuK8gL2mNpOoOk.K7Q4q1H3lTa9XcVYWAn5Rl2mN7Ue2', 2, TRUE),
  (1,    'cashier.rajesh','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 3, TRUE),
  (2,    'hr.deepa',      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 4, TRUE),
  (5,    'inv.praveen',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 5, TRUE),
  (6,    'proc.anand',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 6, TRUE),
  (7,    'analyst.nithya','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 7, TRUE),
  (8,    'it.bala',       '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p4aNS3bxybrIW/cLkVWs/O', 2, FALSE);

-- SYSTEM CONFIG
INSERT INTO system_config (config_key, config_value) VALUES
  ('store_name',            'SmartMart Retail Pvt Ltd'),
  ('currency',              'INR'),
  ('tax_rate_default',      '12'),
  ('invoice_prefix',        'INV'),
  ('session_timeout_min',   '30'),
  ('max_login_attempts',    '5'),
  ('support_email',         'support@smartmart.com'),
  ('receipt_footer',        'Thank you for shopping at SmartMart!'),
  ('loyalty_points_ratio',  '1'),
  ('fiscal_year_start',     '04');

-- FEATURE FLAGS
INSERT INTO feature_flags (feature_name, is_enabled) VALUES
  ('loyalty_program',       TRUE),
  ('digital_receipts',      TRUE),
  ('self_checkout',         FALSE),
  ('whatsapp_invoice',      TRUE),
  ('dark_mode_ui',          TRUE),
  ('analytics_dashboard',   TRUE),
  ('multi_currency',        FALSE),
  ('barcode_scan_pos',      TRUE);

-- AUDIT LOG (sample entries)
INSERT INTO audit_logs (user_id, action, module, ip_address, metadata) VALUES
  (1,'LOGIN',          'auth',      '192.168.1.10', '{"status":"success"}'),
  (1,'CREATE_USER',    'admin',     '192.168.1.10', '{"created_user":"cashier.rajesh"}'),
  (2,'LOGIN',          'auth',      '192.168.1.11', '{"status":"success"}'),
  (5,'VIEW_STOCK',     'inventory', '192.168.1.15', '{"branch_id":2}'),
  (6,'CREATE_ORDER',   'procurement','192.168.1.20',  '{"order_id":7}'),
  (3,'LOGIN',          'auth',      '192.168.1.12', '{"status":"success"}'),
  (1,'UPDATE_CONFIG',  'admin',     '192.168.1.10', '{"key":"session_timeout_min","old":"60","new":"30"}');


-- =============================================================
-- 6. ANALYTICS DATABASE
-- =============================================================
\c analytics_db;

INSERT INTO sales_summary_daily (summary_date, total_revenue, total_tax, total_transactions) VALUES
  ('2026-03-01', 42500.00, 5100.00, 18),
  ('2026-03-02', 38200.00, 4584.00, 15),
  ('2026-03-03', 51300.00, 6156.00, 22),
  ('2026-03-07', 47800.00, 5736.00, 20),
  ('2026-03-08', 29500.00, 3540.00, 12),
  ('2026-03-14', 63200.00, 7584.00, 27),
  ('2026-03-15', 58900.00, 7068.00, 25),
  ('2026-04-01', 44100.00, 5292.00, 19),
  ('2026-04-02', 39800.00, 4776.00, 17),
  ('2026-04-07', 52600.00, 6312.00, 23);

INSERT INTO product_sales_summary (product_id, branch_id, total_quantity, total_revenue) VALUES
  (1,1,  200, 42000.00),
  (2,1,  150, 17850.00),
  (3,1,   80,  4160.00),
  (4,1,   18,440982.00),
  (5,1,   32, 38368.00),
  (6,2,   48, 47952.00),
  (7,2,   38, 28462.00),
  (8,2,   14, 32186.00),
  (9,2,   59, 21771.00),
  (10,3,  88, 20152.00),
  (11,3,  97, 21243.00),
  (12,3, 118,  8850.00),
  (13,3, 280, 17360.00),
  (14,1, 390, 10920.00),
  (15,2, 480, 11520.00);

INSERT INTO inventory_summary (product_id, branch_id, current_stock, stock_value) VALUES
  (1,1, 198, 35640.00),
  (2,1, 145, 13775.00),
  (3,1,  79,  3160.00),
  (4,1,  18,324000.00),
  (5,1,  32, 28800.00),
  (6,2,  48, 33600.00),
  (7,2,  38, 19000.00),
  (8,2,  14, 25200.00),
  (9,2,  59, 16520.00),
  (10,3, 88, 15840.00),
  (11,3, 97, 15520.00),
  (12,3,118,  5900.00),
  (13,3,150,  7200.00),
  (14,1,398,  7960.00),
  (15,2,498,  8964.00);

INSERT INTO payroll_summary (payroll_month, payroll_year, total_payroll) VALUES
  (1,2026,381000.00),
  (2,2026,381000.00),
  (3,2026,402333.33);

INSERT INTO supplier_summary (supplier_id, branch_id, total_purchase_value) VALUES
  (1,1,89000.00),
  (2,1,23200.00),
  (3,1,72000.00),
  (4,2,57500.00),
  (5,2,50400.00),
  (6,3,48200.00),
  (7,3,14400.00);
