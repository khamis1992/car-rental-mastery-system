import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Filter, 
  Search, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  attendanceManagementService, 
  AttendanceRecord, 
  AttendanceStats, 
  AttendanceFilters 
} from '@/services/attendanceManagementService';
import { useToast } from '@/hooks/use-toast';
import { AttendanceTable } from './AttendanceTable';
import { AttendanceFiltersPanel } from './AttendanceFiltersPanel';
import { AttendanceReports } from './AttendanceReports';

export const AttendanceManagement: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAttendanceRecords();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsData, employeesData, departmentsData] = await Promise.all([
        attendanceManagementService.getAttendanceStats(),
        attendanceManagementService.getEmployeesForFilter(),
        attendanceManagementService.getDepartmentsForFilter()
      ]);
      
      setStats(statsData);
      setEmployees(employeesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل البيانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const data = await attendanceManagementService.getAllAttendanceRecords(filters);
      setRecords(data);
    } catch (error) {
      console.error('خطأ في تحميل سجلات الحضور:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل سجلات الحضور',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      await attendanceManagementService.updateAttendanceRecord(id, updates);
      await loadAttendanceRecords();
      await loadInitialData(); // لتحديث الإحصائيات
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث سجل الحضور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في التحديث:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث السجل',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    try {
      await attendanceManagementService.deleteAttendanceRecord(id);
      await loadAttendanceRecords();
      await loadInitialData(); // لتحديث الإحصائيات
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف سجل الحضور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف السجل',
        variant: 'destructive'
      });
    }
  };

  const applyFilters = (newFilters: AttendanceFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <div className="text-sm text-muted-foreground">إجمالي الموظفين</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <div className="text-sm text-muted-foreground">حاضر اليوم</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              <div className="text-sm text-muted-foreground">غائب اليوم</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{stats.lateToday}</div>
              <div className="text-sm text-muted-foreground">متأخر اليوم</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalHoursThisMonth.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">ساعات هذا الشهر</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.overtimeHoursThisMonth.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">ساعات إضافية</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* التبويبات */}
      <Tabs defaultValue="records" className="space-y-4">
        <div className="flex justify-end">
          <TabsList>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
            <TabsTrigger value="records">سجلات الحضور</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="records" className="space-y-4">
          {/* الفلاتر المتقدمة */}
          <AttendanceFiltersPanel
            employees={employees}
            departments={departments}
            onApplyFilters={applyFilters}
            currentFilters={filters}
          />

          {/* البحث السريع */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
                }}
                className="pr-10"
              />
            </div>
            
            {Object.keys(filters).length > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                مسح الفلاتر
              </Button>
            )}
          </div>

          {/* جدول السجلات */}
          <AttendanceTable
            records={records}
            loading={loading}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
          />
        </TabsContent>

        <TabsContent value="reports">
          <AttendanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};