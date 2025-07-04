import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities using Gregorian calendar for Kuwait
export const formatDate = (dateString: string | Date, options?: Intl.DateTimeFormatOptions) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    calendar: 'gregory',
    ...options
  };
  
  return date.toLocaleDateString('ar-KW', defaultOptions);
};

export const formatDateTime = (dateString: string | Date) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory'
  });
};

export const formatTime = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString('ar-KW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDateShort = (dateString: string | Date) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    calendar: 'gregory'
  });
};

// Date utility functions for date pickers
export const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getStartOfDate = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};
