import { useState, useEffect, useRef, useCallback } from 'react';

export interface MemoryMetrics {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  heapUsagePercent: number;
  timestamp: Date;
}

export interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  threshold: number;
  current: number;
  timestamp: Date;
}

export interface MemoryMonitorOptions {
  warningThreshold?: number; // Percentage (default: 75%)
  criticalThreshold?: number; // Percentage (default: 90%)
  monitorInterval?: number; // ms (default: 30000 - 30 seconds)
  maxHistory?: number; // number of entries (default: 100)
  onAlert?: (alert: MemoryAlert) => void;
  enabled?: boolean;
}

export const useMemoryMonitor = (options: MemoryMonitorOptions = {}) => {
  const {
    warningThreshold = 75,
    criticalThreshold = 90,
    monitorInterval = 30000,
    maxHistory = 100,
    onAlert,
    enabled = true
  } = options;

  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [history, setHistory] = useState<MemoryMetrics[]>([]);
  const [alerts, setAlerts] = useState<MemoryAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertRef = useRef<{ warning: number; critical: number }>({
    warning: 0,
    critical: 0
  });

  // Check if browser supports memory API
  const isSupported = useCallback(() => {
    return 'memory' in window.performance && 
           'usedJSHeapSize' in (window.performance as any).memory;
  }, []);

  // Get current memory metrics
  const getCurrentMetrics = useCallback((): MemoryMetrics | null => {
    if (!isSupported()) {
      console.warn('Memory monitoring not supported in this browser');
      return null;
    }

    try {
      const memory = (window.performance as any).memory;
      const heapUsagePercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        heapUsagePercent,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting memory metrics:', error);
      return null;
    }
  }, [isSupported]);

  // Create alert if thresholds are exceeded
  const checkThresholds = useCallback((currentMetrics: MemoryMetrics) => {
    const now = Date.now();
    const { heapUsagePercent } = currentMetrics;

    // Prevent alert spam (minimum 5 minutes between same type alerts)
    const alertCooldown = 5 * 60 * 1000; // 5 minutes

    if (heapUsagePercent >= criticalThreshold && 
        now - lastAlertRef.current.critical > alertCooldown) {
      
      const alert: MemoryAlert = {
        type: 'critical',
        message: `Critical memory usage: ${heapUsagePercent}%`,
        threshold: criticalThreshold,
        current: heapUsagePercent,
        timestamp: new Date()
      };

      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
      lastAlertRef.current.critical = now;
      
      if (onAlert) {
        onAlert(alert);
      }
      
      console.error('🚨 Critical memory usage detected:', alert);
      
    } else if (heapUsagePercent >= warningThreshold && 
               now - lastAlertRef.current.warning > alertCooldown) {
      
      const alert: MemoryAlert = {
        type: 'warning',
        message: `High memory usage: ${heapUsagePercent}%`,
        threshold: warningThreshold,
        current: heapUsagePercent,
        timestamp: new Date()
      };

      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
      lastAlertRef.current.warning = now;
      
      if (onAlert) {
        onAlert(alert);
      }
      
      console.warn('⚠️ High memory usage detected:', alert);
    }
  }, [criticalThreshold, warningThreshold, onAlert]);

  // Monitor memory usage
  const monitor = useCallback(() => {
    const currentMetrics = getCurrentMetrics();
    
    if (!currentMetrics) {
      return;
    }

    setMetrics(currentMetrics);
    
    setHistory(prev => {
      const newHistory = [currentMetrics, ...prev.slice(0, maxHistory - 1)];
      return newHistory;
    });

    checkThresholds(currentMetrics);
  }, [getCurrentMetrics, maxHistory, checkThresholds]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!enabled || !isSupported() || isMonitoring) {
      return;
    }

    console.log('🔍 Starting memory monitoring...');
    setIsMonitoring(true);
    
    // Initial measurement
    monitor();
    
    // Set up interval
    intervalRef.current = setInterval(monitor, monitorInterval);
  }, [enabled, isSupported, isMonitoring, monitor, monitorInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Stopping memory monitoring...');
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Force garbage collection (if available)
  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      console.log('🗑️ Forcing garbage collection...');
      (window as any).gc();
      
      // Take measurement after GC
      setTimeout(monitor, 1000);
      return true;
    } else {
      console.warn('Garbage collection not available (run with --js-flags="--expose-gc")');
      return false;
    }
  }, [monitor]);

  // Clear history and alerts
  const clearData = useCallback(() => {
    setHistory([]);
    setAlerts([]);
    lastAlertRef.current = { warning: 0, critical: 0 };
  }, []);

  // Auto start/stop monitoring based on enabled flag
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);

  // Calculate trends
  const getTrend = useCallback((minutes: number = 5) => {
    if (history.length < 2) return 'stable';
    
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentMetrics = history.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMetrics.length < 2) return 'stable';
    
    const first = recentMetrics[recentMetrics.length - 1];
    const last = recentMetrics[0];
    const change = last.heapUsagePercent - first.heapUsagePercent;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }, [history]);

  return {
    // Current state
    metrics,
    history,
    alerts,
    isMonitoring,
    isSupported: isSupported(),
    
    // Control functions
    startMonitoring,
    stopMonitoring,
    monitor,
    forceGarbageCollection,
    clearData,
    
    // Analysis
    getTrend,
    
    // Stats
    stats: {
      measurementCount: history.length,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.type === 'critical').length,
      warningAlerts: alerts.filter(a => a.type === 'warning').length,
      averageUsage: history.length > 0 
        ? Math.round(history.reduce((sum, m) => sum + m.heapUsagePercent, 0) / history.length)
        : 0,
      trend: getTrend()
    }
  };
};