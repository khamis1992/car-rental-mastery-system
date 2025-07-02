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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Save, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CompactAddCustomerFormProps {
  onCustomerAdded: () => void;
}

const CompactAddCustomerForm: React.FC<CompactAddCustomerFormProps> = ({ onCustomerAdded }) => {
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    national_id: '',
    address: '',
    city: '',
    country: 'الكويت',
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

    // التحقق من صحة رقم الهاتف الكويتي
    const phoneRegex = /^(\+965|965|0)?[569][0-9]{7}$/;
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
        .insert([customerData]);

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

      toast({
        title: "نجح الحفظ",
        description: "تم إضافة العميل بنجاح",
      });

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        email: '',
        phone: '',
        national_id: '',
        address: '',
        city: '',
        country: 'الكويت',
        company_contact_person: '',
        company_registration_number: '',
        tax_number: '',
        notes: ''
      });
      setShowAdvanced(false);

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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* البيانات الأساسية */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">بيانات العميل الأساسية</CardTitle>
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
            disabled={loading}
            className="btn-primary flex items-center gap-2 min-w-[120px]"
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
    </div>
  );
};

export default CompactAddCustomerForm;