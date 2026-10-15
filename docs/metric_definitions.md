# Metric definitions

These are the initial definitions for this project. The status filter is a 
business rule and should be confirmed with stakeholders before production use.

| Metric | Grain | Definition | Notes |
| --- | --- | --- | --- |
| Completed sales | Item, then day | Sum `order_items.sale_price` for items in `Complete` orders | Uses item price, not an order total repeated across item rows. |
| Completed orders | Order, then day | Count distinct `order_id` where order status is `Complete` | Each order should count once. |
| Units sold | Item, then day | Count item rows in `Complete` orders | One row represents one ordered item. |
| Average order value | Day | Completed sales divided by completed orders | Use `SAFE_DIVIDE` to handle a zero-order day. |
| Cost of goods sold | Item, then day | Sum `inventory_items.cost` for completed items | Join via `order_items.inventory_item_id = inventory_items.id`. |
| Gross profit | Item, then day | Sum item sale price minus item cost | Does not include other expenses or overhead. |
| Gross margin % | Day | Gross profit divided by completed sales | Store as a decimal; format as a percentage in the dashboard. |
| Returns | Item/order | Count and sale price for `Returned` items | Report separately; agree how returns affect net sales. |
| Cancellations | Order | Count distinct orders with `Cancelled` status | State the denominator when reporting a cancellation rate. |
| Shipped / processing | Order and item | Count and sale value by status | Track separately from completed sales in the initial policy. |

## Status policy

The initial sales query includes orders with status `Complete`. It reports
`Shipped`, `Processing`, `Returned`, and `Cancelled` separately rather than
silently combining them with completed sales.

A business may recognize sales at shipment or use a different return policy.
Confirm these choices with stakeholders before treating the metrics as
financial reporting.

## Grain and join rule

`order_items` is at item grain; `orders` is at order grain. Summing item sale
price after joining to `orders` is appropriate when `orders.order_id` is
unique, because each item maps to one order.

If you calculate an order total using a window function, that total repeats on
every item row in the order. Aggregate to one row per order before summing
those order totals.
