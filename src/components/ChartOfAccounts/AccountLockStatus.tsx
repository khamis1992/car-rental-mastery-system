
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, LockOpen, AlertTriangle, Edit, History } from 'lucide-react';
import { ChartOfAccountNode } from '@/types/chartOfAccounts';
import { AccountModificationDialog } from './AccountModificationDialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AccountLockStatusProps {
  account: ChartOfAccountNode;
  canUnlock?: boolean;
  onUnlock?: () => void;
  onViewHistory?: () => void;
}

export function AccountLockStatus({ 
  account, 
  canUnlock = false, 
  onUnlock, 
  onViewHistory 
}: AccountLockStatusProps) {
  const isLocked = account.is_locked;
  const hasTransactions = account.first_transaction_date;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isLocked ? (
                <Lock className="h-4 w-4 text-red-500" />
              ) : (
                <LockOpen className="h-4 w-4 text-green-500" />
              )}
              <Badge 
                variant={isLocked ? "destructive" : "secondary"}
                className="text-xs"
              >
                {isLocked ? 'مقفل' : 'مفتوح'}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-right">
              <p className="font-medium">
                {isLocked ? 'حساب مقفل' : 'حساب مفتوح للتعديل'}
              </p>
              {hasTransactions && (
                <p className="text-xs text-muted-foreground mt-1">
                  أول معاملة: {format(new Date(hasTransactions), 'dd/MM/yyyy', { locale: ar })}
                </p>
              )}
              {isLocked && account.locked_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  تاريخ القفل: {format(new Date(account.locked_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {hasTransactions && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>يحتوي على معاملات مالية</p>
            </TooltipContent>
          </TooltipProvider>
        </Tooltip>
      )}

      <div className="flex items-center gap-1">
        {isLocked ? (
          <AccountModificationDialog account={account}>
            <Button size="sm" variant="outline" className="h-7 px-2">
              <Edit className="h-3 w-3 ml-1" />
              طلب تعديل
            </Button>
          </AccountModificationDialog>
        ) : (
          <Button size="sm" variant="outline" className="h-7 px-2">
            <Edit className="h-3 w-3 ml-1" />
            تعديل
          </Button>
        )}

        {canUnlock && isLocked && onUnlock && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onUnlock}
            className="h-7 px-2 text-green-600 hover:text-green-700"
          >
            <LockOpen className="h-3 w-3 ml-1" />
            فتح القفل
          </Button>
        )}

        {onViewHistory && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onViewHistory}
            className="h-7 px-2"
          >
            <History className="h-3 w-3 ml-1" />
            السجل
          </Button>
        )}
      </div>
    </div>
  );
}
