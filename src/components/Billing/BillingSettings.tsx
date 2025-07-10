import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings,
  CreditCard,
  Mail,
  FileText,
  Bell,
  DollarSign,
  Globe
} from "lucide-react";

const BillingSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            الإعدادات العامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">اسم الشركة</Label>
              <Input id="company-name" defaultValue="شركة إدارة الأساطيل" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-number">الرقم الضريبي</Label>
              <Input id="tax-number" defaultValue="KW-123456789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-email">البريد الإلكتروني للفوترة</Label>
              <Input id="billing-email" type="email" defaultValue="billing@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">العملة الافتراضية</Label>
              <Select defaultValue="kwd">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kwd">دينار كويتي (KWD)</SelectItem>
                  <SelectItem value="usd">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="eur">يورو (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">عنوان الشركة</Label>
            <Textarea 
              id="company-address" 
              defaultValue="شارع الخليج العربي، مدينة الكويت، دولة الكويت"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            إعدادات الدفع
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="payment-terms">شروط الدفع (بالأيام)</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 يوم</SelectItem>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="45">45 يوم</SelectItem>
                  <SelectItem value="60">60 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-fee">رسوم التأخير (%)</Label>
              <Input id="late-fee" type="number" defaultValue="2.5" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-invoice">الفوترة التلقائية</Label>
                <p className="text-sm text-muted-foreground">إرسال الفواتير تلقائياً في تاريخ الاستحقاق</p>
              </div>
              <Switch id="auto-invoice" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-payment">الدفع التلقائي</Label>
                <p className="text-sm text-muted-foreground">تحصيل المدفوعات تلقائياً من الطرق المحفوظة</p>
              </div>
              <Switch id="auto-payment" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="grace-period">فترة السماح</Label>
                <p className="text-sm text-muted-foreground">السماح بفترة إضافية قبل تطبيق رسوم التأخير</p>
              </div>
              <Switch id="grace-period" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            قوالب الرسائل الإلكترونية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice-template">قالب إرسال الفاتورة</Label>
              <Textarea 
                id="invoice-template"
                rows={4}
                defaultValue="عزيزي العميل،&#10;&#10;نرسل لكم فاتورة الاشتراك الشهري. يرجى المراجعة والدفع في الموعد المحدد.&#10;&#10;شكراً لكم"
              />
            </div>
            
            <div>
              <Label htmlFor="reminder-template">قالب تذكير الدفع</Label>
              <Textarea 
                id="reminder-template"
                rows={4}
                defaultValue="تذكير: فاتورتكم مستحقة الدفع. يرجى المراجعة والدفع لتجنب رسوم التأخير.&#10;&#10;شكراً لكم"
              />
            </div>
            
            <div>
              <Label htmlFor="overdue-template">قالب الفواتير المتأخرة</Label>
              <Textarea 
                id="overdue-template"
                rows={4}
                defaultValue="إشعار هام: فاتورتكم متأخرة عن موعد الاستحقاق. يرجى الدفع فوراً لتجنب توقف الخدمة.&#10;&#10;شكراً لكم"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            إعدادات الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="payment-received">إشعار استلام الدفعة</Label>
                <p className="text-sm text-muted-foreground">إرسال إشعار عند استلام دفعة جديدة</p>
              </div>
              <Switch id="payment-received" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="invoice-sent">إشعار إرسال الفاتورة</Label>
                <p className="text-sm text-muted-foreground">إرسال إشعار عند إرسال فاتورة جديدة</p>
              </div>
              <Switch id="invoice-sent" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="overdue-alert">تنبيه الفواتير المتأخرة</Label>
                <p className="text-sm text-muted-foreground">تنبيه يومي عن الفواتير المتأخرة</p>
              </div>
              <Switch id="overdue-alert" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-report">التقرير الأسبوعي</Label>
                <p className="text-sm text-muted-foreground">إرسال تقرير أسبوعي عن حالة الفوترة</p>
              </div>
              <Switch id="weekly-report" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            إعدادات الفواتير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">بادئة رقم الفاتورة</Label>
              <Input id="invoice-prefix" defaultValue="INV-" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-numbering">نظام الترقيم</Label>
              <Select defaultValue="yearly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">متسلسل</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invoice-notes">ملاحظات افتراضية في الفاتورة</Label>
            <Textarea 
              id="invoice-notes"
              rows={3}
              defaultValue="شكراً لكم على ثقتكم بخدماتنا. في حال وجود أي استفسار، يرجى التواصل معنا."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">إلغاء</Button>
        <Button>حفظ الإعدادات</Button>
      </div>
    </div>
  );
};

export default BillingSettings;