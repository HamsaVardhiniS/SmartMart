-- ENUMS
CREATE TYPE transaction_status_enum AS ENUM ('COMPLETED','CANCELLED','REFUNDED');
CREATE TYPE payment_status_enum AS ENUM ('SUCCESS','FAILED','PENDING');
CREATE TYPE payment_method_enum AS ENUM ('CASH','CREDIT_CARD','DEBIT_CARD','UPI','WALLET','STORE_CREDIT','GIFT_CARD');
CREATE TYPE refund_status_enum AS ENUM ('PARTIAL','FULL');

-- INVOICE SEQUENCE
CREATE SEQUENCE invoice_sequence START 100000;

-- BRANCHES
CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- CUSTOMERS
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- CUSTOMER FEEDBACK
CREATE TABLE customer_feedback (
    feedback_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SALES TRANSACTIONS
CREATE TABLE sales_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    invoice_number VARCHAR(30) UNIQUE NOT NULL DEFAULT 'INV-' || nextval('invoice_sequence'),
    customer_id INT,
    CONSTRAINT chk_customer_positive CHECK (customer_id IS NULL OR customer_id > 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    other_discount NUMERIC(12,2) DEFAULT 0 CHECK (other_discount >= 0),
    tax_amount NUMERIC(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    net_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - other_discount + tax_amount) STORED,
    transaction_status transaction_status_enum DEFAULT 'COMPLETED',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT NOT NULL,
    payment_verified BOOLEAN DEFAULT FALSE
);

-- SALES ITEMS
CREATE TABLE sales_items (
    sales_item_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES sales_transactions(transaction_id) ON DELETE CASCADE,
    product_id INT NOT NULL,
    batch_id INT,
    quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
    selling_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0 CHECK (discount >= 0),
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity_sold * selling_price - discount) STORED
);

-- PAYMENTS
CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES sales_transactions(transaction_id) ON DELETE CASCADE,
    payment_method payment_method_enum NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_status payment_status_enum DEFAULT 'SUCCESS',
    payment_reference VARCHAR(255)
);


-- REFUND TRANSACTIONS
CREATE TABLE refund_transactions (
    refund_id BIGSERIAL PRIMARY KEY,
    original_transaction_id BIGINT REFERENCES sales_transactions(transaction_id),
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_reason TEXT,
    refund_status refund_status_enum NOT NULL
);

-- REFUND ITEMS
CREATE TABLE refund_items (
    refund_item_id BIGSERIAL PRIMARY KEY,
    refund_id BIGINT REFERENCES refund_transactions(refund_id) ON DELETE CASCADE,
    product_id INT,
    batch_id INT,
    quantity_returned INT CHECK (quantity_returned > 0),
    refund_amount NUMERIC(12,2) CHECK (refund_amount >= 0)
);

-- INVOICE STORAGE
CREATE TABLE invoice_documents (
    document_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES sales_transactions(transaction_id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_sales_status ON sales_transactions(transaction_status);
CREATE INDEX idx_sales_branch_date ON sales_transactions(branch_id, transaction_date);
CREATE INDEX idx_sales_customer ON sales_transactions(customer_id);
CREATE INDEX idx_sales_items_product ON sales_items(product_id);
CREATE INDEX idx_sales_items_batch ON sales_items(batch_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_sales_date_brin ON sales_transactions USING BRIN(transaction_date);


-- MATERIALIZED VIEW
CREATE MATERIALIZED VIEW customer_lifetime_summary AS
SELECT 
    branch_id,
    customer_id,
    COUNT(transaction_id) AS total_transactions,
    SUM(net_amount) AS total_spent
FROM sales_transactions
WHERE transaction_status = 'COMPLETED'
AND customer_id IS NOT NULL
GROUP BY branch_id, customer_id;

CREATE TABLE event_log (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE failed_events (
  event_id TEXT,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);