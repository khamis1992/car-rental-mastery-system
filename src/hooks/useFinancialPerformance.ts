
import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  lastMeasurement: Date;
}

export const useFinancialPerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    lastMeasurement: new Date()
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        lastMeasurement: new Date()
      }));
      
      // Log performance if it's slow
      if (renderTime > 100) {
        console.warn(`⚠️ بطء في الأداء: ${componentName} استغرق ${renderTime.toFixed(2)}ms للرسم`);
      }
    };
  }, [componentName]);

  const measureDataLoad = useCallback((loadPromise: Promise<any>) => {
    const startTime = performance.now();
    
    return loadPromise.finally(() => {
      const endTime = performance.now();
      const dataLoadTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        dataLoadTime,
        lastMeasurement: new Date()
      }));
      
      if (dataLoadTime > 1000) {
        console.warn(`⚠️ بطء في تحميل البيانات: ${componentName} استغرق ${dataLoadTime.toFixed(2)}ms`);
      }
    });
  }, [componentName]);

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      const memoryInfo = getMemoryUsage();
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.used,
        lastMeasurement: new Date()
      }));
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [getMemoryUsage]);

  const getPerformanceReport = useCallback(() => {
    const report = {
      component: componentName,
      metrics,
      recommendations: []
    };

    // Add recommendations based on metrics
    if (metrics.renderTime > 100) {
      report.recommendations.push('فكر في استخدام React.memo أو useMemo لتحسين الأداء');
    }
    
    if (metrics.dataLoadTime > 1000) {
      report.recommendations.push('فكر في استخدام التخزين المؤقت أو pagination');
    }
    
    if (metrics.memoryUsage > 50) {
      report.recommendations.push('استهلاك الذاكرة مرتفع - تحقق من تسريبات الذاكرة');
    }

    return report;
  }, [componentName, metrics]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    isMonitoring,
    measureRenderTime,
    measureDataLoad,
    getPerformanceReport,
    startMonitoring
  };
};
