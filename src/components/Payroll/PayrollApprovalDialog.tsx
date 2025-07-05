import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Calculator } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { payrollService } from '@/services/payrollService';

interface PayrollApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: any;
  onApprove: () => void;
}

export const PayrollApprovalDialog: React.FC<PayrollApprovalDialogProps> = ({
  open,
  onOpenChange,
  payroll,
  onApprove
}) => {
  const [loading, setLoading] = useState(false);
  const [hasAccountingEntries, setHasAccountingEntries] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && payroll) {
      checkAccountingEntries();
    }
  }, [open, payroll]);

  const checkAccountingEntries = async () => {
    try {
      const hasEntries = await payrollService.hasAccountingEntries(payroll.id);
      setHasAccountingEntries(hasEntries);
    } catch (error) {
      console.error('خطأ في التحقق من القيود المحاسبية:', error);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await payrollService.approvePayroll(payroll.id);
      
      toast({
        title: 'تم الاعتماد',
        description: 'تم اعتماد الراتب وإنشاء القيد المحاسبي بنجاح'
      });
      
      onApprove();
      onOpenChange(false);
    } catch (error) {
      console.error('خطأ في اعتماد الراتب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في اعتماد الراتب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">اعتماد راتب الموظف</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الموظف */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">معلومات الموظف</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">اسم الموظف:</span>
                <div className="font-medium">{payroll.employee_name}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">رقم الموظف:</span>
                <div className="font-medium">{payroll.employee_number}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">فترة الراتب:</span>
                <div className="font-medium">
                  {payroll.pay_period_start} إلى {payroll.pay_period_end}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الحالة الحالية:</span>
                <Badge variant="secondary">{payroll.status}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* تفاصيل الراتب */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">تفاصيل الراتب</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الراتب الأساسي:</span>
                <div className="font-medium">{formatCurrencyKWD(payroll.basic_salary)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الساعات الإضافية:</span>
                <div className="font-medium">{formatCurrencyKWD(payroll.overtime_amount)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">العلاوات:</span>
                <div className="font-medium">{formatCurrencyKWD(payroll.allowances)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الخصومات:</span>
                <div className="font-medium text-red-600">{formatCurrencyKWD(payroll.deductions)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الضرائب:</span>
                <div className="font-medium text-red-600">{formatCurrencyKWD(payroll.tax_deduction)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">التأمينات:</span>
                <div className="font-medium text-red-600">{formatCurrencyKWD(payroll.social_insurance)}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الراتب الإجمالي:</span>
                <div className="text-lg font-bold">{formatCurrencyKWD(payroll.gross_salary)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الراتب الصافي:</span>
                <div className="text-lg font-bold text-green-600">{formatCurrencyKWD(payroll.net_salary)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* معلومات المحاسبة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right flex items-center gap-2 flex-row-reverse">
              <Calculator className="h-5 w-5" />
              المعالجة المحاسبية
            </h3>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 flex-row-reverse mb-3">
                {hasAccountingEntries ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">تم إنشاء القيود المحاسبية مسبقاً</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-700 font-medium">سيتم إنشاء القيود المحاسبية تلقائياً</span>
                  </>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground text-right space-y-1">
                <p>• سيتم إنشاء قيد محاسبي يتضمن:</p>
                <p>• تسجيل مصروف الرواتب والأجور</p>
                <p>• تسجيل الضرائب والتأمينات المستحقة</p>
                <p>• تسجيل الرواتب المستحقة للموظفين</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? 'جاري الاعتماد...' : 'اعتماد الراتب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};