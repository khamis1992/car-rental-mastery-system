import React, { useState } from 'react';
import { Mail, Send, MessageSquare, Phone, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Communications = () => {
  const { toast } = useToast();
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '',
    content: '',
    type: 'reminder'
  });

  const [smsTemplate, setSmsTemplate] = useState({
    content: '',
    type: 'reminder'
  });

  const [automationSettings, setAutomationSettings] = useState({
    contractExpiry: true,
    paymentReminder: true,
    maintenanceAlert: false,
    welcomeMessage: true,
    returnReminder: true
  });

  const communicationHistory = [
    {
      id: '1',
      type: 'email',
      recipient: 'ahmed@example.com',
      subject: 'تذكير انتهاء العقد',
      status: 'sent',
      timestamp: '2025-01-01 10:30',
      template: 'contract_expiry'
    },
    {
      id: '2',
      type: 'sms',
      recipient: '+966501234567',
      subject: 'تذكير إرجاع السيارة',
      status: 'delivered',
      timestamp: '2025-01-01 09:15',
      template: 'return_reminder'
    },
    {
      id: '3',
      type: 'email',
      recipient: 'fatima@example.com',
      subject: 'رسالة ترحيب',
      status: 'opened',
      timestamp: '2024-12-31 14:22',
      template: 'welcome'
    },
    {
      id: '4',
      type: 'sms',
      recipient: '+966507654321',
      subject: 'تذكير دفع',
      status: 'failed',
      timestamp: '2024-12-31 12:10',
      template: 'payment_reminder'
    }
  ];

  const emailTemplates = [
    {
      id: 'contract_expiry',
      name: 'انتهاء العقد',
      subject: 'تذكير: ينتهي عقد الإيجار الخاص بك قريباً',
      content: `عزيزي/عزيزتي [اسم العميل],

نود تذكيركم بأن عقد إيجار السيارة رقم [رقم العقد] سينتهي في [تاريخ الانتهاء].

تفاصيل العقد:
- نوع السيارة: [نوع السيارة]
- رقم اللوحة: [رقم اللوحة]
- تاريخ الانتهاء: [تاريخ الانتهاء]
- موقع الإرجاع: [موقع الإرجاع]

يرجى ترتيب إرجاع السيارة في الموعد المحدد.

شكراً لكم
فريق إدارة تأجير السيارات`
    },
    {
      id: 'payment_reminder',
      name: 'تذكير الدفع',
      subject: 'تذكير: استحقاق دفعة',
      content: `عزيزي/عزيزتي [اسم العميل],

هذا تذكير بأن لديكم دفعة مستحقة بقيمة [المبلغ] ر.س لعقد رقم [رقم العقد].

تاريخ الاستحقاق: [تاريخ الاستحقاق]

يرجى المبادرة بالدفع لتجنب أي رسوم إضافية.

شكراً لكم`
    },
    {
      id: 'welcome',
      name: 'رسالة ترحيب',
      subject: 'مرحباً بك في خدماتنا!',
      content: `عزيزي/عزيزتي [اسم العميل],

مرحباً بكم في شركتنا لتأجير السيارات!

نحن سعداء لخدمتكم ونتطلع لتقديم أفضل تجربة تأجير ممكنة.

في حال وجود أي استفسارات، لا تترددوا في التواصل معنا.

أهلاً وسهلاً بكم`
    }
  ];

  const smsTemplates = [
    {
      id: 'return_reminder',
      name: 'تذكير الإرجاع',
      content: 'تذكير: إرجاع السيارة [رقم اللوحة] غداً في [الوقت]. الموقع: [موقع الإرجاع]. شكراً لكم.'
    },
    {
      id: 'payment_sms',
      name: 'تذكير دفع (SMS)',
      content: 'استحقاق دفعة بقيمة [المبلغ] ر.س لعقد [رقم العقد]. التاريخ: [تاريخ الاستحقاق]. للدفع: [رابط الدفع]'
    },
    {
      id: 'contract_confirmed',
      name: 'تأكيد العقد',
      content: 'تم تأكيد عقدكم رقم [رقم العقد]. موعد الاستلام: [تاريخ الاستلام] في [الموقع]. شكراً لثقتكم.'
    }
  ];

  const handleSendEmail = async () => {
    toast({
      title: "إرسال البريد الإلكتروني",
      description: "سيتم إرسال البريد الإلكتروني قريباً. تحتاج إلى إعداد خدمة البريد الإلكتروني أولاً.",
    });
  };

  const handleSendSms = async () => {
    toast({
      title: "إرسال الرسالة النصية",
      description: "سيتم إرسال الرسالة النصية قريباً. تحتاج إلى إعداد خدمة SMS أولاً.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500 text-white">مُرسل</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500 text-white">تم التسليم</Badge>;
      case 'opened':
        return <Badge className="bg-purple-500 text-white">تم الفتح</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">فشل</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">نظام التواصل الآلي</h1>
          <p className="text-muted-foreground">إدارة البريد الإلكتروني والرسائل النصية التلقائية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            تقرير التواصل
          </Button>
        </div>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">السجل</TabsTrigger>
          <TabsTrigger value="automation">الأتمتة</TabsTrigger>
          <TabsTrigger value="sms">الرسائل النصية</TabsTrigger>
          <TabsTrigger value="email">البريد الإلكتروني</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  إنشاء بريد إلكتروني
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailType">نوع الرسالة</Label>
                  <Select value={emailTemplate.type} onValueChange={(value) => setEmailTemplate(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminder">تذكير</SelectItem>
                      <SelectItem value="notification">إشعار</SelectItem>
                      <SelectItem value="welcome">ترحيب</SelectItem>
                      <SelectItem value="confirmation">تأكيد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">الموضوع</Label>
                  <Input
                    id="emailSubject"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="أدخل موضوع البريد الإلكتروني"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailContent">المحتوى</Label>
                  <Textarea
                    id="emailContent"
                    rows={8}
                    value={emailTemplate.content}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="أدخل محتوى البريد الإلكتروني..."
                  />
                </div>
                
                <Button onClick={handleSendEmail} className="w-full btn-primary">
                  <Send className="w-4 h-4 mr-2" />
                  إرسال البريد الإلكتروني
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>قوالب البريد الإلكتروني</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEmailTemplate({
                            type: template.id,
                            subject: template.subject,
                            content: template.content
                          })}
                        >
                          استخدام
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  إنشاء رسالة نصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smsType">نوع الرسالة</Label>
                  <Select value={smsTemplate.type} onValueChange={(value) => setSmsTemplate(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminder">تذكير</SelectItem>
                      <SelectItem value="notification">إشعار</SelectItem>
                      <SelectItem value="confirmation">تأكيد</SelectItem>
                      <SelectItem value="alert">تنبيه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smsContent">النص (160 حرف كحد أقصى)</Label>
                  <Textarea
                    id="smsContent"
                    rows={4}
                    value={smsTemplate.content}
                    onChange={(e) => setSmsTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="أدخل نص الرسالة..."
                    maxLength={160}
                  />
                  <p className="text-sm text-muted-foreground">
                    {smsTemplate.content.length}/160 حرف
                  </p>
                </div>
                
                <Button onClick={handleSendSms} className="w-full btn-primary">
                  <Send className="w-4 h-4 mr-2" />
                  إرسال الرسالة النصية
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>قوالب الرسائل النصية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smsTemplates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSmsTemplate({
                            type: template.id,
                            content: template.content
                          })}
                        >
                          استخدام
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                إعدادات الأتمتة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تذكير انتهاء العقد</Label>
                    <p className="text-sm text-muted-foreground">إرسال تذكير قبل 3 أيام من انتهاء العقد</p>
                  </div>
                  <Switch
                    checked={automationSettings.contractExpiry}
                    onCheckedChange={(checked) => 
                      setAutomationSettings(prev => ({ ...prev, contractExpiry: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تذكير الدفع</Label>
                    <p className="text-sm text-muted-foreground">تذكير العملاء بالمدفوعات المستحقة</p>
                  </div>
                  <Switch
                    checked={automationSettings.paymentReminder}
                    onCheckedChange={(checked) => 
                      setAutomationSettings(prev => ({ ...prev, paymentReminder: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تنبيه الصيانة</Label>
                    <p className="text-sm text-muted-foreground">إشعار بمواعيد الصيانة المجدولة</p>
                  </div>
                  <Switch
                    checked={automationSettings.maintenanceAlert}
                    onCheckedChange={(checked) => 
                      setAutomationSettings(prev => ({ ...prev, maintenanceAlert: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>رسالة ترحيب</Label>
                    <p className="text-sm text-muted-foreground">رسالة ترحيب تلقائية للعملاء الجدد</p>
                  </div>
                  <Switch
                    checked={automationSettings.welcomeMessage}
                    onCheckedChange={(checked) => 
                      setAutomationSettings(prev => ({ ...prev, welcomeMessage: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تذكير الإرجاع</Label>
                    <p className="text-sm text-muted-foreground">تذكير بموعد إرجاع السيارة</p>
                  </div>
                  <Switch
                    checked={automationSettings.returnReminder}
                    onCheckedChange={(checked) => 
                      setAutomationSettings(prev => ({ ...prev, returnReminder: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                سجل التواصل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communicationHistory.map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(comm.type)}
                      <div>
                        <p className="font-medium">{comm.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          إلى: {comm.recipient} • {comm.timestamp}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(comm.status)}
                      <Badge variant="outline">
                        {comm.template}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communications;