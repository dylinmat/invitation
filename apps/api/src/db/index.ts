/**
 * Database Layer
 * PostgreSQL connection pool and query utilities
 */

import { Pool, QueryResult, QueryResultRow, PoolConfig } from "pg";
import { DATABASE } from "../config";

// Database configuration validation
if (!DATABASE.URL) {
  console.warn("DATABASE_URL is not set. Database access is disabled.");
}

// Pool configuration
const poolConfig: PoolConfig = {
  connectionString: DATABASE.URL,
  max: DATABASE.POOL_SIZE,
  connectionTimeoutMillis: DATABASE.CONNECTION_TIMEOUT,
  idleTimeoutMillis: DATABASE.IDLE_TIMEOUT,
};

// SSL configuration for production
if (DATABASE.SSL && typeof DATABASE.SSL === "object") {
  poolConfig.ssl = DATABASE.SSL;
}

// Create connection pool
export const pool: Pool | null = DATABASE.URL
  ? new Pool(poolConfig)
  : null;

// Handle pool errors
if (pool) {
  pool.on("error", (err: Error) => {
    console.error("Unexpected error on idle client", err);
  });
}

/**
 * Execute a SQL query with typed result
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result with typed rows
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error("Database not configured");
  }
  return pool.query<T>(text, params);
}

/**
 * Execute a query and return a single row
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Single row or null
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Array of rows
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a transaction with multiple queries
 * @param callback - Function that receives a query function and executes queries
 * @returns Result of the callback
 */
export async function transaction<T>(
  callback: (queryFn: <R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<QueryResult<R>>) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error("Database not configured");
  }

  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const result = await callback(<R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[]
    ) => client.query<R>(text, params));
    
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database connectivity
 * @returns True if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  if (!pool) {
    return false;
  }
  
  try {
    const result = await query<{ now: Date }>("SELECT NOW() as now");
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Close the database pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

// Default exports for compatibility
export default {
  pool,
  query,
  queryOne,
  queryMany,
  transaction,
  checkConnection,
  closePool,
};
