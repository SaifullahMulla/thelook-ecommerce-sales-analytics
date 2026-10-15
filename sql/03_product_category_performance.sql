-- Product category performance for completed orders.
-- Each order item is joined to one product and one inventory item.

SELECT
  p.category AS product_category,
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
    COUNT(*)
  ) AS average_selling_price_per_unit
FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
JOIN `bigquery-public-data.thelook_ecommerce.orders` AS o
  ON oi.order_id = o.order_id
JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii
  ON oi.inventory_item_id = ii.id
JOIN `bigquery-public-data.thelook_ecommerce.products` AS p
  ON oi.product_id = p.id
WHERE o.status = 'Complete'
GROUP BY product_category
ORDER BY completed_sales DESC;
