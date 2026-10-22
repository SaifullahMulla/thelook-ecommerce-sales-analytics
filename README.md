# TheLook E-commerce Sales Analytics

An end-to-end sales analytics project using the public
`bigquery-public-data.thelook_ecommerce` dataset. The project explores the
source data, defines sales and profitability metrics, develops reusable
BigQuery SQL analyses, and presents business results in a Looker Studio
dashboard connected through Google Sheets.

Planned extensions include automating the Sheets refresh workflow and adding
a conversational analytics assistant.

## Business Objective

Help a fictional e-commerce business understand sales performance, order
status, product category performance, profitability, and customer purchasing
behavior. Metric definitions are documented so dashboard results can be traced
back to the source data.

## Business Problem

The source data contains information about orders, order items, products,
inventory costs, customers, and website events. This project brings relevant
data together to answer questions such as:

- How are completed sales and gross profit changing over time?
- Which product categories contribute the most sales and profit?
- What is the distribution of orders across statuses?
- How many customers purchase each month?
- What share of customers with a completed order make repeat purchases?

## Dataset

**Source:** Google BigQuery public dataset  
**Dataset ID:** `bigquery-public-data.thelook_ecommerce`

| Table | Grain | Use |
|---|---|---|
| `orders` | One row per order | Order date, customer, and order status |
| `order_items` | One row per order item | Item sale price, item status, and inventory key |
| `inventory_items` | One row per inventory unit | Item cost |
| `products` | One row per product | Product attributes and category |
| `users` | One row per user | Customer attributes |
| `events` | One row per website event | Website activity and sessions |
| `distribution_centers` | One row per distribution center | Fulfillment center attributes |

## Repository Structure

thelook-ecommerce-sales-analytics/
├── .gitignore
├── README.md
├── apps_script/
│   ├── Code.gs
│   ├── KpiAssistant.gs
│   ├── KpiAssistantUI.html
│   └── appsscript.json
├── docs/
│   ├── kpi_assistant.md
│   └── metric_definitions.md
├── python/
│   └── README.md
└── sql/
    ├── 00_source_validation.sql
    ├── 01_daily_sales_profit.sql
    ├── 02_monthly_sales_profit.sql
    ├── 03_product_category_performance.sql
    ├── 04_returns_cancellations.sql
    ├── 05_repeat_customer_analysis.sql
    └── 06_monthly_customer_trend.sql

## Analytics Workflow

1. Explore source tables and document their grains.
2. Validate keys, row counts, statuses, and joins.
3. Define business metrics and status-handling rules.
4. Use BigQuery SQL to analyze daily and monthly sales, product category
   performance, returns and cancellations, and customer metrics.
5. Export query results to Google Sheets for dashboarding.
6. Build a three-page Looker Studio dashboard using the Sheets data sources.

## Dashboard

[View the TheLook Sales Analytics Dashboard](https://datastudio.google.com/u/0/reporting/fda73521-9268-4487-8dc3-d923722a7903/page/h2TBG)

The dashboard contains three pages:

1. **Sales Overview** — completed sales, completed orders, units sold, gross
   profit, and monthly sales and profit trends.
2. **Product & Category Performance** — completed sales and gross profit by
   product category, units sold, and overall gross margin.
3. **Order & Customer Insights** — order counts by status, monthly purchasing
   customer trend, and lifetime repeat-customer rate.

Dashboard amounts are shown in source dataset units without a currency symbol.
Sales and profitability metrics use orders with `Complete` status under the
project’s initial metric policy. The latest month in a trend may be incomplete.

## Metric Definitions

| Metric | Definition |
|---|---|
| Completed sales | Sum of `order_items.sale_price` for items whose order status is `Complete` |
| Completed orders | Distinct count of orders whose status is `Complete` |
| Units sold | Count of order-item rows for orders whose status is `Complete` |
| Average order value | Completed sales divided by completed orders |
| Cost of goods sold | Sum of `inventory_items.cost` for completed order items |
| Gross profit | Completed sales minus cost of goods sold |
| Gross margin % | Gross profit divided by completed sales |
| Returns | Returned item count and sale value, reported separately |
| Cancellations | Cancelled order count, reported separately |
| Monthly purchasing customers | Distinct customers with a completed order in each month |
| Lifetime repeat customer rate | Customers with more than one completed order divided by customers with at least one completed order |

See [`docs/metric_definitions.md`](docs/metric_definitions.md) for additional
metric and business-rule details.

## Validation Findings

These exploratory validation results reflect the data at the time of the
latest validation run. Rerun the validation queries to confirm them against
the current source data.

- `orders.order_id` was checked for uniqueness and nulls.
- The sum of `orders.num_of_item` reconciled to the row count in `order_items`.
- The observed order-status and item-status pairs matched for all five statuses:
  `Cancelled`, `Complete`, `Processing`, `Returned`, and `Shipped`.
- All **181,081** order-item rows matched an inventory item; there were zero
  missing matches and **181,081** distinct inventory IDs.

## Key Findings

Exploratory results at the time of analysis:

- Completed sales: **2,717,510.70** source units
- Completed orders: **31,270**
- Units sold: **45,271**
- Cost of goods sold: **1,305,896.67** source units
- Gross profit: **1,411,614.03** source units
- Overall gross margin: **51.95%**
- Lifetime repeat customer rate: **12.08%**
- **Outerwear & Coats** had the highest completed sales and gross profit among
  product categories in the analysis.

These figures are snapshots from the analysis and may change as the public
dataset is updated.

## Tools

- Google BigQuery and BigQuery SQL
- Google Sheets
- Looker Studio (now named Data Studio)

## Scope and Limitations

- The source tables do not provide a currency field. Values are shown in
  source dataset units and are not presented as a converted currency amount.
- The `Complete` status filter is a project business rule, not a universal
  accounting definition of recognized revenue. Another business may treat
  shipped, returned, or other statuses differently.
- Gross profit here is sale price minus item cost. It does not include other
  expenses such as shipping, marketing, payment processing, or operating costs.
- This is a portfolio analysis of a fictional business using a public dataset;
  findings should not be interpreted as actual company performance.
- Dashboard data is currently sourced through Google Sheets. Refresh
  automation and a conversational analytics assistant are planned extensions,
  not completed project components.


## Automated dashboard refresh

A Google Apps Script project refreshes the Google Sheets tabs used by the
Looker Studio dashboard. A daily time-driven trigger runs
`checkSourceAndRefresh()`.

The script checks BigQuery metadata for the source tables used by the
dashboard. It compares each table’s last-modified time and row count with the
last successful refresh fingerprint stored in the `refresh_control` sheet tab.

- If the fingerprint has not changed, the script skips the dashboard queries.
- If a change is detected, or the script is running for the first time, it
  runs `refreshDashboardData()` and updates the dashboard tabs.
- The fingerprint is saved after a successful refresh.

Because the check runs daily, a source update may take up to a day to appear
in the dashboard. BigQuery query processing and Apps Script quotas apply when
a full refresh runs.


## Conversational KPI Assistant

The Apps Script assistant answers supported questions about completed sales,
gross margin, product categories, order status, and customer purchasing
behavior using the latest published dashboard snapshot.

- **Interface:** Google Apps Script web app
- **Dashboard placement:** URL embed beside the Sales Overview page in Looker Studio
- **Context:** Aggregate data from the five Google Sheets dashboard tabs
- **Refresh:** The assistant snapshot is published after a successful dashboard
  refresh
- **Secret storage:** Gemini API key is stored in Apps Script Script Properties,
  not in the repository

See [`docs/kpi_assistant.md`](docs/kpi_assistant.md) for the architecture,
metric definitions, configuration, and deployment details.
