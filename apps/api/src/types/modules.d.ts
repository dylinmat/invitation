/**
 * Module declarations for packages without type definitions
 */

declare module "uuid" {
  export function v4(): string;
}

declare module "pg" {
  export interface QueryResultRow {
    [column: string]: unknown;
  }
  
  export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
    rows: T[];
    command: string;
    rowCount: number | null;
    oid: number;
    fields: unknown[];
  }
  
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    ssl?: boolean | { rejectUnauthorized: boolean };
  }
  
  export class Pool {
    constructor(config?: PoolConfig);
    query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    connect(): Promise<{
      query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
      release(): void;
    }>;
    end(): Promise<void>;
    on(event: "error", callback: (err: Error) => void): void;
    on(event: "connect", callback: () => void): void;
  }
}
