
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

interface RealtimeEvent {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: any;
  new?: any;
  timestamp: Date;
}

interface OptimisticUpdate {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  rollback: () => void;
  timestamp: Date;
}

interface EnhancedRealtimeContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastEvent: RealtimeEvent | null;
  optimisticUpdates: OptimisticUpdate[];
  // Event subscription methods
  subscribeToTable: (table: string, callback: (event: RealtimeEvent) => void) => string;
  unsubscribeFromTable: (subscriptionId: string) => void;
  // Optimistic update methods
  addOptimisticUpdate: (update: Omit<OptimisticUpdate, 'timestamp'>) => void;
  removeOptimisticUpdate: (id: string) => void;
  rollbackOptimisticUpdate: (id: string) => void;
  // Connection management
  reconnect: () => Promise<void>;
  getConnectionHealth: () => { isHealthy: boolean; lastPing?: Date; latency?: number };
}

const EnhancedRealtimeContext = createContext<EnhancedRealtimeContextType | undefined>(undefined);

export const useEnhancedRealtime = () => {
  const context = useContext(EnhancedRealtimeContext);
  if (!context) {
    throw new Error('useEnhancedRealtime must be used within an EnhancedRealtimeProvider');
  }
  return context;
};

export const EnhancedRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const { setLoading } = useGlobalLoading();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);

  const channelsRef = useRef<Map<string, any>>(new Map());
  const subscribersRef = useRef<Map<string, (event: RealtimeEvent) => void>>(new Map());
  const healthCheckRef = useRef<{ lastPing?: Date; latency?: number }>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Health check interval
  const performHealthCheck = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      // Simple ping to check connection
      const { data, error } = await supabase.from('tenants').select('id').limit(1);
      
      if (!error) {
        const latency = Date.now() - startTime;
        healthCheckRef.current = {
          lastPing: new Date(),
          latency
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, []);

  // Setup main realtime connection
  const setupRealtimeConnection = useCallback(async () => {
    if (!user || !session) return;

    setConnectionStatus('connecting');
    setLoading('realtime-connection', true);

    try {
      // Main channel for all table changes
      const mainChannel = supabase.channel('main-realtime-channel');
      
      // Subscribe to multiple tables
      const tables = ['contracts', 'vehicles', 'customers', 'invoices', 'payments', 'employees'];
      
      tables.forEach(table => {
        mainChannel
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table },
            (payload) => handleRealtimeEvent(table, 'INSERT', payload)
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table },
            (payload) => handleRealtimeEvent(table, 'UPDATE', payload)
          )
          .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table },
            (payload) => handleRealtimeEvent(table, 'DELETE', payload)
          );
      });

      mainChannel.subscribe((status) => {
        console.log('📡 Realtime Status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          setLoading('realtime-connection', false);
          toast.success('تم الاتصال بنظام التحديث المباشر');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          handleConnectionLost();
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setLoading('realtime-connection', false, 'خطأ في الاتصال');
          handleConnectionError();
        }
      });

      channelsRef.current.set('main', mainChannel);

    } catch (error) {
      console.error('Realtime setup failed:', error);
      setConnectionStatus('error');
      setLoading('realtime-connection', false, 'فشل في إعداد التحديث المباشر');
    }
  }, [user, session, setLoading]);

  const handleRealtimeEvent = useCallback((table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
    const realtimeEvent: RealtimeEvent = {
      table,
      event,
      old: payload.old,
      new: payload.new,
      timestamp: new Date()
    };

    setLastEvent(realtimeEvent);

    // Notify subscribers
    subscribersRef.current.forEach(callback => {
      try {
        callback(realtimeEvent);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });

    // Clean up matching optimistic updates
    if (payload.new?.id) {
      setOptimisticUpdates(prev => 
        prev.filter(update => !(update.table === table && update.data.id === payload.new.id))
      );
    }
  }, []);

  const handleConnectionLost = useCallback(() => {
    toast.warning('انقطع الاتصال بنظام التحديث المباشر');
    
    // Auto-reconnect after delay
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnect();
    }, 3000);
  }, []);

  const handleConnectionError = useCallback(() => {
    toast.error('خطأ في نظام التحديث المباشر');
    
    // Retry connection after longer delay
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnect();
    }, 10000);
  }, []);

  const subscribeToTable = useCallback((table: string, callback: (event: RealtimeEvent) => void): string => {
    const subscriptionId = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    subscribersRef.current.set(subscriptionId, callback);
    return subscriptionId;
  }, []);

  const unsubscribeFromTable = useCallback((subscriptionId: string) => {
    subscribersRef.current.delete(subscriptionId);
  }, []);

  const addOptimisticUpdate = useCallback((update: Omit<OptimisticUpdate, 'timestamp'>) => {
    const optimisticUpdate: OptimisticUpdate = {
      ...update,
      timestamp: new Date()
    };
    
    setOptimisticUpdates(prev => [...prev, optimisticUpdate]);
    
    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      removeOptimisticUpdate(update.id);
    }, 30000);
  }, []);

  const removeOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => prev.filter(update => update.id !== id));
  }, []);

  const rollbackOptimisticUpdate = useCallback((id: string) => {
    const update = optimisticUpdates.find(u => u.id === id);
    if (update) {
      update.rollback();
      removeOptimisticUpdate(id);
      toast.info('تم التراجع عن التحديث');
    }
  }, [optimisticUpdates, removeOptimisticUpdate]);

  const reconnect = useCallback(async () => {
    // Cleanup existing connections
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    
    setIsConnected(false);
    await setupRealtimeConnection();
  }, [setupRealtimeConnection]);

  const getConnectionHealth = useCallback(() => {
    return {
      isHealthy: isConnected && connectionStatus === 'connected',
      ...healthCheckRef.current
    };
  }, [isConnected, connectionStatus]);

  // Initialize connection
  useEffect(() => {
    setupRealtimeConnection();
    
    // Setup health check interval
    const healthInterval = setInterval(performHealthCheck, 30000);
    
    return () => {
      clearInterval(healthInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [setupRealtimeConnection, performHealthCheck]);

  return (
    <EnhancedRealtimeContext.Provider value={{
      isConnected,
      connectionStatus,
      lastEvent,
      optimisticUpdates,
      subscribeToTable,
      unsubscribeFromTable,
      addOptimisticUpdate,
      removeOptimisticUpdate,
      rollbackOptimisticUpdate,
      reconnect,
      getConnectionHealth
    }}>
      {children}
    </EnhancedRealtimeContext.Provider>
  );
};
