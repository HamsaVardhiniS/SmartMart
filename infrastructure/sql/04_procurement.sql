CREATE TYPE supplier_payment_status_enum AS ENUM ('PENDING','PARTIAL','COMPLETED');
CREATE TYPE supplier_order_status_enum AS ENUM ('Pending','Partially_Received','Completed','Cancelled');

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    gst_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE supplier_orders (
    order_id BIGSERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    supplier_id INT REFERENCES suppliers(supplier_id),
    total_cost NUMERIC(12,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATE,
    status supplier_order_status_enum DEFAULT 'Pending',
    invoice_number VARCHAR(50) UNIQUE
);


CREATE TABLE supplier_order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES supplier_orders(order_id) ON DELETE CASCADE,
    product_id INT,
    quantity_supplied INT NOT NULL CHECK (quantity_supplied > 0),
    quantity_received INT DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost NUMERIC(12,2),
    total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,
    expiry_date DATE
);

CREATE TABLE supplier_payments (
    payment_id BIGSERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(supplier_id),
    order_id BIGINT REFERENCES supplier_orders(order_id) ON DELETE CASCADE,
    amount NUMERIC(12,2),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status supplier_payment_status_enum DEFAULT 'PENDING'
);

CREATE INDEX idx_supplier_orders_supplier ON supplier_orders(supplier_id);

CREATE TABLE event_log (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE failed_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);