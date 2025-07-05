import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { AttendanceFilters } from '@/services/attendanceManagementService';

interface AttendanceFiltersPanelProps {
  employees: any[];
  departments: string[];
  onApplyFilters: (filters: AttendanceFilters) => void;
  currentFilters: AttendanceFilters;
}

export const AttendanceFiltersPanel: React.FC<AttendanceFiltersPanelProps> = ({
  employees,
  departments,
  onApplyFilters,
  currentFilters
}) => {
  const [filters, setFilters] = useState<AttendanceFilters>(currentFilters);

  const handleFilterChange = (key: keyof AttendanceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const applyFilters = () => {
    onApplyFilters(filters);
  };

  const resetFilters = () => {
    const emptyFilters: AttendanceFilters = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
          <Filter className="h-5 w-5" />
          الفلاتر المتقدمة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* تاريخ البداية */}
          <div className="space-y-2 text-right">
            <Label htmlFor="start-date" className="text-right">من تاريخ</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          {/* تاريخ النهاية */}
          <div className="space-y-2 text-right">
            <Label htmlFor="end-date" className="text-right">إلى تاريخ</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          {/* الموظف */}
          <div className="space-y-2 text-right">
            <Label className="text-right">الموظف</Label>
            <Select
              value={filters.employeeId || 'all'}
              onValueChange={(value) => handleFilterChange('employeeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} ({employee.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* القسم */}
          <div className="space-y-2 text-right">
            <Label className="text-right">القسم</Label>
            <Select
              value={filters.department || 'all'}
              onValueChange={(value) => handleFilterChange('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر قسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الحالة */}
          <div className="space-y-2 text-right">
            <Label className="text-right">حالة الحضور</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="early_leave">انصراف مبكر</SelectItem>
                <SelectItem value="sick">إجازة مرضية</SelectItem>
                <SelectItem value="vacation">إجازة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* البحث */}
          <div className="space-y-2 text-right">
            <Label htmlFor="search" className="text-right">البحث</Label>
            <Input
              id="search"
              placeholder="البحث بالاسم أو رقم الموظف"
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-4 pt-4 border-t justify-end">
          <Button onClick={resetFilters} variant="outline" className="flex items-center gap-2 flex-row-reverse">
            <RotateCcw className="h-4 w-4" />
            إعادة تعيين
          </Button>
          
          <Button onClick={applyFilters} className="flex items-center gap-2 flex-row-reverse">
            <Filter className="h-4 w-4" />
            تطبيق الفلاتر
          </Button>
        </div>

        {/* ملخص الفلاتر المطبقة */}
        {Object.keys(filters).some(key => filters[key as keyof AttendanceFilters]) && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-right">
            <h4 className="font-medium mb-2 text-right">الفلاتر المطبقة:</h4>
            <div className="flex flex-wrap gap-2 justify-end">
              {filters.startDate && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  من: {filters.startDate}
                </span>
              )}
              {filters.endDate && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  إلى: {filters.endDate}
                </span>
              )}
              {filters.employeeId && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  موظف محدد
                </span>
              )}
              {filters.department && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  قسم: {filters.department}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  حالة: {filters.status}
                </span>
              )}
              {filters.searchTerm && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  بحث: {filters.searchTerm}
                </span>
              )}
            </div>
          </div>
        )}

        {/* اختصارات سريعة */}
        <div className="space-y-2 text-right">
          <Label className="text-right">اختصارات سريعة</Label>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const absentFilters = { status: 'absent' };
                setFilters(absentFilters);
                onApplyFilters(absentFilters);
              }}
              className="flex items-center gap-2 flex-row-reverse"
            >
              الغائبون فقط
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lateFilters = { status: 'late' };
                setFilters(lateFilters);
                onApplyFilters(lateFilters);
              }}
              className="flex items-center gap-2 flex-row-reverse"
            >
              المتأخرون فقط
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const monthFilters = {
                  startDate: monthStart.toISOString().split('T')[0],
                  endDate: monthEnd.toISOString().split('T')[0]
                };
                setFilters(monthFilters);
                onApplyFilters(monthFilters);
              }}
              className="flex items-center gap-2 flex-row-reverse"
            >
              هذا الشهر
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                const weekFilters = {
                  startDate: weekStart.toISOString().split('T')[0],
                  endDate: weekEnd.toISOString().split('T')[0]
                };
                setFilters(weekFilters);
                onApplyFilters(weekFilters);
              }}
              className="flex items-center gap-2 flex-row-reverse"
            >
              هذا الأسبوع
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const todayFilters = { startDate: today, endDate: today };
                setFilters(todayFilters);
                onApplyFilters(todayFilters);
              }}
              className="flex items-center gap-2 flex-row-reverse"
            >
              <Calendar className="h-4 w-4" />
              اليوم
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};