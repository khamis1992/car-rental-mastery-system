import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { quotationService } from '@/services/quotationService';

interface QuotationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  onSuccess: () => void;
}

export const QuotationEditDialog: React.FC<QuotationEditDialogProps> = ({
  open,
  onOpenChange,
  quotationId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    daily_rate: '',
    discount_amount: '0',
    tax_amount: '0',
    special_conditions: '',
    terms_and_conditions: '',
    valid_until: '',
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && quotationId) {
      loadQuotationData();
      loadCustomersAndVehicles();
    }
  }, [open, quotationId]);

  const loadQuotationData = async () => {
    try {
      setLoading(true);
      const quotation = await quotationService.getQuotationById(quotationId);
      if (quotation) {
        setFormData({
          customer_id: quotation.customer_id,
          vehicle_id: quotation.vehicle_id,
          start_date: quotation.start_date,
          end_date: quotation.end_date,
          daily_rate: quotation.daily_rate.toString(),
          discount_amount: quotation.discount_amount?.toString() || '0',
          tax_amount: quotation.tax_amount?.toString() || '0',
          special_conditions: quotation.special_conditions || '',
          terms_and_conditions: quotation.terms_and_conditions || '',
          valid_until: quotation.valid_until,
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل بيانات العرض',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersAndVehicles = async () => {
    try {
      const [customersRes, vehiclesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, customer_number')
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('vehicles')
          .select('id, make, model, vehicle_number, daily_rate')
          .eq('status', 'available')
          .order('vehicle_number'),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      setCustomers(customersRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const rentalDays = Math.ceil(
        (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) 
        / (1000 * 60 * 60 * 24)
      );

      const dailyRate = parseFloat(formData.daily_rate);
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const totalAmount = dailyRate * rentalDays;
      const finalAmount = totalAmount - discountAmount + taxAmount;

      const { error } = await supabase
        .from('quotations')
        .update({
          customer_id: formData.customer_id,
          vehicle_id: formData.vehicle_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          rental_days: rentalDays,
          daily_rate: dailyRate,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          final_amount: finalAmount,
          special_conditions: formData.special_conditions,
          terms_and_conditions: formData.terms_and_conditions,
          valid_until: formData.valid_until,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quotationId);

      if (error) throw error;

      toast({
        title: 'تم تحديث العرض',
        description: 'تم تحديث عرض السعر بنجاح',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>جارِ تحميل البيانات...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل عرض السعر</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">العميل *</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_id">المركبة *</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => {
                const vehicle = vehicles.find(v => v.id === value);
                setFormData({
                  ...formData, 
                  vehicle_id: value,
                  daily_rate: vehicle?.daily_rate?.toString() || ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركبة" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.vehicle_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">تاريخ البداية *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">تاريخ النهاية *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_rate">السعر اليومي (د.ك) *</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.daily_rate}
                onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">صالح حتى *</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount">مبلغ الخصم (د.ك)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.discount_amount}
                onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_amount">مبلغ الضريبة (د.ك)</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.tax_amount}
                onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="special_conditions">شروط خاصة</Label>
              <Textarea
                value={formData.special_conditions}
                onChange={(e) => setFormData({...formData, special_conditions: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">الأحكام والشروط</Label>
              <Textarea
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({...formData, terms_and_conditions: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};