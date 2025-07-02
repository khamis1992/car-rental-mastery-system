export interface IRepository<T, K = string> {
  getAll(): Promise<T[]>;
  getById(id: K): Promise<T | null>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<void>;
}

export interface IQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface IRepositoryWithQuery<T, K = string> extends IRepository<T, K> {
  query(options: IQueryOptions): Promise<T[]>;
  count(filters?: Record<string, any>): Promise<number>;
}