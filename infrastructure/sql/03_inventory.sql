CREATE TABLE product_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE product_subcategories (
    subcategory_id SERIAL PRIMARY KEY,
    category_id INT REFERENCES product_categories(category_id) ON DELETE CASCADE,
    subcategory_name VARCHAR(255),
    UNIQUE(category_id, subcategory_name)
);

CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    brand_id INT REFERENCES brands(brand_id),
    category_id INT REFERENCES product_categories(category_id),
    subcategory_id INT REFERENCES product_subcategories(subcategory_id),
    unit VARCHAR(50),
    reorder_level INT DEFAULT 10,
    tax_percentage NUMERIC(5,2) CHECK (tax_percentage >= 0),
    last_sold_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE inventory_batches (
    batch_id BIGSERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    supplier_id INT,
    quantity INT NOT NULL CHECK (quantity >= 0),
    expiry_date DATE,
    cost_per_unit NUMERIC(12,2) CHECK (cost_per_unit >= 0),
    purchase_rate NUMERIC(12,2) CHECK (purchase_rate >= 0),
    mrp NUMERIC(12,2) CHECK (mrp >= 0),
    sales_rate NUMERIC(12,2) CHECK (sales_rate >= 0),
    date_received TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE movement_type_enum AS ENUM ('SALE','REFUND','PURCHASE','ADJUSTMENT');

CREATE TABLE stock_movements (
    movement_id BIGSERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    batch_id INT,
    movement_type movement_type_enum NOT NULL,
    quantity INT NOT NULL,
    reference_id INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE MATERIALIZED VIEW stock_valuation AS
SELECT 
branch_id,
product_id,
SUM(quantity) AS total_quantity,
SUM(quantity * cost_per_unit) AS total_stock_value
FROM inventory_batches
GROUP BY branch_id, product_id;

CREATE INDEX idx_batches_branch_product ON inventory_batches(branch_id, product_id);
CREATE INDEX idx_stock_product ON stock_movements(product_id);
CREATE INDEX idx_stock_valuation_product ON stock_valuation(product_id);

