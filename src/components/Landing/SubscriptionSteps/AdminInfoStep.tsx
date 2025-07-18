
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminInfoStepProps {
  formData: {
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    confirmPassword: string;
  };
  updateFormData: (field: string, value: string) => void;
}

export function AdminInfoStep({ formData, updateFormData }: AdminInfoStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <User className="w-16 h-16 text-primary mx-auto mb-4" />
          <Shield className="w-6 h-6 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
        </div>
        <h3 className="text-xl font-bold mb-2">حساب المدير</h3>
        <p className="text-muted-foreground">
          إنشاء حساب المدير الذي سيتولى إدارة النظام والموظفين
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="adminName" className="rtl-label">اسم المدير *</Label>
          <Input
            id="adminName"
            value={formData.adminName}
            onChange={(e) => updateFormData('adminName', e.target.value)}
            placeholder="الاسم الكامل للمدير"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="adminEmail" className="rtl-label">البريد الإلكتروني للمدير *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => updateFormData('adminEmail', e.target.value)}
            placeholder="admin@company.com"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            سيستخدم هذا البريد لتسجيل الدخول إلى النظام
          </p>
        </div>
        
        <div>
          <Label htmlFor="adminPassword" className="rtl-label">كلمة المرور *</Label>
          <div className="relative mt-1">
            <Input
              id="adminPassword"
              type={showPassword ? "text" : "password"}
              value={formData.adminPassword}
              onChange={(e) => updateFormData('adminPassword', e.target.value)}
              placeholder="8 أحرف على الأقل"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="confirmPassword" className="rtl-label">تأكيد كلمة المرور *</Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-medium mb-2 text-blue-900">صلاحيات المدير</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• إدارة جميع المستخدمين والموظفين</li>
          <li>• الوصول الكامل لجميع وظائف النظام</li>
          <li>• إدارة العقود والفواتير</li>
          <li>• عرض التقارير المالية والإدارية</li>
        </ul>
      </div>
    </div>
  );
}
