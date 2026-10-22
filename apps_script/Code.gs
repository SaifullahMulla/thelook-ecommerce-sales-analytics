
/**
 * @OnlyCurrentDoc
 */

const BQ_PROJECT_ID = 'thelook-510909';
const BQ_LOCATION = 'US';

const REFRESH_JOBS = [
  {
    sheetName: 'monthly_sales',
    dateColumn: 1,
    sql: `
      WITH completed_items AS (
        SELECT
          o.order_id,
          DATE_TRUNC(DATE(o.created_at), MONTH) AS order_month,
          oi.sale_price,
          ii.cost
        FROM \`bigquery-public-data.thelook_ecommerce.order_items\` AS oi
        JOIN \`bigquery-public-data.thelook_ecommerce.orders\` AS o
          ON o.order_id = oi.order_id
        LEFT JOIN \`bigquery-public-data.thelook_ecommerce.inventory_items\` AS ii
          ON ii.id = oi.inventory_item_id
        WHERE o.status = 'Complete'
      )
      SELECT
        order_month,
        SAFE_DIVIDE(SUM(sale_price), COUNT(DISTINCT order_id))
          AS average_order_value,
        COUNT(DISTINCT order_id) AS completed_orders,
        SUM(sale_price) AS completed_sales,
        SUM(cost) AS cost_of_goods_sold,
        SAFE_DIVIDE(SUM(sale_price) - SUM(cost), SUM(sale_price))
          AS gross_margin_pct,
        SUM(sale_price) - SUM(cost) AS gross_profit,
        COUNT(*) AS units_sold
      FROM completed_items
      GROUP BY order_month
      ORDER BY order_month
    `
  },
  {
    sheetName: 'category_performance',
    sql: `
      SELECT
        p.category AS product_category,
        COUNT(*) AS units_sold,
        COUNT(DISTINCT oi.order_id) AS completed_orders,
        SUM(oi.sale_price) AS completed_sales,
        SUM(ii.cost) AS cost_of_goods_sold,
        SUM(oi.sale_price) - SUM(ii.cost) AS gross_profit,
        SAFE_DIVIDE(
          SUM(oi.sale_price) - SUM(ii.cost),
          SUM(oi.sale_price)
        ) AS gross_margin_pct,
        AVG(oi.sale_price) AS average_selling_price_per_unit
      FROM \`bigquery-public-data.thelook_ecommerce.order_items\` AS oi
      JOIN \`bigquery-public-data.thelook_ecommerce.orders\` AS o
        ON o.order_id = oi.order_id
      JOIN \`bigquery-public-data.thelook_ecommerce.products\` AS p
        ON p.id = oi.product_id
      LEFT JOIN \`bigquery-public-data.thelook_ecommerce.inventory_items\` AS ii
        ON ii.id = oi.inventory_item_id
      WHERE o.status = 'Complete'
      GROUP BY product_category
      ORDER BY completed_sales DESC
    `
  },
  {
    sheetName: 'order_status',
    sql: `
      WITH status_counts AS (
        SELECT
          status AS order_status,
          COUNT(*) AS order_count
        FROM \`bigquery-public-data.thelook_ecommerce.orders\`
        GROUP BY status
      )
      SELECT
        order_status,
        order_count,
        SUM(order_count) OVER () AS total_order_count,
        SAFE_DIVIDE(order_count, SUM(order_count) OVER ())
          AS share_of_all_orders
      FROM status_counts
      ORDER BY order_count DESC
    `
  },
  {
    sheetName: 'monthly_customers',
    dateColumn: 1,
    sql: `
      WITH completed_customer_months AS (
        SELECT
          user_id,
          DATE_TRUNC(DATE(created_at), MONTH) AS order_month
        FROM \`bigquery-public-data.thelook_ecommerce.orders\`
        WHERE status = 'Complete'
          AND user_id IS NOT NULL
        GROUP BY user_id, order_month
      ),
      first_completed_month AS (
        SELECT
          user_id,
          MIN(order_month) AS first_order_month
        FROM completed_customer_months
        GROUP BY user_id
      )
      SELECT
        c.order_month,
        COUNT(*) AS purchasing_customers,
        COUNTIF(c.order_month = f.first_order_month) AS new_customers,
        COUNTIF(c.order_month > f.first_order_month) AS repeat_customers,
        SAFE_DIVIDE(
          COUNTIF(c.order_month > f.first_order_month),
          COUNT(*)
        ) AS repeat_customer_share
      FROM completed_customer_months AS c
      JOIN first_completed_month AS f USING (user_id)
      GROUP BY c.order_month
      ORDER BY c.order_month
    `
  },
  {
    sheetName: 'customer_summary',
    sql: `
      WITH orders_per_customer AS (
        SELECT
          user_id,
          COUNT(*) AS completed_orders
        FROM \`bigquery-public-data.thelook_ecommerce.orders\`
        WHERE status = 'Complete'
          AND user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT
        COUNT(*) AS purchasing_customers,
        COUNTIF(completed_orders > 1) AS repeat_customers,
        SAFE_DIVIDE(
          COUNTIF(completed_orders > 1),
          COUNT(*)
        ) AS repeat_customer_rate,
        AVG(completed_orders) AS avg_completed_orders_per_customer,
        MAX(completed_orders) AS max_completed_orders_by_one_customer
      FROM orders_per_customer
    `
  }
];

function refreshDashboardData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Stop before querying if a destination tab is missing.
  const missingTabs = REFRESH_JOBS
    .filter(job => !spreadsheet.getSheetByName(job.sheetName))
    .map(job => job.sheetName);

  if (missingTabs.length > 0) {
    throw new Error('Missing sheet tabs: ' + missingTabs.join(', '));
  }

  // Run all queries before clearing any sheet.
  const results = REFRESH_JOBS.map(job => ({
    sheetName: job.sheetName,
    dateColumn: job.dateColumn,
    values: runBigQuery_(job.sql)
  }));

  // Replace each tab's contents while keeping the tab itself.
  results.forEach(result => {
    const sheet = spreadsheet.getSheetByName(result.sheetName);
    sheet.clearContents();

    sheet
      .getRange(1, 1, result.values.length, result.values[0].length)
      .setValues(result.values);

    if (result.dateColumn && result.values.length > 1) {
      sheet
        .getRange(2, result.dateColumn, result.values.length - 1, 1)
        .setNumberFormat('yyyy-mm-dd');
    }

    Logger.log(
      result.sheetName + ': refreshed ' + (result.values.length - 1) + ' rows.'
    );
  });
}

function runBigQuery_(sql) {
  let response = BigQuery.Jobs.query(
    {
      query: sql,
      useLegacySql: false,
      location: BQ_LOCATION,
      timeoutMs: 10000,
      maxResults: 10000
    },
    BQ_PROJECT_ID
  );

  const jobId = response.jobReference && response.jobReference.jobId;
  if (!jobId) {
    throw new Error('BigQuery did not return a query job ID.');
  }

  const startedAt = Date.now();

  while (!response.jobComplete) {
    if (Date.now() - startedAt > 120000) {
      throw new Error('BigQuery query did not finish within two minutes.');
    }

    Utilities.sleep(1000);
    response = BigQuery.Jobs.getQueryResults(
      BQ_PROJECT_ID,
      jobId,
      { location: BQ_LOCATION, maxResults: 10000 }
    );
  }

  if (response.errors && response.errors.length > 0) {
    throw new Error(JSON.stringify(response.errors));
  }

  const fields = response.schema.fields;
  const values = [fields.map(field => field.name)];
  let page = response;

  while (true) {
    (page.rows || []).forEach(row => {
      values.push(
        row.f.map((cell, index) =>
          convertBigQueryValue_(cell.v, fields[index].type)
        )
      );
    });

    if (!page.pageToken) {
      break;
    }

    page = BigQuery.Jobs.getQueryResults(
      BQ_PROJECT_ID,
      jobId,
      {
        location: BQ_LOCATION,
        maxResults: 10000,
        pageToken: page.pageToken
      }
    );
  }

  return values;
}

function convertBigQueryValue_(value, type) {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    ['INTEGER', 'INT64', 'FLOAT', 'FLOAT64', 'NUMERIC', 'BIGNUMERIC']
      .includes(type)
  ) {
    return Number(value);
  }

  if (type === 'DATE') {
    return new Date(value + 'T00:00:00');
  }

  if (type === 'BOOLEAN' || type === 'BOOL') {
    return value === 'true';
  }

  return value;
}

const SOURCE_TABLES = [
  { projectId: 'bigquery-public-data', datasetId: 'thelook_ecommerce', tableId: 'orders' },
  { projectId: 'bigquery-public-data', datasetId: 'thelook_ecommerce', tableId: 'order_items' },
  { projectId: 'bigquery-public-data', datasetId: 'thelook_ecommerce', tableId: 'inventory_items' },
  { projectId: 'bigquery-public-data', datasetId: 'thelook_ecommerce', tableId: 'products' }
];

function checkSourceAndRefresh() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let control = spreadsheet.getSheetByName('refresh_control');

  if (!control) {
    control = spreadsheet.insertSheet('refresh_control');
    control.getRange('A1:B3').setValues([
      ['setting', 'value'],
      ['source_fingerprint', ''],
      ['last_successful_refresh', '']
    ]);
  }

  const currentFingerprint = getSourceFingerprint_();
  const previousFingerprint = String(control.getRange('B2').getValue() || '');

  if (currentFingerprint === previousFingerprint) {
    Logger.log('No source changes detected. Full refresh skipped.');
    return;
  }

  Logger.log('Source change detected, or first run. Refreshing dashboard tabs.');

  // This is the refresh function you already tested.
  refreshDashboardData();

  // Save the fingerprint only after the full refresh succeeds.
  control.getRange('B2').setValue(currentFingerprint);
  control.getRange('B3').setValue(new Date());

  Logger.log('Refresh completed and source fingerprint saved.');
}

function getSourceFingerprint_() {
  return SOURCE_TABLES.map(table => {
    const metadata = BigQuery.Tables.get(
      table.projectId,
      table.datasetId,
      table.tableId,
      { view: 'STORAGE_STATS' }
    );

    return [
      table.tableId,
      metadata.lastModifiedTime || '',
      metadata.numRows || ''
    ].join(':');
  }).join('|');
}
