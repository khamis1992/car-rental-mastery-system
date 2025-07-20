import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer } from '@/hooks/useCustomers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated: () => void;
}

const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    national_id: '',
    customer_type: 'individual' as 'individual' | 'company',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        national_id: customer.national_id || '',
        customer_type: customer.customer_type,
        status: customer.status,
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          national_id: formData.national_id || null,
          customer_type: formData.customer_type,
          status: formData.status,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast.success('تم تحديث بيانات العميل بنجاح');
      onCustomerUpdated();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating customer:', err);
      toast.error('فشل في تحديث بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">تعديل بيانات العميل</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">الرقم المدني</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_type">نوع العميل</Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value: 'individual' | 'company') => 
                  setFormData(prev => ({ ...prev, customer_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">فرد</SelectItem>
                  <SelectItem value="company">شركة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select
              value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'blocked') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="blocked">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;