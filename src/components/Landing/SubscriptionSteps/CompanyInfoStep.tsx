
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface CompanyInfoStepProps {
  formData: {
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
  };
  updateFormData: (field: string, value: string) => void;
}

export function CompanyInfoStep({ formData, updateFormData }: CompanyInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="rtl-title text-xl font-bold mb-2">معلومات الشركة</h3>
        <p className="text-muted-foreground">
          أدخل المعلومات الأساسية لشركتك لإنشاء حساب جديد
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="companyName" className="rtl-label">اسم الشركة *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => updateFormData('companyName', e.target.value)}
            placeholder="مثال: شركة النقل المتقدمة"
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="contactEmail" className="rtl-label">البريد الإلكتروني للشركة *</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
            placeholder="info@company.com"
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="contactPhone" className="rtl-label">رقم الهاتف</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => updateFormData('contactPhone', e.target.value)}
            placeholder="+965 XXXX XXXX"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="city" className="rtl-label">المدينة</Label>
          <Select onValueChange={(value) => updateFormData('city', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kuwait-city">مدينة الكويت</SelectItem>
              <SelectItem value="hawalli">حولي</SelectItem>
              <SelectItem value="farwaniya">الفروانية</SelectItem>
              <SelectItem value="mubarak-al-kabeer">مبارك الكبير</SelectItem>
              <SelectItem value="ahmadi">الأحمدي</SelectItem>
              <SelectItem value="jahra">الجهراء</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="address" className="rtl-label">العنوان</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            placeholder="الشارع، المنطقة، المحافظة"
            className="mt-1"
          />
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">لماذا نحتاج هذه المعلومات؟</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• لإنشاء حساب الشركة وتخصيص النظام</li>
          <li>• للتواصل معك وإرسال الفواتير</li>
          <li>• لضمان الامتثال للقوانين المحلية</li>
        </ul>
      </div>
    </div>
  );
}
