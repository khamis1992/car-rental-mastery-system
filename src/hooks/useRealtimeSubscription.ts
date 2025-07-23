
import { useEffect, useRef } from 'react';
import { useUnifiedRealtime, RealtimeEvent } from '@/hooks/useUnifiedRealtime';

export interface UseRealtimeSubscriptionOptions {
  table: string;
  onEvent?: (event: RealtimeEvent) => void;
  onInsert?: (data: any) => void;
  onUpdate?: (data: any) => void;
  onDelete?: (data: any) => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = ({
  table,
  onEvent,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeSubscriptionOptions) => {
  const { subscribe, unsubscribe, isConnected } = useUnifiedRealtime();
  const subscriptionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isConnected || !isMountedRef.current) {
      return;
    }

    // Create subscription with memory leak protection
    const handleEvent = (event: RealtimeEvent) => {
      if (!isMountedRef.current) {
        console.warn('Ignoring event on unmounted subscription for table:', table);
        return;
      }
      
      // Call general event handler
      if (onEvent) {
        try {
          onEvent(event);
        } catch (error) {
          console.error('Error in onEvent handler:', error);
        }
      }

      // Call specific event handlers
      try {
        switch (event.event) {
          case 'INSERT':
            if (onInsert && event.new) {
              onInsert(event.new);
            }
            break;
          case 'UPDATE':
            if (onUpdate && event.new) {
              onUpdate(event.new);
            }
            break;
          case 'DELETE':
            if (onDelete && event.old) {
              onDelete(event.old);
            }
            break;
        }
      } catch (error) {
        console.error('Error in specific event handler:', error);
      }
    };

    subscriptionIdRef.current = subscribe(table, handleEvent);
    console.log('🔗 Subscribed to table:', table, 'with ID:', subscriptionIdRef.current);

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current);
        console.log('🔓 Unsubscribed from table:', table);
        subscriptionIdRef.current = null;
      }
    };
  }, [table, enabled, isConnected, subscribe, unsubscribe, onEvent, onInsert, onUpdate, onDelete]);

  return {
    isConnected,
    subscriptionId: subscriptionIdRef.current
  };
};
