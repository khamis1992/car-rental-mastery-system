import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { type SubscriptionPlanCode } from "@/types/subscription-plans";

interface Plan {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  period: string;
  limits?: {
    users: number;
    vehicles: number;
    contracts: number;
  };
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

    if (!formData.contactEmail.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني للشركة", variant: "destructive" });
      return false;
    }

    if (!formData.adminName.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم المدير", variant: "destructive" });
      return false;
    }

    if (!formData.adminEmail.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني للمدير", variant: "destructive" });
      return false;
    }

    if (!formData.adminPassword.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال كلمة المرور", variant: "destructive" });
      return false;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور وتأكيدها غير متطابقتين", variant: "destructive" });
      return false;
    }

    if (formData.adminPassword.length < 8) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون على الأقل 8 أحرف", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedPlan) return;

    setIsLoading(true);
    
    try {
      // استخدام معرف الخطة مباشرة من النظام الموحد
      const subscriptionPlan = selectedPlan.id as SubscriptionPlanCode;

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
      await handleSadadPayment(newTenant.id, selectedPlan);
      
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
      // استدعاء خدمة SADAD لإنشاء عملية دفع
      const response = await fetch('/api/sadad/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          amount: plan.price,
          description: `اشتراك ${plan.name} - ${formData.companyName}`,
          planId: plan.id
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء عملية الدفع');
      }

      const paymentData = await response.json();
      
      // توجيه المستخدم إلى صفحة الدفع
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      } else {
        toast({
          title: "تم إنشاء الحساب",
          description: "سيتم تفعيل حسابك قريباً",
        });
        onClose();
      }
      
    } catch (error: any) {
      console.error('Error creating SADAD payment:', error);
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء حسابك بنجاح، يرجى التواصل معنا لتفعيل الاشتراك",
      });
      onClose();
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
            <span className="mr-1">د.ك</span>
            <span className="mr-2">{selectedPlan.period}</span>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="mr-2 text-sm font-medium text-primary">البيانات</span>
            </div>
            <div className="w-12 h-0.5 bg-muted"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="mr-2 text-sm text-muted-foreground">الدفع</span>
            </div>
            <div className="w-12 h-0.5 bg-muted"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="mr-2 text-sm text-muted-foreground">التفعيل</span>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-primary text-sm">🎉</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">أهلاً بك في Fleetify!</h4>
              <p className="text-sm text-muted-foreground mt-1">
                ستبدأ بتجربة مجانية لمدة ١٤ يوماً مع إمكانية الوصول الكامل لجميع المزايا.
                يمكنك الإلغاء في أي وقت خلال فترة التجربة.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Benefits Reminder */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-foreground mb-3">ما يشمله اشتراكك:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>حتى {selectedPlan.limits?.users} مستخدم</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>حتى {selectedPlan.limits?.vehicles} مركبة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>حتى {selectedPlan.limits?.contracts} عقد</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>دعم فني ٢٤/٧</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {/* معلومات الشركة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                معلومات الشركة
              </h3>
              <span className="text-xs text-muted-foreground">الخطوة ١ من ٢</span>
            </div>
            
            <div className="bg-blue-50 border-r-4 border-blue-500 p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>نصيحة:</strong> تأكد من دقة بيانات الشركة حيث ستظهر في جميع الفواتير والعقود.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">اسم الشركة *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="مثال: شركة النقل المتقدمة"
                />
                <p className="text-xs text-muted-foreground mt-1">سيظهر هذا الاسم في رأس النظام والتقارير</p>
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
                <p className="text-xs text-muted-foreground mt-1">للتواصل الرسمي والإشعارات</p>
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
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="الكويت"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="الشارع، المنطقة، المحافظة"
                />
              </div>
            </div>
          </div>

          {/* معلومات المدير */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                معلومات المدير
              </h3>
              <span className="text-xs text-muted-foreground">الخطوة ٢ من ٢</span>
            </div>
            
            <div className="bg-amber-50 border-r-4 border-amber-500 p-3 mb-4">
              <p className="text-sm text-amber-800">
                🔐 <strong>أمان:</strong> سيتم إنشاء حساب المدير الرئيسي بصلاحيات كاملة للنظام.
              </p>
            </div>
            
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
                <p className="text-xs text-muted-foreground mt-1">سيستخدم هذا للدخول للنظام</p>
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
                <p className="text-xs text-muted-foreground mt-1">استخدم كلمة مرور قوية لحماية حسابك</p>
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

          {/* Next Steps Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3">الخطوات التالية:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs">1</span>
                <span>سيتم توجيهك لبوابة SADAD الآمنة لإتمام الدفع</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs">2</span>
                <span>تفعيل حسابك فوراً بعد تأكيد الدفع</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs">3</span>
                <span>استلام رسائل الترحيب وتعليمات البدء</span>
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

          {/* Security Note */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p>🔒 جميع بياناتك محمية بتشفير SSL وتُحفظ بأمان تام</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}