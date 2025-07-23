
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

  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    // Create subscription
    const handleEvent = (event: RealtimeEvent) => {
      // Call general event handler
      if (onEvent) {
        onEvent(event);
      }

      // Call specific event handlers
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
