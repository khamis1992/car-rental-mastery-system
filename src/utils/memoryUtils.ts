// Memory leak detection and prevention utilities

export interface MemoryLeakDetector {
  name: string;
  check: () => boolean;
  cleanup?: () => void;
  description: string;
}

// Weak reference registry for tracking object cleanup
const objectRegistry = new WeakMap();
const cleanupRegistry = new Map<string, (() => void)[]>();

/**
 * Register an object for memory leak tracking
 */
export const registerForCleanup = (key: string, cleanup: () => void) => {
  if (!cleanupRegistry.has(key)) {
    cleanupRegistry.set(key, []);
  }
  cleanupRegistry.get(key)!.push(cleanup);
};

/**
 * Cleanup all registered cleanup functions for a key
 */
export const performCleanup = (key: string) => {
  const cleanups = cleanupRegistry.get(key);
  if (cleanups) {
    cleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error(`Cleanup error for ${key}:`, error);
      }
    });
    cleanupRegistry.delete(key);
  }
};

/**
 * Clear all cleanup registrations
 */
export const clearAllCleanups = () => {
  cleanupRegistry.forEach((cleanups, key) => {
    performCleanup(key);
  });
};

/**
 * Track object with weak reference
 */
export const trackObject = (obj: object, metadata: any) => {
  objectRegistry.set(obj, metadata);
};

/**
 * Common memory leak detectors
 */
export const memoryLeakDetectors: MemoryLeakDetector[] = [
  {
    name: 'dom-listeners',
    description: 'DOM event listeners not properly removed',
    check: () => {
      // This is a basic check - in real scenarios you'd track listeners
      const eventListenerCount = (window as any).__eventListenerCount || 0;
      return eventListenerCount > 100; // Arbitrary threshold
    }
  },
  {
    name: 'timers',
    description: 'Active timers (setInterval/setTimeout) not cleared',
    check: () => {
      // Track active timers - implementation depends on how you track them
      const activeTimers = (window as any).__activeTimers || new Set();
      return activeTimers.size > 10; // Arbitrary threshold
    }
  },
  {
    name: 'xhr-requests',
    description: 'Pending XHR/fetch requests not aborted',
    check: () => {
      const pendingRequests = (window as any).__pendingRequests || new Set();
      return pendingRequests.size > 5; // Arbitrary threshold
    }
  },
  {
    name: 'component-subscriptions',
    description: 'Component subscriptions not unsubscribed',
    check: () => {
      const activeSubscriptions = (window as any).__activeSubscriptions || new Map();
      return activeSubscriptions.size > 20; // Arbitrary threshold
    }
  }
];

/**
 * Run all memory leak detectors
 */
export const detectMemoryLeaks = (): { detected: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  memoryLeakDetectors.forEach(detector => {
    try {
      if (detector.check()) {
        issues.push(`${detector.name}: ${detector.description}`);
      }
    } catch (error) {
      console.error(`Error running detector ${detector.name}:`, error);
    }
  });
  
  return {
    detected: issues.length > 0,
    issues
  };
};

/**
 * Safe timer management
 */
export class SafeTimer {
  private timers = new Set<NodeJS.Timeout>();
  
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    
    this.timers.add(timer);
    return timer;
  }
  
  setInterval(callback: () => void, interval: number): NodeJS.Timeout {
    const timer = setInterval(callback, interval);
    this.timers.add(timer);
    return timer;
  }
  
  clearTimer(timer: NodeJS.Timeout) {
    if (this.timers.has(timer)) {
      clearTimeout(timer);
      clearInterval(timer);
      this.timers.delete(timer);
    }
  }
  
  clearAll() {
    this.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();
  }
  
  get activeCount() {
    return this.timers.size;
  }
}

/**
 * Safe event listener management
 */
export class SafeEventManager {
  private listeners = new Map<EventTarget, Map<string, EventListener[]>>();
  
  addEventListener(
    target: EventTarget, 
    event: string, 
    listener: EventListener, 
    options?: AddEventListenerOptions
  ) {
    target.addEventListener(event, listener, options);
    
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }
    
    const targetListeners = this.listeners.get(target)!;
    if (!targetListeners.has(event)) {
      targetListeners.set(event, []);
    }
    
    targetListeners.get(event)!.push(listener);
  }
  
  removeEventListener(target: EventTarget, event: string, listener: EventListener) {
    target.removeEventListener(event, listener);
    
    const targetListeners = this.listeners.get(target);
    if (targetListeners) {
      const eventListeners = targetListeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }
  
  removeAllListeners(target?: EventTarget) {
    if (target) {
      const targetListeners = this.listeners.get(target);
      if (targetListeners) {
        targetListeners.forEach((listeners, event) => {
          listeners.forEach(listener => {
            target.removeEventListener(event, listener);
          });
        });
        this.listeners.delete(target);
      }
    } else {
      // Remove all listeners for all targets
      this.listeners.forEach((targetListeners, target) => {
        targetListeners.forEach((listeners, event) => {
          listeners.forEach(listener => {
            target.removeEventListener(event, listener);
          });
        });
      });
      this.listeners.clear();
    }
  }
  
  get stats() {
    let totalListeners = 0;
    let targetCount = 0;
    
    this.listeners.forEach((targetListeners) => {
      targetCount++;
      targetListeners.forEach((listeners) => {
        totalListeners += listeners.length;
      });
    });
    
    return { totalListeners, targetCount };
  }
}

/**
 * Safe AbortController manager
 */
export class SafeAbortManager {
  private controllers = new Set<AbortController>();
  
  create(): AbortController {
    const controller = new AbortController();
    this.controllers.add(controller);
    
    // Auto-remove when aborted
    controller.signal.addEventListener('abort', () => {
      this.controllers.delete(controller);
    });
    
    return controller;
  }
  
  abortAll() {
    this.controllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.controllers.clear();
  }
  
  get activeCount() {
    return this.controllers.size;
  }
}

/**
 * Memory usage formatter
 */
export const formatMemorySize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if memory API is available
 */
export const isMemoryAPIAvailable = (): boolean => {
  return 'memory' in window.performance && 
         'usedJSHeapSize' in (window.performance as any).memory;
};

/**
 * Get current memory usage (if available)
 */
export const getCurrentMemoryUsage = () => {
  if (!isMemoryAPIAvailable()) {
    return null;
  }
  
  const memory = (window.performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  };
};

/**
 * Create a memory-safe cleanup function
 */
export const createMemorySafeCleanup = (cleanupFns: (() => void)[]): (() => void) => {
  return () => {
    cleanupFns.forEach((fn, index) => {
      try {
        fn();
      } catch (error) {
        console.error(`Cleanup function ${index} failed:`, error);
      }
    });
  };
};