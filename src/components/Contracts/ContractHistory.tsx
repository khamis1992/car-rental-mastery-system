import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ContractHistoryEntry {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  created_by: string | null;
  notes?: string;
  user_name?: string;
}

interface ContractHistoryProps {
  contractId: string;
}

export const ContractHistory: React.FC<ContractHistoryProps> = ({ contractId }) => {
  const [history, setHistory] = useState<ContractHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [contractId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // جلب تاريخ العقد من جدول contract_history أو إنشاء جدول جديد
      // سنستخدم العقود نفسها للحصول على التاريخ في الوقت الحالي
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          status,
          actual_start_date,
          actual_end_date,
          created_at,
          created_by,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      // إنشاء تاريخ افتراضي من بيانات العقد
      const historyEntries: ContractHistoryEntry[] = [
        {
          id: `${contract.id}_created`,
          action_type: 'created',
          description: 'تم إنشاء العقد',
          created_at: contract.created_at,
          created_by: contract.created_by,
          user_name: 'نظام',
        },
      ];

      if (contract.status === 'active' && contract.actual_start_date) {
        historyEntries.push({
          id: `${contract.id}_activated`,
          action_type: 'activated',
          description: 'تم تفعيل العقد وبدء الإيجار',
          created_at: contract.actual_start_date,
          created_by: contract.created_by,
          user_name: 'نظام',
        });
      }

      if (contract.status === 'completed' && contract.actual_end_date) {
        historyEntries.push({
          id: `${contract.id}_completed`,
          action_type: 'completed',
          description: 'تم إنهاء العقد وإرجاع المركبة',
          created_at: contract.actual_end_date,
          created_by: contract.created_by,
          user_name: 'نظام',
        });
      }

      // ترتيب التاريخ من الأحدث للأقدم
      historyEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(historyEntries);
    } catch (error) {
      console.error('Error loading contract history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="w-4 h-4" />;
      case 'activated':
        return <Activity className="w-4 h-4" />;
      case 'completed':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'bg-blue-500';
      case 'activated':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'إنشاء';
      case 'activated':
        return 'تفعيل';
      case 'completed':
        return 'إنهاء';
      case 'cancelled':
        return 'إلغاء';
      default:
        return actionType;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            سجل العقد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          سجل العقد ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getActionColor(entry.action_type)}`}>
                  {getActionIcon(entry.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {getActionLabel(entry.action_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{entry.user_name}</span>
                    <span>•</span>
                    <span>{format(new Date(entry.created_at), 'PPp', { locale: ar })}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                  )}
                </div>
                {index < history.length - 1 && (
                  <div className="absolute right-[15px] top-8 w-px h-6 bg-border"></div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};