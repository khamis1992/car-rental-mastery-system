import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Trash2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AttendanceRecord } from '@/services/attendanceManagementService';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  loading: boolean;
  onUpdate: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  loading,
  onUpdate,
  onDelete
}) => {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'حاضر', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      absent: { label: 'غائب', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      late: { label: 'متأخر', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      early_leave: { label: 'انصراف مبكر', variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800' },
      sick: { label: 'إجازة مرضية', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800' },
      vacation: { label: 'إجازة', variant: 'outline' as const, className: 'bg-purple-100 text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditForm({
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      status: record.status,
      notes: record.notes,
      manual_override: record.manual_override,
      override_reason: record.override_reason
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      await onUpdate(editingRecord.id, editForm);
      setEditingRecord(null);
      setEditForm({});
    } catch (error) {
      console.error('خطأ في التحديث:', error);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--';
    try {
      return format(new Date(timeString), 'HH:mm', { locale: ar });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد سجلات حضور</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الموظف</TableHead>
            <TableHead className="text-right">القسم</TableHead>
            <TableHead className="text-right">التاريخ</TableHead>
            <TableHead className="text-right">الحضور</TableHead>
            <TableHead className="text-right">الانصراف</TableHead>
            <TableHead className="text-right">ساعات العمل</TableHead>
            <TableHead className="text-right">ساعات إضافية</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="text-right">
                <div>
                  <div className="font-medium">
                    {record.employee?.first_name} {record.employee?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {record.employee?.employee_number}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">{record.employee?.department}</TableCell>
              <TableCell className="text-right">{formatDate(record.date)}</TableCell>
              <TableCell className="text-right">{formatTime(record.check_in_time)}</TableCell>
              <TableCell className="text-right">{formatTime(record.check_out_time)}</TableCell>
              <TableCell className="text-right">{record.total_hours?.toFixed(1) || '0'}</TableCell>
              <TableCell className="text-right">{record.overtime_hours?.toFixed(1) || '0'}</TableCell>
              <TableCell className="text-right">{getStatusBadge(record.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>تعديل سجل الحضور</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">وقت الحضور</label>
                          <Input
                            type="time"
                            value={editForm.check_in_time || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              check_in_time: e.target.value 
                            }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">وقت الانصراف</label>
                          <Input
                            type="time"
                            value={editForm.check_out_time || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              check_out_time: e.target.value 
                            }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">الحالة</label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={editForm.status || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              status: e.target.value 
                            }))}
                          >
                            <option value="present">حاضر</option>
                            <option value="absent">غائب</option>
                            <option value="late">متأخر</option>
                            <option value="early_leave">انصراف مبكر</option>
                            <option value="sick">إجازة مرضية</option>
                            <option value="vacation">إجازة</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">ملاحظات</label>
                          <Textarea
                            value={editForm.notes || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              notes: e.target.value 
                            }))}
                            placeholder="أدخل ملاحظات..."
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSaveEdit} className="flex-1">
                            حفظ التغييرات
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingRecord(null)}
                            className="flex-1"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};