import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { TenantService } from "@/services/tenantService";

interface Plan {
  name: string;
  price: string;
  period: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
}

interface CompanyFormData {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export function SubscriptionModal({ isOpen, onClose, selectedPlan }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: ""
  });
  
  const { toast } = useToast();
  const tenantService = new TenantService();

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم الشركة", variant: "destructive" });
      return false;
    }
    
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح للشركة", variant: "destructive" });
      return false;
    }
    
    if (!formData.adminName.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم المدير", variant: "destructive" });
      return false;
    }
    
    if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
      toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح للمدير", variant: "destructive" });
      return false;
    }
    
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل", variant: "destructive" });
      return false;
    }
    
    if (formData.adminPassword !== formData.confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور وتأكيدها غير متطابقين", variant: "destructive" });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedPlan) return;

    setIsLoading(true);
    
    try {
      // تحديد نوع الباقة
      let subscriptionPlan: 'basic' | 'standard' | 'premium' | 'enterprise';
      if (selectedPlan.name === "الباقة الأساسية") {
        subscriptionPlan = 'basic';
      } else if (selectedPlan.name === "الباقة المتقدمة") {
        subscriptionPlan = 'premium';
      } else {
        subscriptionPlan = 'enterprise';
      }

      // إنشاء slug من اسم الشركة
      const slug = formData.companyName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '')
        .substring(0, 50);

      // إنشاء المؤسسة
      const tenantData = {
        name: formData.companyName,
        slug: slug,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        country: 'KW',
        timezone: 'Asia/Kuwait',
        currency: 'KWD',
        subscription_plan: subscriptionPlan,
        admin_user: {
          email: formData.adminEmail,
          password: formData.adminPassword,
          full_name: formData.adminName
        }
      };

      console.log('Creating tenant with data:', tenantData);
      const newTenant = await tenantService.createTenant(tenantData);
      
      toast({
        title: "تم إنشاء الشركة بنجاح!",
        description: "سيتم توجيهك إلى بوابة SADAD لإتمام الدفع",
      });

      // الآن نحتاج لتوجيه المستخدم إلى SADAD
      if (newTenant.tenant_id) {
        await handleSadadPayment(newTenant.tenant_id, selectedPlan);
      }
      
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast({
        title: "خطأ في إنشاء الشركة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSadadPayment = async (tenantId: string, plan: Plan) => {
    try {
      // حساب المبلغ
      const amount = parseFloat(plan.price.replace(/[^\d]/g, '')) * 100; // تحويل إلى فلس
      
      // إنشاء دفعة SADAD
      const paymentData = {
        tenant_id: tenantId,
        amount: amount,
        currency: 'KWD',
        description: `اشتراك ${plan.name} - ${plan.period}`,
        customer_info: {
          name: formData.companyName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        return_url: `${window.location.origin}/payment-success?tenant_id=${tenantId}`,
        cancel_url: `${window.location.origin}/payment-cancel?tenant_id=${tenantId}`
      };

      // هنا سنحتاج لاستدعاء API SADAD
      // للآن سنقوم بمحاكاة التوجيه
      console.log('SADAD Payment Data:', paymentData);
      
      // محاكاة التوجيه إلى SADAD
      const sadadUrl = `https://sadad.kw/payment?amount=${amount}&reference=${tenantId}&return_url=${encodeURIComponent(paymentData.return_url)}`;
      
      toast({
        title: "جاري التوجيه إلى بوابة الدفع",
        description: "سيتم توجيهك إلى SADAD خلال ثوانٍ قليلة...",
      });

      // توجيه إلى صفحة محاكاة SADAD
      setTimeout(() => {
        window.location.href = `/sadad-simulation?amount=${amount}&tenant_id=${tenantId}&plan=${encodeURIComponent(plan.name)}`;
      }, 2000);

    } catch (error: any) {
      console.error('Error creating SADAD payment:', error);
      toast({
        title: "خطأ في معالجة الدفع",
        description: "حدث خطأ أثناء إنشاء عملية الدفع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  if (!selectedPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            الاشتراك في {selectedPlan.name}
          </DialogTitle>
          <div className="text-center text-muted-foreground">
            <span className="text-lg font-semibold">{selectedPlan.price}</span>
            {selectedPlan.price !== "مخصص" && <span className="mr-1">د.ك</span>}
            <span className="mr-2">{selectedPlan.period}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* معلومات الشركة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              معلومات الشركة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">اسم الشركة *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="مثال: شركة النقل المتقدمة"
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">البريد الإلكتروني للشركة *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="info@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="contactPhone">رقم الهاتف</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+965 XXXX XXXX"
                />
              </div>
              
              <div>
                <Label htmlFor="city">المدينة</Label>
                <Select onValueChange={(value) => handleInputChange('city', value)}>
                  <SelectTrigger>
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
            </div>
            
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="الشارع، المنطقة، المحافظة"
              />
            </div>
          </div>

          {/* معلومات المدير */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              معلومات المدير
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminName">اسم المدير *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  placeholder="الاسم الكامل للمدير"
                />
              </div>
              
              <div>
                <Label htmlFor="adminEmail">البريد الإلكتروني للمدير *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  placeholder="admin@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="adminPassword">كلمة المرور *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  placeholder="8 أحرف على الأقل"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                'إنشاء الشركة والمتابعة للدفع'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}