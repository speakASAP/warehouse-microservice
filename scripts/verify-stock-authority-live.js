#!/usr/bin/env node

const { Client } = require('pg');

const DEFAULT_PRODUCT_IDS = [
  'ce4a51aa-2d12-4ab7-a965-7a36609d01fc',
  'd8c962ad-1717-430e-932e-a2ebc870233e',
  '4090f93b-e8a7-4a08-a21f-3ae645620910',
  '1db1cac0-db7f-4b29-bcb3-1055f8955b81',
  'dbc51dde-fc66-4511-b178-f929183f4647',
  '884c1c5e-fe94-46c7-aab1-78bcc424e7ee',
  '87b1bdb1-2cdb-458b-97d0-77ee7814b30f',
  '53fb68c9-c8e8-4490-a145-1f3d0094c86d',
  '8bba517b-e5c6-41c4-9bb3-92108f4f84c3',
];

function parseCsv(value, fallback = []) {
  const source = value || fallback.join(',');
  return Array.from(new Set(String(source).split(',').map((item) => item.trim()).filter(Boolean)));
}

function parseExpectedTotals(value) {
  if (!value) return {};
  if (value.trim().startsWith('{')) return JSON.parse(value);
  return Object.fromEntries(String(value).split(',').map((entry) => {
    const [productId, total] = entry.split('=').map((part) => part.trim());
    if (!productId || total === undefined) throw new Error(`Invalid expected total entry: ${entry}`);
    return [productId, Number(total)];
  }));
}

function databaseConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || 'db-server-postgres',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'dbadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'warehouse_db',
  };
}

function intValue(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function queryRows(client, text, productIds) {
  return client.query(text, [productIds]).then((result) => result.rows);
}

async function main() {
  const productIds = parseCsv(process.env.WAREHOUSE_VERIFY_PRODUCT_IDS, DEFAULT_PRODUCT_IDS);
  const expectedTotals = parseExpectedTotals(process.env.WAREHOUSE_VERIFY_EXPECTED_TOTALS || '');
  const client = new Client(databaseConfig());
  await client.connect();

  try {
    const [stockRows, movementRows, outboxRows, reservationRows] = await Promise.all([
      queryRows(client, `
        SELECT
          s."productId" AS "productId",
          s.warehouse_id AS "warehouseId",
          w.code AS "warehouseCode",
          w.type AS "warehouseType",
          s.quantity,
          s.reserved,
          s.available
        FROM stock s
        LEFT JOIN warehouses w ON w.id = s.warehouse_id
        WHERE s."productId" = ANY($1)
        ORDER BY s."productId", s.warehouse_id
      `, productIds),
      queryRows(client, `
        SELECT DISTINCT ON (m."productId")
          m."productId" AS "productId",
          m.type,
          m.quantity,
          m.reference,
          m.reason,
          m."createdBy",
          m."createdAt"
        FROM stock_movements m
        WHERE m."productId" = ANY($1)
        ORDER BY m."productId", m."createdAt" DESC
      `, productIds),
      queryRows(client, `
        SELECT
          o."productId" AS "productId",
          o.status,
          COUNT(*)::int AS count
        FROM stock_event_outbox o
        WHERE o."productId" = ANY($1)
        GROUP BY o."productId", o.status
        ORDER BY o."productId", o.status
      `, productIds),
      queryRows(client, `
        SELECT
          r."productId" AS "productId",
          COALESCE(SUM(CASE WHEN r.status = 'active' THEN r.quantity ELSE 0 END), 0)::int AS "activeReserved",
          COUNT(*) FILTER (WHERE r.status = 'active')::int AS "activeCount"
        FROM stock_reservations r
        WHERE r."productId" = ANY($1)
        GROUP BY r."productId"
        ORDER BY r."productId"
      `, productIds),
    ]);

    const byProduct = new Map(productIds.map((productId) => [productId, {
      productId,
      totalQuantity: 0,
      totalReserved: 0,
      totalAvailable: 0,
      rowCount: 0,
      warehouses: [],
      latestMovement: null,
      outbox: {},
      activeReservations: { count: 0, quantity: 0 },
      issues: [],
    }]));

    for (const row of stockRows) {
      const product = byProduct.get(row.productId);
      if (!product) continue;
      const quantity = intValue(row.quantity);
      const reserved = intValue(row.reserved);
      const available = intValue(row.available);
      product.totalQuantity += quantity;
      product.totalReserved += reserved;
      product.totalAvailable += available;
      product.rowCount += 1;
      if (available !== quantity - reserved) {
        product.issues.push(`stock invariant failed for warehouse ${row.warehouseId}`);
      }
      if (quantity < 0 || reserved < 0 || available < 0) {
        product.issues.push(`negative stock value for warehouse ${row.warehouseId}`);
      }
      product.warehouses.push({
        warehouseId: row.warehouseId,
        warehouseCode: row.warehouseCode || null,
        warehouseType: row.warehouseType || null,
        quantity,
        reserved,
        available,
      });
    }

    for (const row of movementRows) {
      const product = byProduct.get(row.productId);
      if (!product) continue;
      product.latestMovement = {
        type: row.type,
        quantity: intValue(row.quantity),
        reference: row.reference || null,
        reason: row.reason || null,
        createdBy: row.createdBy || null,
        createdAt: row.createdAt,
      };
    }

    for (const row of outboxRows) {
      const product = byProduct.get(row.productId);
      if (!product) continue;
      product.outbox[row.status] = intValue(row.count);
    }

    for (const row of reservationRows) {
      const product = byProduct.get(row.productId);
      if (!product) continue;
      product.activeReservations = {
        count: intValue(row.activeCount),
        quantity: intValue(row.activeReserved),
      };
    }

    const products = Array.from(byProduct.values());
    for (const product of products) {
      if (product.rowCount === 0) product.issues.push('missing stock row');
      if (!product.latestMovement) product.issues.push('missing movement evidence');
      if (Object.keys(product.outbox).length === 0) product.issues.push('missing outbox evidence');
      if (expectedTotals[product.productId] !== undefined && product.totalAvailable !== Number(expectedTotals[product.productId])) {
        product.issues.push(`expected totalAvailable ${expectedTotals[product.productId]}, got ${product.totalAvailable}`);
      }
    }

    const failedProducts = products.filter((product) => product.issues.length > 0);
    const summary = {
      contract: 'warehouse-stock-authority-live.v1',
      mutatesWarehouse: false,
      checkedProductCount: products.length,
      failedProductCount: failedProducts.length,
      totalQuantity: products.reduce((sum, product) => sum + product.totalQuantity, 0),
      totalReserved: products.reduce((sum, product) => sum + product.totalReserved, 0),
      totalAvailable: products.reduce((sum, product) => sum + product.totalAvailable, 0),
      expectedTotalsChecked: Object.keys(expectedTotals).length,
      products,
    };

    console.log(JSON.stringify(summary, null, 2));
    if (failedProducts.length > 0) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`warehouse stock authority verification failed: ${error.stack || error.message}`);
  process.exit(1);
});
