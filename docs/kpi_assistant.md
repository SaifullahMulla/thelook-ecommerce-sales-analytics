# Conversational KPI Assistant

## Purpose

The KPI Assistant lets dashboard viewers ask questions about the TheLook
e-commerce sales metrics in natural language. It is built with Google Apps
Script and displayed beside the Sales Overview page in Looker Studio.

## Data flow

1. BigQuery queries refresh the Google Sheets dashboard tabs.
2. The refresh workflow checks whether the source data has changed. If it has
   not changed, the full refresh is skipped.
3. After a successful refresh, `publishAssistantContext_()` publishes an
   aggregate snapshot for the assistant.
4. The assistant answers questions using that snapshot.

The assistant context uses these dashboard tabs:

- `monthly_sales`
- `category_performance`
- `order_status`
- `monthly_customers`
- `customer_summary`

The assistant uses deterministic calculations for supported headline KPIs,
including overall completed sales, overall gross margin, and latest-month
completed sales. Gemini handles other supported natural-language questions
using the published dashboard snapshot.

The assistant does not run arbitrary SQL for each question or expose raw
customer records.

## Metric definitions

- **Completed sales:** Sum of order-item `sale_price` for orders with status
  `Complete`.
- **Gross profit:** Completed item sales minus the associated inventory cost.
- **Overall gross margin:** Total gross profit divided by total completed sales.
  It is not the average of monthly or category margin percentages.
- **Latest-month completed sales:** Completed sales for the latest month present
  in the `monthly_sales` snapshot.

## Implementation files

- `apps_script/Code.gs` — BigQuery-to-Sheets refresh workflow and source-change
  handling.
- `apps_script/KpiAssistant.gs` — assistant server-side logic, snapshot
  publishing, and KPI responses.
- `apps_script/KpiAssistantUI.html` — chat interface served by the web app.
- `apps_script/appsscript.json` — Apps Script project configuration and
  required scopes.

## Deployment and dashboard

The assistant is deployed as an Apps Script web app. Its `doGet()` function
serves `KpiAssistantUI` and enables framing for the Looker Studio URL embed.

The production web app URL is:

https://script.google.com/macros/s/AKfycbx68RQv2Idvrwf2byJ5HUAkXknoqx0uJIp5P8WQSrvUIX0R0f-bu9ToGBUfCuUt35PZ/exec

The assistant is embedded on the Sales Overview page. That page's custom
canvas width was extended so the assistant is inside the report page and
appears in View mode.

## Configuration and security

- Store the Gemini API key in Apps Script **Script Properties** under
  `GEMINI_API_KEY`.
- Never commit API keys, OAuth tokens, or other credentials to GitHub.
- The assistant answers from the latest published snapshot. Its freshness
  depends on the refresh workflow completing successfully.
- Gemini responses can be temporarily unavailable if the service is busy.
