-- Daily completed sales and item-level gross profit.
-- Initial policy: include only orders with status 'Complete'.
-- Other statuses will be reported separately.

SELECT
  DATE(o.created_at) AS order_date,
  COUNT(*) AS units_sold,
  COUNT(DISTINCT o.order_id) AS completed_orders,
  SUM(oi.sale_price) AS completed_sales,
  SUM(ii.cost) AS cost_of_goods_sold,
  SUM(oi.sale_price - ii.cost) AS gross_profit,
  SAFE_DIVIDE(
    SUM(oi.sale_price - ii.cost),
    SUM(oi.sale_price)
  ) AS gross_margin_pct,
  SAFE_DIVIDE(
    SUM(oi.sale_price),
    COUNT(DISTINCT o.order_id)
  ) AS average_order_value
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
JOIN `bigquery-public-data.thelook_ecommerce.orders` AS o
  ON oi.order_id = o.order_id
JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii
  ON oi.inventory_item_id = ii.id
WHERE o.status = 'Complete'
GROUP BY order_date
ORDER BY order_date;
