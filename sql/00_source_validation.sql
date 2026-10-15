-- TheLook E-commerce: source validation checks
-- Run in BigQuery. These queries read from the public source dataset.

-- 1. Compare order-level status with item-level status.
SELECT
  o.status AS order_status,
  oi.status AS item_status,
  COUNT(*) AS item_rows,
  SUM(oi.sale_price) AS item_sales
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
JOIN `bigquery-public-data.thelook_ecommerce.orders` AS o
  ON oi.order_id = o.order_id
GROUP BY order_status, item_status
ORDER BY order_status, item_status;


-- 2. Check whether every order item matches one inventory item.
-- Any difference between order_item_rows and matched_inventory_rows
-- indicates missing inventory matches or a join that multiplies rows.
SELECT
  COUNT(*) AS order_item_rows,
  COUNT(ii.id) AS matched_inventory_rows,
  COUNT(*) - COUNT(ii.id) AS unmatched_inventory_rows,
  COUNT(DISTINCT ii.id) AS distinct_inventory_items
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
LEFT JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii
  ON oi.inventory_item_id = ii.id;


-- 3. List order items with no matching inventory item.
-- This is the anti-join pattern.
SELECT
  oi.id AS order_item_id,
  oi.order_id,
  oi.inventory_item_id
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
LEFT JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii
  ON oi.inventory_item_id = ii.id
WHERE ii.id IS NULL;


-- 4. Check for duplicate inventory IDs.
-- Expected result: no rows.
SELECT
  id AS inventory_item_id,
  COUNT(*) AS row_count
FROM `bigquery-public-data.thelook_ecommerce.inventory_items`
GROUP BY inventory_item_id
HAVING COUNT(*) > 1;


-- 5. Count null inventory IDs in the source table.
SELECT
  COUNTIF(id IS NULL) AS null_inventory_ids
FROM `bigquery-public-data.thelook_ecommerce.inventory_items`;


-- 6. Check for duplicate order IDs.
-- Expected result: no rows.
SELECT
  order_id,
  COUNT(*) AS row_count
FROM `bigquery-public-data.thelook_ecommerce.orders`
GROUP BY order_id
HAVING COUNT(*) > 1;
