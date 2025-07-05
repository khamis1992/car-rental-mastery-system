import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export const RejectLeaveDialog: React.FC<RejectLeaveDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason.trim());
      setRejectionReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">رفض طلب الإجازة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">السبب</span>
              <span className="text-sm font-medium">سبب الرفض</span>
            </div>
            <Textarea
              id="rejection-reason"
              placeholder="اكتب سبب رفض طلب الإجازة..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleConfirm}
              disabled={!rejectionReason.trim() || isLoading}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? 'جاري الرفض...' : 'رفض الطلب'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};