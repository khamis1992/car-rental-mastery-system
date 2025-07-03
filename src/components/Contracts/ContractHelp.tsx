import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  FileText, 
  PenTool, 
  Truck, 
  DollarSign, 
  Package,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  Phone,
  MessageCircle
} from 'lucide-react';

interface ContractHelpProps {
  trigger?: React.ReactNode;
  currentStatus?: string;
}

export const ContractHelp: React.FC<ContractHelpProps> = ({ 
  trigger,
  currentStatus 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const contractSteps = [
    {
      id: 'draft',
      title: 'إنشاء العقد',
      icon: FileText,
      description: 'إعداد العقد بالتفاصيل الأساسية',
      tasks: [
        'اختيار العميل والمركبة',
        'تحديد فترة الإيجار',
        'تحديد الأسعار والخصومات',
        'إضافة الشروط الخاصة'
      ],
      tips: [
        'تأكد من صحة بيانات العميل',
        'تحقق من توفر المركبة في الفترة المطلوبة',
        'راجع الأسعار المحدثة للمركبة'
      ]
    },
    {
      id: 'pending',
      title: 'التوقيع',
      icon: PenTool,
      description: 'توقيع العقد من جميع الأطراف',
      tasks: [
        'مراجعة تفاصيل العقد',
        'توقيع العميل',
        'توقيع ممثل الشركة',
        'إرفاق المستندات المطلوبة'
      ],
      tips: [
        'تأكد من قراءة العميل لجميع الشروط',
        'احتفظ بنسخة من هوية العميل ورخصة القيادة',
        'وثق عملية التوقيع بالتاريخ والوقت'
      ]
    },
    {
      id: 'active',
      title: 'التسليم',
      icon: Truck,
      description: 'تسليم المركبة للعميل',
      tasks: [
        'فحص حالة المركبة',
        'تسجيل قراءة العداد',
        'توثيق مستوى الوقود',
        'تسليم المفاتيح والوثائق'
      ],
      tips: [
        'فحص شامل للمركبة قبل التسليم',
        'التقط صور للأضرار الموجودة',
        'تأكد من وجود جميع إكسسوارات المركبة'
      ]
    },
    {
      id: 'payment',
      title: 'الدفع',
      icon: DollarSign,
      description: 'تسجيل وإدارة المدفوعات',
      tasks: [
        'تحديد طريقة الدفع',
        'إصدار الفاتورة',
        'تسجيل المدفوعات',
        'متابعة المتأخرات'
      ],
      tips: [
        'اطلب الدفع المقدم حسب السياسة',
        'أصدر إيصال دفع لكل معاملة',
        'تابع تواريخ استحقاق الدفعات'
      ]
    },
    {
      id: 'completed',
      title: 'الاستلام',
      icon: Package,
      description: 'استلام المركبة وإنهاء العقد',
      tasks: [
        'فحص حالة المركبة عند الإرجاع',
        'مقارنة الحالة مع وقت التسليم',
        'حساب أي رسوم إضافية',
        'إقفال العقد'
      ],
      tips: [
        'فحص دقيق للأضرار الجديدة',
        'تحقق من مستوى الوقود',
        'احسب المسافة المقطوعة',
        'قم بتنظيف المركبة إذا لزم الأمر'
      ]
    }
  ];

  const commonQuestions = [
    {
      question: 'كيف يمكنني إلغاء عقد؟',
      answer: 'يمكن إلغاء العقد من قائمة الإجراءات بجانب العقد. العقود في حالة "مسودة" يمكن حذفها نهائياً، بينما العقود الأخرى يتم تغيير حالتها إلى "ملغي".'
    },
    {
      question: 'ماذا لو تأخر العميل عن إرجاع المركبة؟',
      answer: 'يمكنك تمديد العقد من خلال الإجراءات، أو إضافة رسوم تأخير من قسم الرسوم الإضافية. تأكد من توثيق سبب التأخير.'
    },
    {
      question: 'كيف أتعامل مع الأضرار في المركبة؟',
      answer: 'استخدم المخطط التفاعلي لتوثيق الأضرار، والتقط صور واضحة، وحدد مستوى الضرر. يمكنك إضافة تكلفة الإصلاح في الرسوم الإضافية.'
    },
    {
      question: 'كيف أضيف خصم للعميل؟',
      answer: 'يمكن إضافة الخصم أثناء إنشاء العقد في قسم التسعير، أو إضافة خصم لاحق من خلال تعديل العقد أو الفاتورة.'
    },
    {
      question: 'ماذا لو لم يدفع العميل؟',
      answer: 'تابع حالة الدفع من قسم الفواتير. يمكنك إرسال تذكيرات دفع، أو إضافة رسوم تأخير، أو تحويل الحالة إلى "متأخرة".'
    }
  ];

  const getStatusInfo = (status: string) => {
    const step = contractSteps.find(s => s.id === status);
    return step || contractSteps[0];
  };

  const currentStep = currentStatus ? getStatusInfo(currentStatus) : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            مساعدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            دليل إدارة العقود
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="current">الخطوة الحالية</TabsTrigger>
            <TabsTrigger value="faq">أسئلة شائعة</TabsTrigger>
            <TabsTrigger value="contact">اتصل بنا</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>دورة حياة العقد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {contractSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{step.title}</h4>
                            <Badge variant="outline">خطوة {index + 1}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium mb-2">المهام الأساسية:</h5>
                              <ul className="space-y-1">
                                {step.tasks.map((task, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium mb-2">نصائح مهمة:</h5>
                              <ul className="space-y-1">
                                {step.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="current" className="space-y-6">
            {currentStep ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <currentStep.icon className="w-5 h-5" />
                    {currentStep.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{currentStep.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">ما يجب فعله الآن:</h4>
                        <ul className="space-y-2">
                          {currentStep.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">نصائح مفيدة:</h4>
                        <ul className="space-y-2">
                          {currentStep.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد معلومات عن الحالة الحالية</h3>
                  <p className="text-muted-foreground">حدد عقداً لعرض المساعدة الخاصة بحالته</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            {commonQuestions.map((qa, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">{qa.question}</h4>
                  <p className="text-sm text-muted-foreground">{qa.answer}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تحتاج مساعدة إضافية؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <Phone className="w-5 h-5 ml-3" />
                    <div className="text-right">
                      <div className="font-medium">اتصل بالدعم الفني</div>
                      <div className="text-sm text-muted-foreground">متاح 24/7</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <MessageCircle className="w-5 h-5 ml-3" />
                    <div className="text-right">
                      <div className="font-medium">دردشة مباشرة</div>
                      <div className="text-sm text-muted-foreground">رد فوري</div>
                    </div>
                  </Button>
                </div>
                
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  أو راسلنا على: support@rentalcompany.com
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};