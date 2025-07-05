import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { FileText, Download, BarChart3, PieChart, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { attendanceManagementService, AttendanceStats } from '@/services/attendanceManagementService';
import { attendanceReportsPDFService } from '@/lib/attendanceReportsPDFService';
import { useToast } from '@/hooks/use-toast';

export const AttendanceReports: React.FC = () => {
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await attendanceManagementService.getAttendanceStats();
      setStats(data);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل الإحصائيات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const filters = {
        startDate: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`,
        endDate: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`
      };

      // جلب بيانات الحضور
      const attendanceData = await attendanceManagementService.getAllAttendanceRecords(filters);
      
      // تحديد عنوان التقرير
      const reportTitle = reportTypes.find(type => type.value === reportType)?.label || 'تقرير الحضور';
      const monthName = months.find(month => month.value === selectedMonth)?.label || '';
      const fullTitle = `${reportTitle} - ${monthName} ${selectedYear}`;
      
      // تحويل البيانات للتنسيق المطلوب
      const formattedData = attendanceData.map(record => ({
        id: record.id,
        employee_name: record.employees?.first_name + ' ' + record.employees?.last_name || 'غير محدد',
        employee_number: record.employees?.employee_number || 'غير محدد',
        date: record.date,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        total_hours: record.total_hours,
        overtime_hours: record.overtime_hours,
        status: record.check_in_time ? 'present' : 'absent',
        department: record.employees?.department || 'غير محدد'
      }));

      // تحميل التقرير مباشرة
      await attendanceReportsPDFService.downloadReport(
        formattedData,
        reportType as 'daily' | 'monthly' | 'summary',
        fullTitle
      );
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير تقرير PDF بنجاح'
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تصدير التقرير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'daily', label: 'تقرير يومي', icon: Calendar },
    { value: 'weekly', label: 'تقرير أسبوعي', icon: BarChart3 },
    { value: 'monthly', label: 'تقرير شهري', icon: PieChart },
    { value: 'annual', label: 'تقرير سنوي', icon: FileText }
  ];

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* عنوان التقارير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
            <FileText className="h-6 w-6" />
            تقارير الحضور والانصراف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-right">
            اختر نوع التقرير والفترة الزمنية لتصدير تقارير مفصلة عن الحضور والانصراف بصيغة PDF
          </p>
        </CardContent>
      </Card>

      {/* إعدادات التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">نوع التقرير</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">الشهر</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">السنة</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">إجراءات</label>
              <Button onClick={generateReport} disabled={loading} className="w-full">
                <Download className="h-4 w-4 ml-2" />
                {loading ? 'جاري التصدير...' : 'تصدير التقرير'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <div className="text-sm text-muted-foreground">إجمالي الموظفين</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <div className="text-sm text-muted-foreground">حاضر اليوم</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalHoursThisMonth.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">ساعات هذا الشهر</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.overtimeHoursThisMonth.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">ساعات إضافية</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أنواع التقارير المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أنواع التقارير المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 text-right">تقرير الحضور التفصيلي</h3>
              <p className="text-sm text-muted-foreground text-right mb-3">
                تقرير شامل يتضمن أوقات الحضور والانصراف لجميع الموظفين
              </p>
              <div className="text-xs text-muted-foreground text-right">
                يتضمن: الاسم، التاريخ، وقت الحضور، وقت الانصراف، ساعات العمل، الحالة
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 text-right">تقرير الغياب والتأخير</h3>
              <p className="text-sm text-muted-foreground text-right mb-3">
                تقرير يركز على حالات الغياب والتأخير
              </p>
              <div className="text-xs text-muted-foreground text-right">
                يتضمن: الموظفين الغائبين، المتأخرين، وإحصائيات التأخير
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 text-right">تقرير الساعات الإضافية</h3>
              <p className="text-sm text-muted-foreground text-right mb-3">
                تقرير مفصل عن الساعات الإضافية المنجزة
              </p>
              <div className="text-xs text-muted-foreground text-right">
                يتضمن: إجمالي الساعات الإضافية، التكاليف، التوزيع الشهري
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 text-right">تقرير الأداء الشهري</h3>
              <p className="text-sm text-muted-foreground text-right mb-3">
                ملخص شهري لأداء الحضور لكل موظف
              </p>
              <div className="text-xs text-muted-foreground text-right">
                يتضمن: معدل الحضور، التأخير، الغياب، التقييم العام
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};