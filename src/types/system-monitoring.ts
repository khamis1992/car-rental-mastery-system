// System monitoring types
export interface SystemHealth {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
  };
  performance: {
    status: 'healthy' | 'warning' | 'critical';
    cpu: number;
    memory: number;
    disk: number;
  };
  security: {
    status: 'healthy' | 'warning' | 'critical';
    threats: number;
    vulnerabilities: number;
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    queries: number;
  };
  connectivity: {
    status: 'healthy' | 'warning' | 'critical';
    latency: number;
    uptime: number;
  };
}

export interface SmartAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  actionRequired: boolean;
  timestamp: string;
  source: string;
}

export interface SystemMetrics {
  server: any;
  serverStats: any;
  servers: any[];
  database: any;
  databases: any[];
  alerts: SmartAlert[];
}

export interface MaintenanceTask {
  id: string;
  name: string;
  category: 'security' | 'custom' | 'backup' | 'cleanup' | 'optimization' | 'monitoring';
  priority: 'high' | 'low' | 'medium' | 'critical';
  frequency: 'monthly' | 'daily' | 'weekly' | 'once';
  status: string;
}