import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AccountingEvent {
  id: string;
  event_type: string;
  entity_id: string;
  status: string;
  created_at: string;
  error_message?: string;
}

export const useRealTimeAccounting = () => {
  const [events, setEvents] = useState<AccountingEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('accounting-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'accounting_event_monitor'
        },
        (payload) => {
          const newEvent = payload.new as AccountingEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
          
          if (newEvent.status === 'failed') {
            toast({
              title: "خطأ في المعالجة المحاسبية",
              description: newEvent.error_message || "حدث خطأ في معالجة العملية المحاسبية",
              variant: "destructive",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accounting_event_monitor'
        },
        (payload) => {
          const updatedEvent = payload.new as AccountingEvent;
          setEvents(prev => prev.map(event => 
            event.id === updatedEvent.id ? updatedEvent : event
          ));
          
          if (updatedEvent.status === 'completed') {
            toast({
              title: "تم التحديث المحاسبي",
              description: "تم تحديث البيانات المحاسبية بنجاح",
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerSync = async (entityType: string, entityId: string) => {
    try {
      const { error } = await supabase
        .from('accounting_event_monitor')
        .insert({
          entity_id: entityId,
          event_type: `sync_${entityType}`,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم بدء المزامنة",
        description: "جاري مزامنة البيانات المحاسبية...",
      });
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "فشل في بدء عملية المزامنة",
        variant: "destructive",
      });
    }
  };

  return {
    events,
    isConnected,
    triggerSync
  };
};