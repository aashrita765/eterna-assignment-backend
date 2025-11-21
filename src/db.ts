import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "dev",
  host: "127.0.0.1",
  database: "ordersdb",
  password: "dev",
  port: 5433,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      payload JSONB,
      status TEXT,
      meta JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function createOrderInDb({ orderId, payload, status }: any) {
  await pool.query(
    `INSERT INTO orders(order_id, payload, status) VALUES ($1,$2,$3)`,
    [orderId, payload, status]
  );
}

export async function persistOrderStatus(orderId: string, status: string, meta: any = {}) {
  await pool.query(
    `UPDATE orders SET status=$2, meta=$3 WHERE order_id=$1`,
    [orderId, status, meta]
  );
}
