
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CreditCard, 
  Building, 
  Truck, 
  Settings,
  Receipt,
  Calculator,
  Archive
} from 'lucide-react';

interface JournalEntrySourceBadgeProps {
  referenceType?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const JournalEntrySourceBadge: React.FC<JournalEntrySourceBadgeProps> = ({ 
  referenceType, 
  size = 'md' 
}) => {
  const getSourceConfig = (type?: string) => {
    switch (type) {
      case 'contract':
        return {
          icon: FileText,
          label: 'عقد',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'invoice':
        return {
          icon: Receipt,
          label: 'فاتورة',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'payment':
        return {
          icon: CreditCard,
          label: 'دفعة',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      case 'asset':
        return {
          icon: Building,
          label: 'أصل',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'vehicle':
        return {
          icon: Truck,
          label: 'مركبة',
          color: 'text-teal-600',
          bgColor: 'bg-teal-50'
        };
      case 'depreciation':
        return {
          icon: Archive,
          label: 'استهلاك',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
      case 'manual':
        return {
          icon: Calculator,
          label: 'يدوي',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50'
        };
      case 'adjustment':
        return {
          icon: Settings,
          label: 'تعديل',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: Settings,
          label: 'نظام',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const config = getSourceConfig(referenceType);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <Badge 
      variant="outline"
      className={`rtl-flex gap-1 ${config.bgColor} ${config.color} border-current`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
};
