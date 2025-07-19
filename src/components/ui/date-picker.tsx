import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ 
  date, 
  selected,
  onSelect, 
  placeholder = "اختر تاريخ",
  className 
}: DatePickerProps) {
  const selectedDate = selected || date;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal rtl-flex",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "yyyy-MM-dd") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}