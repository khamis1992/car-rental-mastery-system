import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { installmentService } from "@/services/installmentService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateInstallmentPlanDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: "",
    supplier_name: "",
    total_amount: "",
    down_payment: "",
    number_of_installments: "",
    installment_frequency: "monthly",
    first_installment_date: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate last installment date
      const firstDate = new Date(formData.first_installment_date);
      const lastDate = new Date(firstDate);
      
      const installments = parseInt(formData.number_of_installments);
      if (formData.installment_frequency === 'monthly') {
        lastDate.setMonth(lastDate.getMonth() + installments - 1);
      } else if (formData.installment_frequency === 'quarterly') {
        lastDate.setMonth(lastDate.getMonth() + (installments * 3) - 3);
      } else if (formData.installment_frequency === 'annually') {
        lastDate.setFullYear(lastDate.getFullYear() + installments - 1);
      }

      const planData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        down_payment: parseFloat(formData.down_payment || "0"),
        remaining_amount: parseFloat(formData.total_amount) - parseFloat(formData.down_payment || "0"),
        number_of_installments: parseInt(formData.number_of_installments),
        last_installment_date: lastDate.toISOString().split('T')[0],
        tenant_id: "00000000-0000-0000-0000-000000000000", // This should be dynamic
      };

      await installmentService.createInstallmentPlan(planData);
      
      toast({
        title: "تم إنشاء الخطة بنجاح",
        description: "تم إنشاء خطة الأقساط الجديدة",
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        plan_name: "",
        supplier_name: "",
        total_amount: "",
        down_payment: "",
        number_of_installments: "",
        installment_frequency: "monthly",
        first_installment_date: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الخطة",
        description: "حدث خطأ أثناء إنشاء خطة الأقساط",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="rtl-title">إنشاء خطة أقساط جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل خطة الأقساط الجديدة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan_name" className="rtl-label">اسم الخطة</Label>
              <Input
                id="plan_name"
                value={formData.plan_name}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier_name" className="rtl-label">اسم المورد</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_amount" className="rtl-label">المبلغ الإجمالي (د.ك)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.001"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="down_payment" className="rtl-label">الدفعة المقدمة (د.ك)</Label>
              <Input
                id="down_payment"
                type="number"
                step="0.001"
                value={formData.down_payment}
                onChange={(e) => setFormData(prev => ({ ...prev, down_payment: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number_of_installments" className="rtl-label">عدد الأقساط</Label>
              <Input
                id="number_of_installments"
                type="number"
                value={formData.number_of_installments}
                onChange={(e) => setFormData(prev => ({ ...prev, number_of_installments: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="installment_frequency" className="rtl-label">دورية الأقساط</Label>
              <Select
                value={formData.installment_frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, installment_frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="annually">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_installment_date" className="rtl-label">تاريخ أول قسط</Label>
            <Input
              id="first_installment_date"
              type="date"
              value={formData.first_installment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, first_installment_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جار الإنشاء..." : "إنشاء الخطة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}