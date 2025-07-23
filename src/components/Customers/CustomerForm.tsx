import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerOperations } from '@/hooks/useCustomerOperations';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Save, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Customer {
  id?: string;
  customer_number?: string;
  customer_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  address?: string;
  city?: string;
  country?: string;
  company_contact_person?: string;
  company_registration_number?: string;
  tax_number?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'blocked';
}

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  mode: 'add' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSuccess, mode }) => {
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'individual' | 'company'>(
    customer?.customer_type || 'individual'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    national_id: customer?.national_id || '',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || 'الكويت',
    company_contact_person: customer?.company_contact_person || '',
    company_registration_number: customer?.company_registration_number || '',
    tax_number: customer?.tax_number || '',
    notes: customer?.notes || ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { addCustomer, updateCustomer, validateCustomerData, isLoading: operationLoading } = useCustomerOperations();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const customerData = {
      customer_type: customerType,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.replace(/[\s\-\(\)]/g, ''),
      national_id: formData.national_id.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      country: formData.country,
      company_contact_person: customerType === 'company' ? formData.company_contact_person.trim() : undefined,
      company_registration_number: customerType === 'company' ? formData.company_registration_number.trim() || undefined : undefined,
      tax_number: customerType === 'company' ? formData.tax_number.trim() || undefined : undefined,
      notes: formData.notes.trim() || undefined,
    };

    const validationErrors = validateCustomerData(customerData);
    
    if (validationErrors.length > 0) {
      toast({
        title: "خطأ في البيانات",
        description: validationErrors[0], // عرض أول خطأ
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const customerData = {
      customer_type: customerType,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.replace(/[\s\-\(\)]/g, ''),
      national_id: formData.national_id.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      country: formData.country,
      company_contact_person: customerType === 'company' ? formData.company_contact_person.trim() : undefined,
      company_registration_number: customerType === 'company' ? formData.company_registration_number.trim() || undefined : undefined,
      tax_number: customerType === 'company' ? formData.tax_number.trim() || undefined : undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (mode === 'edit' && customer?.id) {
        await updateCustomer(customer.id, customerData);
      } else {
        await addCustomer(customerData);
      }
      onSuccess();
    } catch (error) {
      console.error('خطأ في العملية:', error);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {mode === 'edit' ? 'تعديل بيانات العميل' : 'بيانات العميل الأساسية'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* نوع العميل */}
            <div className="space-y-2">
              <Label>نوع العميل</Label>
              <Select value={customerType} onValueChange={(value) => setCustomerType(value as 'individual' | 'company')}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العميل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      فرد
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      شركة
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الحقول الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {customerType === 'company' ? 'اسم الشركة' : 'اسم العميل'} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={customerType === 'company' ? 'شركة النجوم' : 'أحمد محمد'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="65123456"
                  required
                />
              </div>
            </div>

            {/* الشخص المسؤول للشركات */}
            {customerType === 'company' && (
              <div className="space-y-2">
                <Label htmlFor="company_contact_person">الشخص المسؤول *</Label>
                <Input
                  id="company_contact_person"
                  value={formData.company_contact_person}
                  onChange={(e) => handleInputChange('company_contact_person', e.target.value)}
                  placeholder="اسم الشخص المسؤول"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* البيانات الإضافية */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" type="button" className="w-full flex items-center justify-between">
              بيانات إضافية (اختيارية)
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <Card>
              <CardContent className="pt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="national_id">
                      {customerType === 'company' ? 'رقم السجل التجاري' : 'رقم الهوية المدنية'}
                    </Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange('national_id', e.target.value)}
                      placeholder={customerType === 'company' ? '123456789' : '287654321'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="مدينة الكويت"
                    />
                  </div>
                </div>

                {customerType === 'company' && (
                  <div className="space-y-2">
                    <Label htmlFor="tax_number">الرقم الضريبي</Label>
                    <Input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => handleInputChange('tax_number', e.target.value)}
                      placeholder="123456789123456"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="العنوان التفصيلي"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="أي ملاحظات إضافية"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* أزرار الإجراء */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
          <Button
            type="submit"
            disabled={loading || operationLoading}
            className="btn-primary flex items-center gap-2 min-w-[120px]"
          >
            {(loading || operationLoading) ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {(loading || operationLoading) ? 
              (mode === 'edit' ? 'جاري التحديث...' : 'جاري الحفظ...') : 
              (mode === 'edit' ? 'تحديث العميل' : 'حفظ العميل')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;