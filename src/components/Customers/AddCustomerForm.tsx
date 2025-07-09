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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Save, Loader } from 'lucide-react';

interface AddCustomerFormProps {
  onCustomerAdded: () => void;
}

const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onCustomerAdded }) => {
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    national_id: '',
    address: '',
    city: '',
    country: 'المملكة العربية السعودية',
    company_contact_person: '',
    company_registration_number: '',
    tax_number: '',
    notes: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم العميل مطلوب",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الهاتف مطلوب",
        variant: "destructive",
      });
      return false;
    }

    // التحقق من صحة رقم الهاتف السعودي
    const phoneRegex = /^(\+966|966|0)?[5][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الهاتف غير صحيح",
        variant: "destructive",
      });
      return false;
    }

    if (customerType === 'company' && !formData.company_contact_person.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم الشخص المسؤول مطلوب للشركات",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // توليد رقم العميل
      const { data: customerNumber, error: numberError } = await supabase
        .rpc('generate_customer_number');

      if (numberError) {
        console.error('خطأ في توليد رقم العميل:', numberError);
        toast({
          title: "خطأ",
          description: "فشل في توليد رقم العميل",
          variant: "destructive",
        });
        return;
      }

      // إضافة العميل
      const customerData = {
        customer_number: customerNumber,
        customer_type: customerType,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.replace(/\s/g, ''),
        national_id: formData.national_id.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country,
        company_contact_person: customerType === 'company' ? formData.company_contact_person.trim() : null,
        company_registration_number: customerType === 'company' ? formData.company_registration_number.trim() || null : null,
        tax_number: customerType === 'company' ? formData.tax_number.trim() || null : null,
        notes: formData.notes.trim() || null,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          tenant_id: null as any // Will be set by trigger
        }]);

      if (error) {
        console.error('خطأ في إضافة العميل:', error);
        
        if (error.code === '23505') {
          toast({
            title: "خطأ",
            description: "رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطأ",
            description: "فشل في إضافة العميل",
            variant: "destructive",
          });
        }
        return;
      }

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        email: '',
        phone: '',
        national_id: '',
        address: '',
        city: '',
        country: 'المملكة العربية السعودية',
        company_contact_person: '',
        company_registration_number: '',
        tax_number: '',
        notes: ''
      });

      onCustomerAdded();
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* اختيار نوع العميل */}
      <Card>
        <CardHeader>
          <CardTitle>نوع العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={customerType} onValueChange={(value) => setCustomerType(value as 'individual' | 'company')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                فرد
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                شركة
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* البيانات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                الاسم {customerType === 'company' ? 'التجاري' : 'الكامل'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={customerType === 'company' ? 'اسم الشركة' : 'الاسم الكامل'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="05xxxxxxxx"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">
                {customerType === 'company' ? 'رقم السجل التجاري' : 'رقم الهوية'}
              </Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => handleInputChange('national_id', e.target.value)}
                placeholder={customerType === 'company' ? '1010123456' : '1234567890'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بيانات إضافية للشركات */}
      {customerType === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle>بيانات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="tax_number">الرقم الضريبي</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => handleInputChange('tax_number', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* بيانات العنوان */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات العنوان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="العنوان التفصيلي"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="الرياض"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">الدولة</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="المملكة العربية السعودية"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات */}
      <Card>
        <CardHeader>
          <CardTitle>ملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="أي ملاحظات أو معلومات إضافية عن العميل"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراء */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
        </Button>
      </div>
    </form>
  );
};

export default AddCustomerForm;