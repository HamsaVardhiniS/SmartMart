CREATE INDEX IF NOT EXISTS idx_batches_expiry
ON inventory_batches(expiry_date);

CREATE INDEX IF NOT EXISTS idx_batches_branch_product
ON inventory_batches(branch_id, product_id);

CREATE INDEX IF NOT EXISTS idx_stock_product
ON stock_movements(product_id);

CREATE OR REPLACE FUNCTION update_last_sold_date()
RETURNS TRIGGER AS $$
BEGIN

IF NEW.movement_type = 'SALE' THEN

UPDATE products
SET last_sold_date = CURRENT_DATE
WHERE product_id = NEW.product_id;

END IF;

RETURN NEW;

END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_update_last_sold
ON stock_movements;

CREATE TRIGGER trg_update_last_sold
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_last_sold_date();

CREATE OR REPLACE FUNCTION prevent_negative_inventory()
RETURNS TRIGGER AS $$
DECLARE
current_stock INT;
BEGIN

SELECT COALESCE(SUM(quantity),0)
INTO current_stock
FROM inventory_batches
WHERE product_id = NEW.product_id
AND branch_id = NEW.branch_id;

IF NEW.movement_type = 'SALE'
AND current_stock < NEW.quantity THEN

RAISE EXCEPTION
'Insufficient stock for product %', NEW.product_id;

END IF;

RETURN NEW;

END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_prevent_negative_stock
ON stock_movements;

CREATE TRIGGER trg_prevent_negative_stock
BEFORE INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_inventory();

CREATE OR REPLACE FUNCTION process_sale(
p_product_id INT,
p_branch_id INT,
p_quantity INT,
p_reference_id INT
)
RETURNS VOID AS $$

DECLARE
remaining INT := p_quantity;
batch_record RECORD;
deduct INT;

BEGIN

FOR batch_record IN
SELECT *
FROM inventory_batches
WHERE product_id = p_product_id
AND branch_id = p_branch_id
AND quantity > 0
ORDER BY expiry_date ASC
LOOP

EXIT WHEN remaining <= 0;

deduct := LEAST(batch_record.quantity, remaining);

UPDATE inventory_batches
SET quantity = quantity - deduct
WHERE batch_id = batch_record.batch_id;

INSERT INTO stock_movements(
branch_id,
product_id,
batch_id,
movement_type,
quantity,
reference_id
)
VALUES(
p_branch_id,
p_product_id,
batch_record.batch_id,
'SALE',
deduct,
p_reference_id
);

remaining := remaining - deduct;

END LOOP;

IF remaining > 0 THEN
RAISE EXCEPTION 'Not enough stock available';
END IF;

END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION 
refresh_stock_valuation()
RETURNS TRIGGER AS $$
BEGIN

REFRESH MATERIALIZED VIEW stock_valuation;

RETURN NULL;

END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_refresh_stock_valuation
ON inventory_batches;

CREATE TRIGGER trg_refresh_stock_valuation
AFTER INSERT OR UPDATE ON inventory_batches
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stock_valuation();

CREATE INDEX IF NOT EXISTS idx_products_last_sold
ON products(last_sold_date);