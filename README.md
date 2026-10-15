# TheLook E-commerce Sales Analytics
TheLook (Public dataset) E-commerce Sales Analytics project end to end.

An end-to-end analytics project using the public BigQuery
`thelook_ecommerce` dataset. The project explores the source data, defines
sales and profitability metrics, builds reusable SQL models, and presents
business insights in a dashboard. Planned extensions include a refresh
workflow and a conversational analytics assistant.

## Business objective

Help a fictional e-commerce business understand sales performance, order
fulfillment, product profitability, and returns. Make metric definitions
explicit and trace dashboard figures back to their source data.

## Dataset

Source: `bigquery-public-data.thelook_ecommerce` (BigQuery public dataset).

| Table | Grain | Use |
| --- | --- | --- |
| `orders` | One row per order | Order date, customer, overall order status |
| `order_items` | One row per item/order line | Item sale price, item status, inventory key |
| `inventory_items` | One row per inventory unit | Item cost |
| `products` | One row per product | Product attributes and category |
| `users` | One row per user | Customer attributes |
| `events` | One row per event | Website activity |
| `distribution_centers` | One row per center | Fulfillment center attributes |

## Initial validation findings

These are results from exploratory checks and should be rerun when the SQL
models are executed.

- `orders.order_id` was checked for uniqueness and nulls during exploration.
- The sum of `orders.num_of_item` reconciled to the row count in `order_items`.
- The observed order status and item status pairs matched for all five statuses:
  `Cancelled`, `Complete`, `Processing`, `Returned`, and `Shipped`.
- Inventory matching: 181,162 order-item rows, 181,162 matched inventory IDs,
  zero missing matches, and 181,162 distinct inventory IDs.
- Complete-item sales observed during exploration: approximately 2,669,599.03
  in the dataset's currency units.

## Initial metric policy

| Metric | Initial definition |
| --- | --- |
| Completed sales | Sum of `order_items.sale_price` where order status is `Complete` |
| Completed orders | Distinct `orders.order_id` where status is `Complete` |
| Units sold | Count of item rows where order status is `Complete` |
| Average order value | Completed sales divided by completed orders |
| Cost of goods sold | Sum of `inventory_items.cost` for completed items |
| Gross profit | Completed item sale price minus item cost |
| Gross margin | Gross profit divided by completed sales |
| Returns | Returned item count and sale price, reported separately |
| Cancellations | Cancelled order count, reported separately |
| Shipped and processing | Reported separately; excluded from completed sales initially |

The status filter is a project business rule, not a universal accounting rule.
In particular, shipped orders may be treated differently by another business.
Revenue recognition and return treatment should be agreed with stakeholders
before production use.

## Repository structure

```text
.
├── README.md
├── .gitignore
├── GITHUB_SETUP.md
├── sql/
│   ├── 00_source_validation.sql
│   └── 01_daily_sales_profit.sql
├── docs/
│   ├── metric_definitions.md
│   └── interview_practice.md
└── python/
    └── README.md
