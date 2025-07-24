
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChartOfAccount } from '@/types/accounting';
import { AddSubAccountDialog } from './AddSubAccountDialog';
import { AccountDetailsDialog } from './AccountDetailsDialog';
import { AccountEditDialog } from './AccountEditDialog';
import { accountService, AccountDetails } from '@/services/accountService';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [showAddSubAccount, setShowAddSubAccount] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddSubAccount = () => {
    setShowAddSubAccount(true);
  };

  const handleSubAccountCreated = () => {
    onRefresh();
    setShowAddSubAccount(false);
  };

  const handleViewDetails = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    try {
      const details = await accountService.getAccountDetails(selectedAccount.id);
      setAccountDetails(details);
      setShowAccountDetails(true);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل التفاصيل',
        description: error.message || 'حدث خطأ أثناء تحميل تفاصيل الحساب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = async (accountId: string, data: any) => {
    try {
      await accountService.updateAccount(accountId, data);
      onRefresh();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      // Check if account can be deleted
      const { canDelete, reason } = await accountService.canDeleteAccount(selectedAccount.id);
      
      if (!canDelete) {
        toast({
          title: 'لا يمكن حذف الحساب',
          description: reason,
          variant: 'destructive'
        });
        return;
      }

      const confirmed = window.confirm(
        `هل أنت متأكد من حذف الحساب "${selectedAccount.account_name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
      );

      if (!confirmed) return;

      await accountService.deleteAccount(selectedAccount.id);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحساب بنجاح'
      });
      onRefresh();
      onClose();
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء حذف الحساب',
        variant: 'destructive'
      });
    }
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
              onClick={() => setShowEditAccount(true)}
              className="w-full rtl-flex justify-start"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
              تعديل الحساب
            </Button>

            <Button
              onClick={handleViewDetails}
              className="w-full rtl-flex justify-start"
              variant="outline"
              disabled={loading}
            >
              <Eye className="w-4 h-4" />
              {loading ? 'جاري التحميل...' : 'تفاصيل الحساب'}
            </Button>

            <Button
              onClick={handleDeleteAccount}
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

      <AccountDetailsDialog
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        accountDetails={accountDetails}
      />

      <AccountEditDialog
        isOpen={showEditAccount}
        onClose={() => setShowEditAccount(false)}
        account={selectedAccount}
        onSave={handleEditAccount}
      />
    </>
  );
};
