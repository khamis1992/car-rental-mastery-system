import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface QuotationFilters {
  search: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  customer: string;
  vehicle: string;
}

interface QuotationFiltersProps {
  filters: QuotationFilters;
  onFiltersChange: (filters: QuotationFilters) => void;
  customers: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; make: string; model: string }>;
}

export const QuotationFiltersComponent: React.FC<QuotationFiltersProps> = ({
  filters,
  onFiltersChange,
  customers,
  vehicles,
}) => {
  const updateFilter = (key: keyof QuotationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      dateFrom: undefined,
      dateTo: undefined,
      customer: '',
      vehicle: '',
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.dateFrom || 
    filters.dateTo || filters.customer || filters.vehicle;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">البحث والفلترة</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* البحث النصي */}
        <div className="space-y-2">
          <label className="text-sm font-medium">البحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="رقم العرض، العميل، المركبة..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* فلترة الحالة */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الحالة</label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="sent">مرسل</SelectItem>
              <SelectItem value="accepted">مقبول</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="expired">منتهي الصلاحية</SelectItem>
              <SelectItem value="converted">تم التحويل لعقد</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* فلترة العميل */}
        <div className="space-y-2">
          <label className="text-sm font-medium">العميل</label>
          <Select value={filters.customer} onValueChange={(value) => updateFilter('customer', value)}>
            <SelectTrigger>
              <SelectValue placeholder="جميع العملاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع العملاء</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلترة المركبة */}
        <div className="space-y-2">
          <label className="text-sm font-medium">المركبة</label>
          <Select value={filters.vehicle} onValueChange={(value) => updateFilter('vehicle', value)}>
            <SelectTrigger>
              <SelectValue placeholder="جميع المركبات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع المركبات</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلترة التاريخ من */}
        <div className="space-y-2">
          <label className="text-sm font-medium">من تاريخ</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "PPP", { locale: ar }) : "اختر التاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => updateFilter('dateFrom', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* فلترة التاريخ إلى */}
        <div className="space-y-2">
          <label className="text-sm font-medium">إلى تاريخ</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "PPP", { locale: ar }) : "اختر التاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => updateFilter('dateTo', date)}
                disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* عداد النتائج */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          يتم عرض النتائج المفلترة
        </div>
      )}
    </div>
  );
};