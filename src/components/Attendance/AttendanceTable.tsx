import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit2, Trash2, Clock, User, MapPin, Calendar, AlertTriangle } from 'lucide-react';
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
      present: { 
        label: 'حاضر', 
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        icon: '✓'
      },
      absent: { 
        label: 'غائب', 
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        icon: '✗'
      },
      late: { 
        label: 'متأخر', 
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        icon: '⏰'
      },
      early_leave: { 
        label: 'انصراف مبكر', 
        className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        icon: '🚪'
      },
      sick: { 
        label: 'إجازة مرضية', 
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        icon: '🏥'
      },
      vacation: { 
        label: 'إجازة', 
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
        icon: '🏖️'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    
    return (
      <Badge className={`${config.className} border transition-colors duration-200 font-medium px-3 py-1`}>
        <span className="ml-1">{config.icon}</span>
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
    if (!timeString) return <span className="text-muted-foreground">--</span>;
    try {
      return (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {format(new Date(timeString), 'HH:mm', { locale: ar })}
        </span>
      );
    } catch {
      return <span className="font-mono text-sm">{timeString}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const getWorkingHours = (totalHours: number | null) => {
    if (!totalHours) return <span className="text-muted-foreground">0</span>;
    
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    return (
      <div className="text-center">
        <div className="font-semibold text-lg">{hours}:{minutes.toString().padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground">ساعة</div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <Clock className="h-16 w-16 text-primary mx-auto animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-muted rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">لا توجد سجلات حضور</h3>
              <p className="text-muted-foreground">لم يتم العثور على أي سجلات بناءً على الفلاتر المحددة</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
              <TableHead className="text-right font-semibold text-foreground">الموظف</TableHead>
              <TableHead className="text-right font-semibold text-foreground">القسم</TableHead>
              <TableHead className="text-right font-semibold text-foreground">التاريخ</TableHead>
              <TableHead className="text-center font-semibold text-foreground">أوقات الدوام</TableHead>
              <TableHead className="text-center font-semibold text-foreground">ساعات العمل</TableHead>
              <TableHead className="text-right font-semibold text-foreground">الحالة</TableHead>
              <TableHead className="text-center font-semibold text-foreground">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow 
                key={record.id} 
                className={`
                  hover:bg-muted/30 transition-all duration-200 border-b
                  ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}
                `}
              >
                {/* معلومات الموظف */}
                <TableCell className="text-right py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {record.employees?.first_name?.charAt(0)}
                        {record.employees?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">
                        {record.employees?.first_name} {record.employees?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block">
                        {record.employees?.employee_number}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* القسم */}
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {record.employees?.department}
                  </Badge>
                </TableCell>

                {/* التاريخ */}
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(record.date)}
                  </div>
                </TableCell>

                {/* أوقات الدوام */}
                <TableCell className="text-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">دخول:</span>
                      {formatTime(record.check_in_time)}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">خروج:</span>
                      {formatTime(record.check_out_time)}
                    </div>
                  </div>
                </TableCell>

                {/* ساعات العمل */}
                <TableCell className="text-center">
                  <div className="space-y-2">
                    {getWorkingHours(record.total_hours)}
                    {record.overtime_hours && record.overtime_hours > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-600 font-medium">
                          +{record.overtime_hours.toFixed(1)} إضافي
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* الحالة */}
                <TableCell className="text-right">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                    {record.manual_override && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        يدوي
                      </Badge>
                    )}
                  </div>
                  {record.office_locations && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {record.office_locations.name}
                    </div>
                  )}
                </TableCell>

                {/* الإجراءات */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right flex items-center gap-2">
                            <Edit2 className="h-5 w-5" />
                            تعديل سجل الحضور
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium block mb-1">وقت الحضور</label>
                              <Input
                                type="time"
                                value={editForm.check_in_time || ''}
                                onChange={(e) => setEditForm(prev => ({ 
                                  ...prev, 
                                  check_in_time: e.target.value 
                                }))}
                                className="text-center"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium block mb-1">وقت الانصراف</label>
                              <Input
                                type="time"
                                value={editForm.check_out_time || ''}
                                onChange={(e) => setEditForm(prev => ({ 
                                  ...prev, 
                                  check_out_time: e.target.value 
                                }))}
                                className="text-center"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium block mb-1">الحالة</label>
                            <select
                              className="w-full p-2 border rounded-md bg-background"
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
                            <label className="text-sm font-medium block mb-1">ملاحظات</label>
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm(prev => ({ 
                                ...prev, 
                                notes: e.target.value 
                              }))}
                              placeholder="أدخل ملاحظات..."
                              rows={3}
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
                      className="hover:bg-red-50 hover:border-red-300 transition-colors"
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
    </Card>
  );
};