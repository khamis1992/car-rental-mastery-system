
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, MoreHorizontal, Users } from 'lucide-react';
import { JournalEntryStatusBadge } from './JournalEntryStatusBadge';
import { JournalEntrySourceBadge } from './JournalEntrySourceBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { GeneralLedgerEntry } from '@/services/accountingService';

interface EnhancedJournalEntryRowProps {
  entry: GeneralLedgerEntry & {
    total_debit?: number;
    total_credit?: number;
    status?: string;
    created_by?: string;
    cost_center_name?: string;
    lines_count?: number;
  };
  onViewDetails?: (entryId: string) => void;
  onEdit?: (entryId: string) => void;
}

export const EnhancedJournalEntryRow: React.FC<EnhancedJournalEntryRowProps> = ({
  entry,
  onViewDetails,
  onEdit
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW');
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-mono text-sm">
        {entry.entry_number}
      </TableCell>
      
      <TableCell>
        {formatDate(entry.entry_date)}
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-sm">
            {entry.description}
          </div>
          {entry.cost_center_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {entry.cost_center_name}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="space-y-1">
          <div className="text-green-600 font-medium">
            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
          </div>
          {entry.total_debit && entry.total_debit !== entry.debit_amount && (
            <div className="text-xs text-muted-foreground">
              إجمالي: {formatCurrency(entry.total_debit)}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="space-y-1">
          <div className="text-red-600 font-medium">
            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
          </div>
          {entry.total_credit && entry.total_credit !== entry.credit_amount && (
            <div className="text-xs text-muted-foreground">
              إجمالي: {formatCurrency(entry.total_credit)}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className={`font-medium ${entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(entry.running_balance)}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-1">
          {entry.status && (
            <JournalEntryStatusBadge status={entry.status as any} size="sm" />
          )}
          <JournalEntrySourceBadge referenceType={entry.reference_type} size="sm" />
          {entry.lines_count && entry.lines_count > 1 && (
            <Badge variant="outline" className="text-xs">
              {entry.lines_count} بند
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => onViewDetails?.(entry.id)}
              className="rtl-flex"
            >
              <Eye className="w-4 h-4" />
              عرض التفاصيل
            </DropdownMenuItem>
            {entry.status === 'draft' && (
              <DropdownMenuItem 
                onClick={() => onEdit?.(entry.id)}
                className="rtl-flex"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
