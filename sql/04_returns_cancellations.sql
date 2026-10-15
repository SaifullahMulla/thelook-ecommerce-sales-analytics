-- Returns and cancellations by status.
-- Order counts are calculated at order grain.
-- Item counts and values are calculated at order-item grain.

-- 1. Order-level counts and rates by order status.
WITH order_status_counts AS (
  SELECT
    status AS order_status,
    COUNT(*) AS order_count
  FROM `bigquery-public-data.thelook_ecommerce.orders`
  GROUP BY order_status
),
total_orders AS (
  SELECT COUNT(*) AS total_order_count
  FROM `bigquery-public-data.thelook_ecommerce.orders`
)
SELECT
  s.order_status,
  s.order_count,
  t.total_order_count,
  SAFE_DIVIDE(s.order_count, t.total_order_count) AS share_of_all_orders
FROM order_status_counts AS s
CROSS JOIN total_orders AS t
ORDER BY s.order_count DESC;


-- 2. Item-level counts and sale values by item status.
SELECT
  oi.status AS item_status,
  COUNT(*) AS item_count,
  COUNT(DISTINCT oi.order_id) AS affected_order_count,
  SUM(oi.sale_price) AS item_sale_value
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
GROUP BY item_status
ORDER BY item_count DESC;
