
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChartOfAccount } from '@/types/accounting';
import { AddSubAccountDialog } from './AddSubAccountDialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

interface AccountOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: ChartOfAccount | null;
  onRefresh: () => void;
}

export const AccountOperationsDialog: React.FC<AccountOperationsDialogProps> = ({
  isOpen,
  onClose,
  selectedAccount,
  onRefresh
}) => {
  const [showAddSubAccount, setShowAddSubAccount] = useState(false);

  const handleAddSubAccount = () => {
    setShowAddSubAccount(true);
  };

  const handleSubAccountCreated = () => {
    onRefresh();
    setShowAddSubAccount(false);
  };

  if (!selectedAccount) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold rtl-title">
              عمليات الحساب
            </DialogTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>الحساب:</strong> {selectedAccount.account_name}</p>
              <p><strong>الرقم:</strong> {selectedAccount.account_code}</p>
              <p><strong>النوع:</strong> {selectedAccount.account_type}</p>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={handleAddSubAccount}
              className="w-full rtl-flex justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              إضافة حساب فرعي
            </Button>

            <Button
              onClick={() => {
                // TODO: Implement edit account
                console.log('Edit account:', selectedAccount.id);
              }}
              className="w-full rtl-flex justify-start"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
              تعديل الحساب
            </Button>

            <Button
              onClick={() => {
                // TODO: Implement view account details
                console.log('View account details:', selectedAccount.id);
              }}
              className="w-full rtl-flex justify-start"
              variant="outline"
            >
              <Eye className="w-4 h-4" />
              تفاصيل الحساب
            </Button>

            <Button
              onClick={() => {
                // TODO: Implement delete account
                console.log('Delete account:', selectedAccount.id);
              }}
              className="w-full rtl-flex justify-start"
              variant="outline"
              disabled={!selectedAccount.allow_posting}
            >
              <Trash2 className="w-4 h-4" />
              حذف الحساب
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddSubAccountDialog
        isOpen={showAddSubAccount}
        onClose={() => setShowAddSubAccount(false)}
        parentAccount={selectedAccount}
        onAccountCreated={handleSubAccountCreated}
      />
    </>
  );
};
