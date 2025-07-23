import { toast } from 'sonner';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  compressionThreshold: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      compressionThreshold: config.compressionThreshold || 1024 * 10, // 10KB
    };
  }

  set<T>(key: string, data: T, ttl?: number): void {
    try {
      // Remove expired items if cache is full
      if (this.cache.size >= this.config.maxSize) {
        this.cleanup();
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
      };

      this.cache.set(key, item);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.missCount++;
        return null;
      }

      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.missCount++;
        return null;
      }

      this.hitCount++;
      return item.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired items first
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // If still too many items, remove oldest ones
    if (this.cache.size >= this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.cache.size - Math.floor(this.config.maxSize * 0.8);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} items`);
    }
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) : '0.00',
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): string {
    const size = new Blob([JSON.stringify(Array.from(this.cache.entries()))]).size;
    
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  // Batch operations
  setMany<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    items.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get<T>(key);
    });
    return result;
  }

  // Cache with fallback function
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fallback();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Cache fallback error for key ${key}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  maxSize: 2000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

// Cache key generators
export const CacheKeys = {
  // Dashboard
  dashboardStats: (tenantId: string) => `dashboard:stats:${tenantId}`,
  
  // Customers
  customers: (tenantId: string) => `customers:list:${tenantId}`,
  customer: (id: string) => `customer:${id}`,
  customerSearch: (tenantId: string, term: string) => `customers:search:${tenantId}:${term}`,
  
  // Vehicles
  vehicles: (tenantId: string) => `vehicles:list:${tenantId}`,
  vehicle: (id: string) => `vehicle:${id}`,
  availableVehicles: (tenantId: string) => `vehicles:available:${tenantId}`,
  
  // Contracts
  contracts: (tenantId: string) => `contracts:list:${tenantId}`,
  contract: (id: string) => `contract:${id}`,
  activeContracts: (tenantId: string) => `contracts:active:${tenantId}`,
  expiringContracts: (tenantId: string) => `contracts:expiring:${tenantId}`,
  
  // Payments
  payments: (tenantId: string) => `payments:list:${tenantId}`,
  payment: (id: string) => `payment:${id}`,
  paymentsByInvoice: (invoiceId: string) => `payments:invoice:${invoiceId}`,
  
  // Invoices
  invoices: (tenantId: string) => `invoices:list:${tenantId}`,
  invoice: (id: string) => `invoice:${id}`,
  overdueInvoices: (tenantId: string) => `invoices:overdue:${tenantId}`,
  
  // Static data
  chartOfAccounts: (tenantId: string) => `accounts:chart:${tenantId}`,
  costCenters: (tenantId: string) => `cost_centers:${tenantId}`,
  systemSettings: (tenantId: string) => `settings:${tenantId}`,
  
  // Reports
  financialReport: (tenantId: string, params: string) => `report:financial:${tenantId}:${params}`,
  vehicleReport: (tenantId: string, params: string) => `report:vehicle:${tenantId}:${params}`,
} as const;

// Cache invalidation patterns
export const CachePatterns = {
  dashboardAll: (tenantId: string) => `dashboard:.*:${tenantId}`,
  customersAll: (tenantId: string) => `customer.*:${tenantId}`,
  vehiclesAll: (tenantId: string) => `vehicle.*:${tenantId}`,
  contractsAll: (tenantId: string) => `contract.*:${tenantId}`,
  paymentsAll: (tenantId: string) => `payment.*:${tenantId}`,
  invoicesAll: (tenantId: string) => `invoice.*:${tenantId}`,
  reportsAll: (tenantId: string) => `report:.*:${tenantId}`,
  tenantAll: (tenantId: string) => `.*:${tenantId}`,
} as const;