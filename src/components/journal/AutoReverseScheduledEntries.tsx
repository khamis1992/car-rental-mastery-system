import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { autoReverseService, JournalEntryWithAutoReverse } from '@/services/autoReverseService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AutoReverseScheduledEntries() {
  const [scheduledEntries, setScheduledEntries] = useState<JournalEntryWithAutoReverse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadScheduledEntries();
  }, []);

  const loadScheduledEntries = async () => {
    try {
      setLoading(true);
      const entries = await autoReverseService.getEntriesWithAutoReverse();
      setScheduledEntries(entries);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب القيود المجدولة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAutoReverse = async (entryId: string) => {
    try {
      await autoReverseService.cancelAutoReverse(entryId);
      toast({
        title: 'تم بنجاح',
        description: 'تم إلغاء العكس التلقائي',
      });
      loadScheduledEntries();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إلغاء العكس التلقائي',
        variant: 'destructive',
      });
    }
  };

  const handleProcessNow = async () => {
    try {
      const processed = await autoReverseService.processAutoReverseEntries();
      toast({
        title: 'تم بنجاح',
        description: `تم معالجة ${processed} قيد محاسبي`,
      });
      loadScheduledEntries();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في معالجة القيود',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (reverseDate: string) => {
    const today = new Date();
    const targetDate = new Date(reverseDate);
    
    if (targetDate <= today) {
      return <Badge variant="destructive">مستحق للتنفيذ</Badge>;
    } else {
      return <Badge variant="secondary">مجدول</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="rtl-card-header">
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            القيود المجدولة للعكس التلقائي
          </CardTitle>
          {scheduledEntries.length > 0 && (
            <Button onClick={handleProcessNow} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4" />
              تنفيذ الآن
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {scheduledEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد قيود مجدولة للعكس التلقائي</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الإجراءات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ العكس</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">رقم القيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAutoReverse(entry.id)}
                        title="إلغاء العكس التلقائي"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.auto_reverse_date && getStatusBadge(entry.auto_reverse_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.auto_reverse_date && 
                        format(new Date(entry.auto_reverse_date), 'dd/MM/yyyy', { locale: ar })
                      }
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatAmount(entry.total_debit)}
                    </TableCell>
                    <TableCell className="text-right max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.entry_number}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {scheduledEntries.some(entry => 
          entry.auto_reverse_date && new Date(entry.auto_reverse_date) <= new Date()
        ) && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">تنبيه</h4>
              <p className="text-sm text-yellow-700">
                توجد قيود مستحقة للعكس التلقائي. سيتم تنفيذها تلقائياً في الساعة 2:00 صباحاً أو يمكنك تنفيذها الآن.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}