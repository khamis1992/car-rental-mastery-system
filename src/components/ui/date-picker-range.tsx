import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DatePickerRangeProps {
  value: { from: Date; to: Date } | null;
  onChange: (range: { from: Date; to: Date } | null) => void;
  placeholder?: string;
  className?: string;
}

export const DatePickerRange: React.FC<DatePickerRangeProps> = ({
  value,
  onChange,
  placeholder = "اختر الفترة",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    if (!value || !value.from || (value.from && value.to)) {
      // Start new range
      onChange({ from: date, to: date });
    } else if (value.from && !value.to) {
      // Complete the range
      if (date < value.from) {
        onChange({ from: date, to: value.from });
      } else {
        onChange({ from: value.from, to: date });
      }
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value || !value.from) return placeholder;
    
    if (value.from && value.to) {
      return `${format(value.from, 'yyyy/MM/dd', { locale: ar })} - ${format(value.to, 'yyyy/MM/dd', { locale: ar })}`;
    } else {
      return format(value.from, 'yyyy/MM/dd', { locale: ar });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value?.from}
          onSelect={handleDateChange}
          initialFocus
          locale={ar}
        />
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                onChange({ from: lastMonth, to: today });
                setIsOpen(false);
              }}
            >
              الشهر الماضي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                onChange({ from: startOfMonth, to: today });
                setIsOpen(false);
              }}
            >
              هذا الشهر
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              مسح
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 