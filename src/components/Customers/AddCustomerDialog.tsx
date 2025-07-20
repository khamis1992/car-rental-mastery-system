
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Mail, Phone, MapPin, Building, CreditCard, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerDialogProps {
  trigger?: React.ReactNode;
}

const AddCustomerDialog = ({ trigger }: AddCustomerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    customer_type: 'individual' as 'individual' | 'company',
    national_id: '',
    company_name: '',
    company_registration_number: '',
    address_line1: '',
    address_line2: '',
    area: '',
    governorate: '',
    postal_code: '',
    country: 'الكويت'
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      customer_type: 'individual',
      national_id: '',
      company_name: '',
      company_registration_number: '',
      address_line1: '',
      address_line2: '',
      area: '',
      governorate: '',
      postal_code: '',
      country: 'الكويت'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on customer type
    if (formData.customer_type === 'individual' && !formData.national_id.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "الرقم المدني مطلوب للعملاء الأفراد",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.customer_type === 'company' && !formData.company_registration_number.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "رقم تسجيل الشركة مطلوب للعملاء الشركات",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would typically save to database
    console.log('إضافة عميل جديد:', formData);
    
    toast({
      title: "تم إضافة العميل بنجاح",
      description: `تم إضافة ${formData.name} إلى قائمة العملاء`,
    });
    
    // Reset form and close dialog
    resetForm();
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="btn-primary rtl-flex">
            <Plus className="w-4 h-4" />
            عميل جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <User className="w-5 h-5" />
            إضافة عميل جديد
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type Selection */}
          <div className="space-y-2">
            <Label className="rtl-label flex items-center gap-2 flex-row-reverse">
              <Building className="w-4 h-4" />
              نوع العميل
            </Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value) => handleInputChange('customer_type', value)}
            >
              <SelectTrigger className="text-right">
                <SelectValue placeholder="اختر نوع العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">فرد</SelectItem>
                <SelectItem value="company">شركة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="rtl-label">اسم العميل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="أدخل اسم العميل الكامل"
                required
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="rtl-label flex items-center gap-2 flex-row-reverse">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                required
                className="text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="rtl-label flex items-center gap-2 flex-row-reverse">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+965 9999 8888"
                required
                className="text-right"
              />
            </div>

            {/* National ID or Company Registration */}
            <div className="space-y-2">
              <Label className="rtl-label flex items-center gap-2 flex-row-reverse">
                <CreditCard className="w-4 h-4" />
                {formData.customer_type === 'individual' ? 'الرقم المدني' : 'رقم تسجيل الشركة'}
              </Label>
              <Input
                value={formData.customer_type === 'individual' ? formData.national_id : formData.company_registration_number}
                onChange={(e) => handleInputChange(
                  formData.customer_type === 'individual' ? 'national_id' : 'company_registration_number', 
                  e.target.value
                )}
                placeholder={formData.customer_type === 'individual' ? '12345678901234' : 'CR123456789'}
                required
                className="text-right"
              />
            </div>
          </div>

          {/* Company Name (only for company type) */}
          {formData.customer_type === 'company' && (
            <div className="space-y-2">
              <Label htmlFor="company_name" className="rtl-label">اسم الشركة</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="أدخل اسم الشركة الرسمي"
                className="text-right"
              />
            </div>
          )}

          {/* Address Information */}
          <div className="space-y-4">
            <Label className="rtl-label flex items-center gap-2 flex-row-reverse">
              <Home className="w-4 h-4" />
              العنوان
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_line1" className="text-sm">العنوان الرئيسي</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  placeholder="العنوان الرئيسي"
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address_line2" className="text-sm">العنوان الثانوي (اختياري)</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange('address_line2', e.target.value)}
                  placeholder="العنوان الثانوي"
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm">المنطقة</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="المنطقة"
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="governorate" className="text-sm">المحافظة</Label>
                <Select
                  value={formData.governorate}
                  onValueChange={(value) => handleInputChange('governorate', value)}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="العاصمة">العاصمة</SelectItem>
                    <SelectItem value="حولي">حولي</SelectItem>
                    <SelectItem value="الفروانية">الفروانية</SelectItem>
                    <SelectItem value="مبارك الكبير">مبارك الكبير</SelectItem>
                    <SelectItem value="الأحمدي">الأحمدي</SelectItem>
                    <SelectItem value="الجهراء">الجهراء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-sm">الرمز البريدي</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="12345"
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm">البلد</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="الكويت"
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="rtl-label flex items-center gap-2 flex-row-reverse">
                  <MapPin className="w-4 h-4" />
                  المدينة
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="الكويت"
                  required
                  className="text-right"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="btn-primary">
              إضافة العميل
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;
