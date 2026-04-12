CREATE TABLE sales_summary_daily (
    summary_date DATE PRIMARY KEY,
    total_revenue NUMERIC(15,2),
    total_tax NUMERIC(15,2),
    total_transactions INT
);

CREATE TABLE product_sales_summary (
    product_id INT,
    branch_id INT,
    total_quantity INT,
    total_revenue NUMERIC(15,2),
    PRIMARY KEY (product_id, branch_id)
);

CREATE TABLE inventory_summary (
    product_id INT,
    branch_id INT,
    current_stock INT,
    stock_value NUMERIC(15,2),
    PRIMARY KEY (product_id, branch_id)
);

CREATE TABLE payroll_summary (
    payroll_month INT CHECK (payroll_month BETWEEN 1 AND 12),
    payroll_year INT,
    total_payroll NUMERIC(15,2),
    PRIMARY KEY (payroll_month, payroll_year)
);

CREATE TABLE supplier_summary (
    supplier_id INT,
    branch_id INT,
    total_purchase_value NUMERIC(15,2),
    PRIMARY KEY (supplier_id, branch_id)
);

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