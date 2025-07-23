
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface RealtimeEvent {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: any;
  new?: any;
  timestamp: Date;
}

export interface RealtimeSubscription {
  id: string;
  table: string;
  callback: (event: RealtimeEvent) => void;
  isActive: boolean;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  lastPing?: Date;
  latency?: number;
  reconnectAttempts: number;
  lastError?: string;
}

interface UnifiedRealtimeState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastEvent: RealtimeEvent | null;
  subscriptions: Map<string, RealtimeSubscription>;
  health: ConnectionHealth;
  eventHistory: RealtimeEvent[];
}

const MAX_HISTORY_SIZE = 100;
const HEALTH_CHECK_INTERVAL = 60000; // 60 seconds
const RECONNECT_DELAY = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const useUnifiedRealtime = () => {
  const { user, session } = useAuth();
  const { currentTenant } = useTenant();
  
  const [state, setState] = useState<UnifiedRealtimeState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastEvent: null,
    subscriptions: new Map(),
    health: {
      isHealthy: false,
      reconnectAttempts: 0
    },
    eventHistory: []
  });

  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionCounterRef = useRef(0);
  const isMountedRef = useRef(true);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Health check function
  const performHealthCheck = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.from('tenants').select('id').limit(1);
      
      if (!error) {
        const latency = Date.now() - startTime;
        setState(prev => ({
          ...prev,
          health: {
            ...prev.health,
            isHealthy: true,
            lastPing: new Date(),
            latency,
            lastError: undefined
          }
        }));
        return true;
      }
      throw error;
    } catch (error: any) {
      console.error('🏥 Health check failed:', error);
      setState(prev => ({
        ...prev,
        health: {
          ...prev.health,
          isHealthy: false,
          lastError: error.message
        }
      }));
      return false;
    }
  }, []);

  // Handle realtime events with memory protection
  const handleRealtimeEvent = useCallback((table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
    if (!isMountedRef.current) {
      console.warn('Ignoring realtime event on unmounted component');
      return;
    }
    
    const realtimeEvent: RealtimeEvent = {
      table,
      event,
      old: payload.old,
      new: payload.new,
      timestamp: new Date()
    };

    console.log('📡 Realtime event received:', realtimeEvent);

    setState(prev => {
      if (!isMountedRef.current) return prev;
      
      const newHistory = [realtimeEvent, ...prev.eventHistory.slice(0, MAX_HISTORY_SIZE - 1)];
      
      // Notify all active subscriptions for this table
      prev.subscriptions.forEach(subscription => {
        if (subscription.table === table && subscription.isActive && isMountedRef.current) {
          try {
            subscription.callback(realtimeEvent);
          } catch (error) {
            console.error('🚨 Subscription callback error:', error);
          }
        }
      });

      return {
        ...prev,
        lastEvent: realtimeEvent,
        eventHistory: newHistory
      };
    });
  }, []);

  // Setup realtime connection
  const setupConnection = useCallback(async () => {
    if (!user || !session || !currentTenant) {
      console.log('⏳ Missing auth or tenant, skipping connection setup');
      return;
    }

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    try {
      // Close existing channel if any
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create new channel
      const channel = supabase.channel(`unified-realtime-${currentTenant.id}`);

      // Subscribe to all relevant tables
      const tables = ['contracts', 'vehicles', 'customers', 'invoices', 'payments', 'employees', 'daily_tasks', 'attendance'];
      
      tables.forEach(table => {
        channel
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

      // Subscribe to channel
      channel.subscribe((status) => {
        console.log('📡 Unified Realtime Status:', status);
        
        setState(prev => {
          let newState = { ...prev };
          
          if (status === 'SUBSCRIBED') {
            newState.isConnected = true;
            newState.connectionStatus = 'connected';
            newState.health.reconnectAttempts = 0;
          } else if (status === 'CLOSED') {
            newState.isConnected = false;
            newState.connectionStatus = 'disconnected';
            // Only schedule reconnect if we had a previous successful connection
            if (prev.isConnected) {
              scheduleReconnect();
            }
          } else if (status === 'CHANNEL_ERROR') {
            newState.connectionStatus = 'error';
            newState.health.reconnectAttempts += 1;
            scheduleReconnect();
          }
          
          return newState;
        });
      });

      channelRef.current = channel;

    } catch (error: any) {
      console.error('🚨 Connection setup failed:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        health: {
          ...prev.health,
          lastError: error.message,
          reconnectAttempts: prev.health.reconnectAttempts + 1
        }
      }));
      scheduleReconnect();
    }
  }, [user, session, currentTenant, handleRealtimeEvent]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setState(prev => {
      if (prev.health.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('🚨 Max reconnect attempts reached, stopping reconnection');
        return { ...prev, connectionStatus: 'error' };
      }

      console.log(`🔄 Scheduling reconnect attempt ${prev.health.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      return { 
        ...prev, 
        connectionStatus: 'reconnecting',
        health: {
          ...prev.health,
          reconnectAttempts: prev.health.reconnectAttempts + 1
        }
      };
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      setupConnection();
    }, RECONNECT_DELAY);
  }, [setupConnection]);

  // Subscribe to table changes with memory leak protection
  const subscribe = useCallback((table: string, callback: (event: RealtimeEvent) => void): string => {
    if (!isMountedRef.current) {
      console.warn('Attempted to subscribe while component is unmounted');
      return '';
    }
    
    const subscriptionId = `${table}_${++subscriptionCounterRef.current}`;
    
    setState(prev => {
      const newSubscriptions = new Map(prev.subscriptions);
      newSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        table,
        callback,
        isActive: true
      });
      
      return {
        ...prev,
        subscriptions: newSubscriptions
      };
    });

    console.log('📝 New subscription created:', subscriptionId, 'for table:', table);
    return subscriptionId;
  }, []);

  // Unsubscribe from table changes with cleanup
  const unsubscribe = useCallback((subscriptionId: string) => {
    setState(prev => {
      const newSubscriptions = new Map(prev.subscriptions);
      const subscription = newSubscriptions.get(subscriptionId);
      
      if (subscription) {
        // Mark as inactive first to prevent further callbacks
        subscription.isActive = false;
        newSubscriptions.delete(subscriptionId);
      }
      
      return {
        ...prev,
        subscriptions: newSubscriptions
      };
    });

    console.log('❌ Subscription removed:', subscriptionId);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(async () => {
    console.log('🔄 Manual reconnect triggered');
    setState(prev => ({
      ...prev,
      health: {
        ...prev.health,
        reconnectAttempts: 0
      }
    }));
    await setupConnection();
  }, [setupConnection]);

  // Get event history for a specific table
  const getEventHistory = useCallback((table?: string, limit: number = 50) => {
    let events = state.eventHistory;
    
    if (table) {
      events = events.filter(event => event.table === table);
    }
    
    return events.slice(0, limit);
  }, [state.eventHistory]);

  // Enhanced memory cleanup function
  const performMemoryCleanup = useCallback(() => {
    console.log('🧹 Performing memory cleanup...');
    
    // Clear all timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    
    // Clean up channel
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
      channelRef.current = null;
    }
    
    // Clear state if unmounted
    if (!isMountedRef.current) {
      setState({
        isConnected: false,
        connectionStatus: 'disconnected',
        lastEvent: null,
        subscriptions: new Map(),
        health: {
          isHealthy: false,
          reconnectAttempts: 0
        },
        eventHistory: []
      });
    }
  }, []);

  // Schedule periodic cleanup of old events
  const scheduleEventHistoryCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    cleanupTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          eventHistory: prev.eventHistory.slice(0, MAX_HISTORY_SIZE)
        }));
        scheduleEventHistoryCleanup(); // Schedule next cleanup
      }
    }, 60000); // Clean every minute
  }, []);

  // Initialize connection and health checks
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user && session && currentTenant) {
      setupConnection();
      
      // Start health checks
      healthCheckIntervalRef.current = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
      
      // Initial health check
      performHealthCheck();
      
      // Start event history cleanup
      scheduleEventHistoryCleanup();
    }

    return () => {
      isMountedRef.current = false;
      performMemoryCleanup();
    };
  }, [user, session, currentTenant, setupConnection, performHealthCheck, performMemoryCleanup, scheduleEventHistoryCleanup]);

  return {
    // Connection state
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    health: state.health,
    
    // Event data
    lastEvent: state.lastEvent,
    eventHistory: state.eventHistory,
    getEventHistory,
    
    // Subscription management
    subscribe,
    unsubscribe,
    subscriptions: Array.from(state.subscriptions.values()),
    
    // Connection management
    reconnect,
    
    // Statistics
    stats: {
      totalSubscriptions: state.subscriptions.size,
      activeSubscriptions: Array.from(state.subscriptions.values()).filter(s => s.isActive).length,
      totalEvents: state.eventHistory.length,
      isHealthy: state.health.isHealthy,
      reconnectAttempts: state.health.reconnectAttempts
    }
  };
};
