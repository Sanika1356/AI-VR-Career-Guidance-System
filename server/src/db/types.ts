import type { QueryResult, QueryResultRow } from 'pg';

export interface DatabaseClient {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
  release(): void;
}

export interface DatabasePool {
  connect(): Promise<DatabaseClient>;
}
