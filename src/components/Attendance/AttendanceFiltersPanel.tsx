import React, { useState } from 'react';
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
    <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50 p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">فلترة سجلات الحضور</h3>
            <p className="text-sm text-muted-foreground">اختر المعايير المناسبة لتصفية البيانات</p>
          </div>
        </div>
      </div>
      {/* فلاتر التاريخ والبحث الأساسي */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date" className="text-sm font-medium text-foreground">من تاريخ</Label>
          <Input
            id="start-date"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="bg-background/50 border-border/60 focus:border-primary/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-sm font-medium text-foreground">إلى تاريخ</Label>
          <Input
            id="end-date"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="bg-background/50 border-border/60 focus:border-primary/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">الموظف</Label>
          <Select
            value={filters.employeeId || 'all'}
            onValueChange={(value) => handleFilterChange('employeeId', value)}
          >
            <SelectTrigger className="bg-background/50 border-border/60 focus:border-primary/50">
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

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">القسم</Label>
          <Select
            value={filters.department || 'all'}
            onValueChange={(value) => handleFilterChange('department', value)}
          >
            <SelectTrigger className="bg-background/50 border-border/60 focus:border-primary/50">
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

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">حالة الحضور</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="bg-background/50 border-border/60 focus:border-primary/50">
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

        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-foreground">البحث</Label>
          <Input
            id="search"
            placeholder="البحث بالاسم أو رقم الموظف"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="bg-background/50 border-border/60 focus:border-primary/50"
          />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/30">
        <Button 
          onClick={applyFilters} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 px-6"
        >
          <Filter className="h-4 w-4 ml-2" />
          تطبيق الفلاتر
        </Button>
        
        <Button 
          onClick={resetFilters} 
          variant="outline" 
          className="border-border/60 hover:bg-muted/80 transition-all duration-200 px-6"
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          إعادة تعيين
        </Button>

        {/* اختصارات سريعة */}
        <div className="flex flex-wrap gap-2 border-r border-border/30 pr-4 mr-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const todayFilters = { startDate: today, endDate: today };
              setFilters(todayFilters);
              onApplyFilters(todayFilters);
            }}
            className="bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground hover-scale"
          >
            <Calendar className="h-3 w-3 ml-1" />
            اليوم
          </Button>
          
          <Button
            variant="secondary"
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
            className="bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground hover-scale"
          >
            هذا الأسبوع
          </Button>
          
          <Button
            variant="secondary"
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
            className="bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground hover-scale"
          >
            هذا الشهر
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const lateFilters = { status: 'late' };
              setFilters(lateFilters);
              onApplyFilters(lateFilters);
            }}
            className="bg-warning/20 hover:bg-warning/30 text-warning-foreground hover-scale"
          >
            المتأخرون فقط
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const absentFilters = { status: 'absent' };
              setFilters(absentFilters);
              onApplyFilters(absentFilters);
            }}
            className="bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground hover-scale"
          >
            الغائبون فقط
          </Button>
        </div>
      </div>

      {/* ملخص الفلاتر المطبقة */}
      {Object.keys(filters).some(key => filters[key as keyof AttendanceFilters]) && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-scale-in">
          <h4 className="font-medium mb-3 text-primary flex items-center gap-2">
            <Filter className="h-4 w-4" />
            الفلاتر المطبقة
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.startDate && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                من: {filters.startDate}
              </span>
            )}
            {filters.endDate && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                إلى: {filters.endDate}
              </span>
            )}
            {filters.employeeId && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                موظف محدد
              </span>
            )}
            {filters.department && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                قسم: {filters.department}
              </span>
            )}
            {filters.status && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                حالة: {filters.status}
              </span>
            )}
            {filters.searchTerm && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                بحث: {filters.searchTerm}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};