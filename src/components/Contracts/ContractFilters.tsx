import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface ContractFilters {
  search: string;
  status: string;
  contractType: string;
  dateRange: string;
}

interface ContractFiltersProps {
  filters: ContractFilters;
  onFiltersChange: (filters: ContractFilters) => void;
  onClearFilters: () => void;
}

export const ContractFiltersComponent: React.FC<ContractFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const updateFilter = (key: keyof ContractFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* البحث */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في العقود (رقم العقد، اسم العميل، رقم المركبة...)"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* فلتر الحالة */}
          <div className="min-w-[150px]">
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر نوع العقد */}
          <div className="min-w-[150px]">
            <Select value={filters.contractType} onValueChange={(value) => updateFilter('contractType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="custom">مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الفترة الزمنية */}
          <div className="min-w-[150px]">
            <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الفترات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* مسح الفلاتر */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4 ml-1" />
              مسح الفلاتر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};