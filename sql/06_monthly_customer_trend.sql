-- Monthly customer purchasing trend for Complete orders.
-- A new customer is counted in their first month with a completed order.
-- A repeat customer has a completed order before the current month.

WITH completed_orders AS (
  SELECT DISTINCT
    user_id,
    order_id,
    DATE_TRUNC(DATE(created_at), MONTH) AS order_month
  FROM `bigquery-public-data.thelook_ecommerce.orders`
  WHERE status = 'Complete'
),
customer_first_month AS (
  SELECT
    user_id,
    MIN(order_month) AS first_completed_order_month
  FROM completed_orders
  GROUP BY user_id
),
monthly_customer_activity AS (
  SELECT
    order_month,
    COUNT(DISTINCT user_id) AS purchasing_customers,
    COUNT(DISTINCT IF(
      order_month = first_completed_order_month,
      user_id,
      NULL
    )) AS new_customers,
    COUNT(DISTINCT IF(
      order_month > first_completed_order_month,
      user_id,
      NULL
    )) AS repeat_customers
  FROM completed_orders
  JOIN customer_first_month USING (user_id)
  GROUP BY order_month
)
SELECT
  order_month,
  purchasing_customers,
  new_customers,
  repeat_customers,
  SAFE_DIVIDE(repeat_customers, purchasing_customers) AS repeat_customer_share
FROM monthly_customer_activity
ORDER BY order_month;
