
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface JournalEntryStatusBadgeProps {
  status: 'draft' | 'posted' | 'reversed' | 'pending';
  size?: 'sm' | 'md' | 'lg';
}

export const JournalEntryStatusBadge: React.FC<JournalEntryStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'posted':
        return {
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
          label: 'مرحل'
        };
      case 'draft':
        return {
          variant: 'secondary' as const,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: Clock,
          label: 'مسودة'
        };
      case 'reversed':
        return {
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: XCircle,
          label: 'معكوس'
        };
      case 'pending':
        return {
          variant: 'outline' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: AlertCircle,
          label: 'معلق'
        };
      default:
        return {
          variant: 'outline' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: AlertCircle,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <Badge 
      variant={config.variant}
      className={`rtl-flex gap-1 ${config.bgColor} ${config.color} border-current`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
};
