-- AUTO UPDATE TOTAL ORDER COST

CREATE OR REPLACE FUNCTION update_supplier_order_total()
RETURNS TRIGGER AS $$
BEGIN
UPDATE supplier_orders
SET total_cost = (
    SELECT SUM(total_cost)
    FROM supplier_order_items
    WHERE order_id = NEW.order_id
)
WHERE order_id = NEW.order_id;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_total
AFTER INSERT OR UPDATE
ON supplier_order_items
FOR EACH ROW
EXECUTE FUNCTION update_supplier_order_total();