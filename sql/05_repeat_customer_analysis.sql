-- Repeat purchasing among customers with at least one completed order.
-- A repeat customer has more than one Complete order.

WITH completed_orders_by_customer AS (
  SELECT
    user_id,
    COUNT(DISTINCT order_id) AS completed_order_count
  FROM `bigquery-public-data.thelook_ecommerce.orders`
  WHERE status = 'Complete'
  GROUP BY user_id
)
SELECT
  COUNT(*) AS purchasing_customers,
  COUNTIF(completed_order_count > 1) AS repeat_customers,
  SAFE_DIVIDE(
    COUNTIF(completed_order_count > 1),
    COUNT(*)
  ) AS repeat_customer_rate,
  AVG(completed_order_count) AS avg_completed_orders_per_customer,
  MAX(completed_order_count) AS max_completed_orders_by_one_customer
FROM completed_orders_by_customer;
