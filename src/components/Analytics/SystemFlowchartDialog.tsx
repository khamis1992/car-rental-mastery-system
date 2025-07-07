import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface SystemFlowchartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemFlowchartDialog: React.FC<SystemFlowchartDialogProps> = ({
  open,
  onOpenChange
}) => {
  const flowchartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const downloadFlowchart = async () => {
    if (!flowchartRef.current) return;

    try {
      const canvas = await html2canvas(flowchartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `مخطط_تدفق_النظام_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "تم بنجاح",
        description: "تم تحميل المخطط التدفقي بنجاح",
      });
    } catch (error) {
      console.error('Error downloading flowchart:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المخطط التدفقي",
        variant: "destructive",
      });
    }
  };

  const printFlowchart = () => {
    if (!flowchartRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>مخطط تدفق نظام إدارة تأجير المركبات</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              direction: rtl;
            }
            .flowchart { 
              width: 100%; 
              height: auto; 
            }
            @media print {
              body { margin: 0; }
              .flowchart { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${flowchartRef.current.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            <DialogTitle>مخطط تدفق نظام إدارة تأجير المركبات</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={printFlowchart}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={downloadFlowchart}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PNG
            </Button>
          </div>
        </DialogHeader>

        <div ref={flowchartRef} className="flowchart p-6 bg-background">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">
              مخطط تدفق نظام إدارة تأجير المركبات
            </h1>
            <p className="text-muted-foreground">
              نظرة شاملة على سير العمليات في النظام
            </p>
          </div>

          {/* Flowchart Content */}
          <div className="space-y-6">

            {/* مرحلة البداية */}
            <div className="text-center">
              <div className="flow-box bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full p-4 inline-block">
                <div className="text-xl font-bold mb-2">🚀 نظام إدارة تأجير المركبات المتكامل</div>
                <div className="text-sm">تدفق البيانات والترابط بين الأنظمة</div>
              </div>
            </div>

            {/* مركز البيانات المركزي */}
            <div className="relative">
              <div className="text-center">
                <div className="flow-box bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6 inline-block">
                  <div className="text-lg font-bold mb-2">🗄️ مركز البيانات المركزي</div>
                  <div className="text-sm">قاعدة البيانات الموحدة - التكامل الكامل بين جميع الأنظمة</div>
                </div>
              </div>
              
              {/* خطوط الاتصال من وإلى مركز البيانات */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-50 -z-10"></div>
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-purple-400 to-indigo-400 opacity-50 -z-10"></div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 1: الإعداد الأولي والتسجيل */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 1: الإعداد الأولي والتسجيل
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flow-box bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.1</div>
                  <h4 className="font-semibold text-blue-800 text-sm">إعداد الشركة</h4>
                  <p className="text-xs text-blue-600">بيانات الشركة والفروع</p>
                </div>
                
                <div className="flow-box bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.2</div>
                  <h4 className="font-semibold text-green-800 text-sm">إدارة المستخدمين</h4>
                  <p className="text-xs text-green-600">الموظفين والصلاحيات</p>
                </div>
                
                <div className="flow-box bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.3</div>
                  <h4 className="font-semibold text-purple-800 text-sm">الإعدادات المالية</h4>
                  <p className="text-xs text-purple-600">شجرة الحسابات والضرائب</p>
                </div>
                
                <div className="flow-box bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.4</div>
                  <h4 className="font-semibold text-orange-800 text-sm">تسجيل الأسطول</h4>
                  <p className="text-xs text-orange-600">المركبات والمواصفات</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 2: إدارة العملاء والموردين */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-green-100 text-green-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 2: إدارة العملاء والموردين
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flow-box bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.1</div>
                  <h4 className="font-semibold text-emerald-800">تسجيل العملاء</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-emerald-600">• البيانات الشخصية</p>
                    <p className="text-xs text-emerald-600">• وثائق الهوية</p>
                    <p className="text-xs text-emerald-600">• الرخص والتأمين</p>
                  </div>
                </div>
                
                <div className="flow-box bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.2</div>
                  <h4 className="font-semibold text-teal-800">إدارة الموردين</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-teal-600">• موردي الوقود</p>
                    <p className="text-xs text-teal-600">• ورش الصيانة</p>
                    <p className="text-xs text-teal-600">• شركات التأمين</p>
                  </div>
                </div>
                
                <div className="flow-box bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.3</div>
                  <h4 className="font-semibold text-cyan-800">التحقق والموافقة</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-cyan-600">• التحقق من البيانات</p>
                    <p className="text-xs text-cyan-600">• تقييم الائتمان</p>
                    <p className="text-xs text-cyan-600">• الموافقة النهائية</p>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 3: عملية الحجز والعقود */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-purple-100 text-purple-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 3: عملية الحجز والعقود
                </h2>
              </div>
              
              {/* المرحلة الفرعية أ: عروض الأسعار */}
              <div className="mb-6">
                <h3 className="text-center text-md font-medium text-purple-700 mb-3">أ. عروض الأسعار والحجز</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div className="flow-box bg-purple-50 border border-purple-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.1</div>
                    <p className="text-xs font-semibold text-purple-800">طلب عرض سعر</p>
                  </div>
                  <div className="flex items-center justify-center">→</div>
                  <div className="flow-box bg-purple-50 border border-purple-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.2</div>
                    <p className="text-xs font-semibold text-purple-800">حساب التكلفة</p>
                  </div>
                  <div className="flex items-center justify-center">→</div>
                  <div className="flow-box bg-purple-50 border border-purple-200 rounded p-2 text-center">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.3</div>
                    <p className="text-xs font-semibold text-purple-800">إرسال العرض</p>
                  </div>
                </div>
              </div>

              {/* نقطة قرار */}
              <div className="text-center mb-4">
                <div className="flow-box bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 inline-block">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">?</div>
                  <p className="text-sm font-semibold text-yellow-800">هل تم قبول العرض؟</p>
                </div>
              </div>

              {/* مسارات متعددة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المسار الإيجابي */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="text-center font-semibold text-green-800 mb-3">نعم - المتابعة</h4>
                  <div className="space-y-3">
                    <div className="flow-box bg-green-100 border border-green-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.4</div>
                      <p className="text-xs font-semibold text-green-800">إنشاء العقد</p>
                    </div>
                    <div className="flow-box bg-green-100 border border-green-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.5</div>
                      <p className="text-xs font-semibold text-green-800">التوقيع الإلكتروني</p>
                    </div>
                    <div className="flow-box bg-green-100 border border-green-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.6</div>
                      <p className="text-xs font-semibold text-green-800">تأكيد الحجز</p>
                    </div>
                  </div>
                </div>

                {/* المسار السلبي */}
                <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="text-center font-semibold text-red-800 mb-3">لا - المراجعة</h4>
                  <div className="space-y-3">
                    <div className="flow-box bg-red-100 border border-red-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.7</div>
                      <p className="text-xs font-semibold text-red-800">تعديل العرض</p>
                    </div>
                    <div className="flow-box bg-red-100 border border-red-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.8</div>
                      <p className="text-xs font-semibold text-red-800">إعادة التفاوض</p>
                    </div>
                    <div className="flow-box bg-red-100 border border-red-300 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.9</div>
                      <p className="text-xs font-semibold text-red-800">إلغاء أو تأجيل</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 4: تسليم المركبة */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-orange-100 text-orange-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 4: تسليم المركبة
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flow-box bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4.1</div>
                  <h4 className="font-semibold text-orange-800 text-sm text-center">فحص المركبة</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-orange-600">• فحص الحالة الخارجية</p>
                    <p className="text-xs text-orange-600">• فحص الحالة الداخلية</p>
                    <p className="text-xs text-orange-600">• فحص الميكانيكية</p>
                    <p className="text-xs text-orange-600">• قراءة العداد</p>
                  </div>
                </div>
                
                <div className="flow-box bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4.2</div>
                  <h4 className="font-semibold text-amber-800 text-sm text-center">التوثيق</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-amber-600">• التصوير الفوتوغرافي</p>
                    <p className="text-xs text-amber-600">• تسجيل الملاحظات</p>
                    <p className="text-xs text-amber-600">• التوقيع على المحضر</p>
                  </div>
                </div>
                
                <div className="flow-box bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4.3</div>
                  <h4 className="font-semibold text-yellow-800 text-sm text-center">الإجراءات المالية</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-yellow-600">• دفع العربون</p>
                    <p className="text-xs text-yellow-600">• استلام الضمانات</p>
                    <p className="text-xs text-yellow-600">• تسوية المدفوعات</p>
                  </div>
                </div>
                
                <div className="flow-box bg-lime-50 border border-lime-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-lime-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4.4</div>
                  <h4 className="font-semibold text-lime-800 text-sm text-center">التسليم النهائي</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-lime-600">• تسليم المفاتيح</p>
                    <p className="text-xs text-lime-600">• شرح استخدام المركبة</p>
                    <p className="text-xs text-lime-600">• تحديث حالة العقد</p>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 5: المتابعة أثناء التأجير */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 5: المتابعة أثناء التأجير
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="flow-box bg-indigo-50 border border-indigo-200 rounded p-3 text-center">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">5.1</div>
                  <h4 className="font-semibold text-indigo-800 text-sm">مراقبة العقود</h4>
                  <p className="text-xs text-indigo-600 mt-1">تتبع تواريخ الانتهاء</p>
                </div>
                
                <div className="flow-box bg-blue-50 border border-blue-200 rounded p-3 text-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">5.2</div>
                  <h4 className="font-semibold text-blue-800 text-sm">الصيانة الدورية</h4>
                  <p className="text-xs text-blue-600 mt-1">جدولة وتنفيذ الصيانة</p>
                </div>
                
                <div className="flow-box bg-red-50 border border-red-200 rounded p-3 text-center">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">5.3</div>
                  <h4 className="font-semibold text-red-800 text-sm">المخالفات المرورية</h4>
                  <p className="text-xs text-red-600 mt-1">تسجيل ومتابعة المخالفات</p>
                </div>
                
                <div className="flow-box bg-pink-50 border border-pink-200 rounded p-3 text-center">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">5.4</div>
                  <h4 className="font-semibold text-pink-800 text-sm">طلبات التمديد</h4>
                  <p className="text-xs text-pink-600 mt-1">تجديد أو تمديد العقود</p>
                </div>
                
                <div className="flow-box bg-violet-50 border border-violet-200 rounded p-3 text-center">
                  <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">5.5</div>
                  <h4 className="font-semibold text-violet-800 text-sm">خدمة العملاء</h4>
                  <p className="text-xs text-violet-600 mt-1">الدعم والاستفسارات</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 6: استلام المركبة */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-teal-100 text-teal-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 6: استلام المركبة والتسوية النهائية
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flow-box bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">6.1</div>
                  <h4 className="font-semibold text-teal-800 text-sm text-center">فحص الاستلام</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-teal-600">• فحص الأضرار</p>
                    <p className="text-xs text-teal-600">• مقارنة بحالة التسليم</p>
                    <p className="text-xs text-teal-600">• قراءة العداد النهائية</p>
                    <p className="text-xs text-teal-600">• فحص مستوى الوقود</p>
                  </div>
                </div>
                
                <div className="flow-box bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">6.2</div>
                  <h4 className="font-semibold text-cyan-800 text-sm text-center">التسوية المالية</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-cyan-600">• حساب التكاليف الإضافية</p>
                    <p className="text-xs text-cyan-600">• خصم التلفيات</p>
                    <p className="text-xs text-cyan-600">• رد العربون</p>
                    <p className="text-xs text-cyan-600">• إصدار الفاتورة النهائية</p>
                  </div>
                </div>
                
                <div className="flow-box bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">6.3</div>
                  <h4 className="font-semibold text-emerald-800 text-sm text-center">التوثيق والأرشفة</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-emerald-600">• توثيق حالة الاستلام</p>
                    <p className="text-xs text-emerald-600">• أرشفة مستندات العقد</p>
                    <p className="text-xs text-emerald-600">• تحديث سجل المركبة</p>
                  </div>
                </div>
                
                <div className="flow-box bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">6.4</div>
                  <h4 className="font-semibold text-green-800 text-sm text-center">إغلاق العقد</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-green-600">• تحديث حالة العقد</p>
                    <p className="text-xs text-green-600">• إعادة المركبة للأسطول</p>
                    <p className="text-xs text-green-600">• تقييم تجربة العميل</p>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 7: العمليات المالية والمحاسبية */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 7: العمليات المالية والمحاسبية
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <h4 className="text-center font-semibold text-emerald-800 mb-3">الفوترة والمدفوعات</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-emerald-100 border border-emerald-300 rounded p-2">
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.1</div>
                      <p className="text-xs font-semibold text-emerald-800 text-center">إنشاء الفواتير</p>
                    </div>
                    <div className="flow-box bg-emerald-100 border border-emerald-300 rounded p-2">
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.2</div>
                      <p className="text-xs font-semibold text-emerald-800 text-center">تتبع المدفوعات</p>
                    </div>
                    <div className="flow-box bg-emerald-100 border border-emerald-300 rounded p-2">
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.3</div>
                      <p className="text-xs font-semibold text-emerald-800 text-center">إدارة المتأخرات</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="text-center font-semibold text-blue-800 mb-3">القيود المحاسبية</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.4</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">قيود الإيرادات</p>
                    </div>
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.5</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">قيود المصروفات</p>
                    </div>
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.6</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">قيود الإهلاك</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h4 className="text-center font-semibold text-purple-800 mb-3">التقارير المالية</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.7</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">الميزانية العمومية</p>
                    </div>
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.8</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">قائمة الدخل</p>
                    </div>
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">7.9</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">التدفقات النقدية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 8: إدارة الموارد البشرية */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-rose-100 text-rose-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 8: إدارة الموارد البشرية
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flow-box bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">8.1</div>
                  <h4 className="font-semibold text-rose-800 text-sm text-center">إدارة الموظفين</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-rose-600">• تسجيل الموظفين</p>
                    <p className="text-xs text-rose-600">• إدارة الأقسام</p>
                    <p className="text-xs text-rose-600">• تحديد المسؤوليات</p>
                  </div>
                </div>
                
                <div className="flow-box bg-pink-50 border border-pink-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">8.2</div>
                  <h4 className="font-semibold text-pink-800 text-sm text-center">نظام الحضور</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-pink-600">• تسجيل الحضور</p>
                    <p className="text-xs text-pink-600">• متابعة الغياب</p>
                    <p className="text-xs text-pink-600">• حساب الساعات الإضافية</p>
                  </div>
                </div>
                
                <div className="flow-box bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">8.3</div>
                  <h4 className="font-semibold text-red-800 text-sm text-center">إدارة الإجازات</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-600">• طلبات الإجازة</p>
                    <p className="text-xs text-red-600">• الموافقات</p>
                    <p className="text-xs text-red-600">• متابعة الأرصدة</p>
                  </div>
                </div>
                
                <div className="flow-box bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">8.4</div>
                  <h4 className="font-semibold text-orange-800 text-sm text-center">كشوف الرواتب</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-orange-600">• حساب الرواتب</p>
                    <p className="text-xs text-orange-600">• الخصومات والبدلات</p>
                    <p className="text-xs text-orange-600">• إصدار كشوف الراتب</p>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة 9: التحليلات والتقارير */}
            <div className="flow-section">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg inline-block">
                  المرحلة 9: التحليلات والتقارير
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                  <h4 className="text-center font-semibold text-indigo-800 mb-3">التقارير التشغيلية</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-indigo-100 border border-indigo-300 rounded p-2">
                      <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.1</div>
                      <p className="text-xs font-semibold text-indigo-800 text-center">تقارير الأسطول</p>
                    </div>
                    <div className="flow-box bg-indigo-100 border border-indigo-300 rounded p-2">
                      <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.2</div>
                      <p className="text-xs font-semibold text-indigo-800 text-center">تقارير العقود</p>
                    </div>
                    <div className="flow-box bg-indigo-100 border border-indigo-300 rounded p-2">
                      <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.3</div>
                      <p className="text-xs font-semibold text-indigo-800 text-center">تقارير الصيانة</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="text-center font-semibold text-blue-800 mb-3">التحليلات المالية</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.4</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">تحليل الربحية</p>
                    </div>
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.5</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">تحليل التكاليف</p>
                    </div>
                    <div className="flow-box bg-blue-100 border border-blue-300 rounded p-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.6</div>
                      <p className="text-xs font-semibold text-blue-800 text-center">التدفقات النقدية</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h4 className="text-center font-semibold text-purple-800 mb-3">مؤشرات الأداء</h4>
                  <div className="space-y-2">
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.7</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">معدل الاستخدام</p>
                    </div>
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.8</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">رضا العملاء</p>
                    </div>
                    <div className="flow-box bg-purple-100 border border-purple-300 rounded p-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">9.9</div>
                      <p className="text-xs font-semibold text-purple-800 text-center">الأداء التشغيلي</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-400"></div>
            </div>

            {/* المرحلة النهائية */}
            <div className="text-center">
              <div className="flow-box bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full p-4 inline-block">
                <div className="text-xl font-bold">🎯 اتخاذ القرارات الاستراتيجية</div>
                <p className="text-sm mt-2">بناء على التحليلات والتقارير المتقدمة</p>
              </div>
            </div>

            {/* العمليات المتوازية */}
            <div className="mt-8 border-t pt-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold bg-gray-100 text-gray-800 px-4 py-2 rounded-lg inline-block">
                  العمليات المتوازية والداعمة
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 text-center mb-3">الإشعارات والتنبيهات</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-yellow-600">• تنبيهات انتهاء العقود</p>
                    <p className="text-xs text-yellow-600">• تذكيرات الصيانة</p>
                    <p className="text-xs text-yellow-600">• إشعارات المدفوعات</p>
                  </div>
                </div>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 text-center mb-3">الأمان والنسخ الاحتياطي</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-green-600">• نسخ احتياطي تلقائي</p>
                    <p className="text-xs text-green-600">• أمان البيانات</p>
                    <p className="text-xs text-green-600">• صلاحيات المستخدمين</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 text-center mb-3">التكامل مع الأنظمة الخارجية</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600">• البنوك الإلكترونية</p>
                    <p className="text-xs text-blue-600">• أنظمة المرور</p>
                    <p className="text-xs text-blue-600">• شركات التأمين</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 text-center mb-3">الصيانة والتطوير</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-purple-600">• تحديثات النظام</p>
                    <p className="text-xs text-purple-600">• إضافة ميزات جديدة</p>
                    <p className="text-xs text-purple-600">• تحسين الأداء</p>
                  </div>
                </div>
              </div>
            </div>

            {/* مخطط الترابط والتكامل بين الأنظمة */}
            <div className="mt-12 border-t-4 border-gradient-to-r from-blue-500 to-purple-500 pt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text px-4 py-3 inline-block">
                  🔗 مخطط الترابط والتكامل بين الأنظمة
                </h2>
                <p className="text-muted-foreground mt-2">كيف تتفاعل وترتبط جميع أجزاء النظام مع بعضها البعض</p>
              </div>

              {/* مخطط الشبكة المترابطة */}
              <div className="relative">
                {/* الشبكة المركزية */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  
                  {/* النظام المالي والمحاسبي - العمود الأيسر */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-emerald-700 mb-4">💰 النظام المالي والمحاسبي</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-emerald-800 text-sm">شجرة الحسابات</h4>
                        <p className="text-xs text-emerald-600 mt-1">مركز جميع العمليات المالية</p>
                        {/* خطوط الاتصال */}
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-emerald-400"></div>
                      </div>
                      
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-emerald-800 text-sm">القيود المحاسبية</h4>
                        <p className="text-xs text-emerald-600 mt-1">تسجيل تلقائي من العقود والمدفوعات</p>
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-emerald-400"></div>
                      </div>
                      
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-emerald-800 text-sm">الفواتير والمدفوعات</h4>
                        <p className="text-xs text-emerald-600 mt-1">ربط مباشر بالعقود والعملاء</p>
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-emerald-400"></div>
                      </div>

                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-emerald-800 text-sm">التقارير المالية</h4>
                        <p className="text-xs text-emerald-600 mt-1">تجميع البيانات من جميع الأنظمة</p>
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-emerald-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* النظام الأساسي - العمود الوسط */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-purple-700 mb-4">🎯 النظام الأساسي</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-purple-50 border-4 border-purple-300 rounded-lg p-4 relative">
                        <h4 className="font-semibold text-purple-800">العقود والحجوزات</h4>
                        <p className="text-xs text-purple-600 mt-1">مركز النظام - يؤثر على جميع الوحدات</p>
                        
                        {/* خطوط الاتصال متعددة الاتجاهات */}
                        <div className="absolute -left-4 top-1/4 w-8 h-0.5 bg-purple-400"></div>
                        <div className="absolute -right-4 top-1/4 w-8 h-0.5 bg-purple-400"></div>
                        <div className="absolute left-1/2 -top-4 w-0.5 h-8 bg-purple-400"></div>
                        <div className="absolute left-1/2 -bottom-4 w-0.5 h-8 bg-purple-400"></div>
                      </div>
                      
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-orange-800 text-sm">إدارة الأسطول</h4>
                        <p className="text-xs text-orange-600 mt-1">حالة المركبات - تحديث مستمر</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-orange-400"></div>
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-orange-400"></div>
                      </div>
                      
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-blue-800 text-sm">إدارة العملاء</h4>
                        <p className="text-xs text-blue-600 mt-1">بيانات مشتركة مع جميع الوحدات</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-blue-400"></div>
                        <div className="absolute -right-4 top-1/2 w-8 h-0.5 bg-blue-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* الأنظمة التشغيلية - العمود الأيمن */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-indigo-700 mb-4">⚙️ الأنظمة التشغيلية</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-indigo-800 text-sm">الصيانة</h4>
                        <p className="text-xs text-indigo-600 mt-1">ترتبط بالأسطول والمحاسبة</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-indigo-400"></div>
                      </div>
                      
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-red-800 text-sm">المخالفات المرورية</h4>
                        <p className="text-xs text-red-600 mt-1">ترتبط بالعقود والعملاء والمحاسبة</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-red-400"></div>
                      </div>
                      
                      <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-pink-800 text-sm">الموارد البشرية</h4>
                        <p className="text-xs text-pink-600 mt-1">الحضور والرواتب → المحاسبة</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-pink-400"></div>
                      </div>

                      <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3 relative">
                        <h4 className="font-semibold text-teal-800 text-sm">التحليلات والتقارير</h4>
                        <p className="text-xs text-teal-600 mt-1">تجميع البيانات من جميع الأنظمة</p>
                        <div className="absolute -left-4 top-1/2 w-8 h-0.5 bg-teal-400"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* تدفق البيانات الرئيسي */}
                <div className="mt-12 mb-8">
                  <h3 className="text-xl font-bold text-center text-gray-700 mb-6">🔄 تدفق البيانات الرئيسي</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-blue-800 text-sm">إنشاء العقد</h4>
                      <p className="text-xs text-blue-600 mt-1">نقطة البداية</p>
                    </div>
                    
                    <div className="flex justify-center items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-0.5 bg-gray-400"></div>
                        <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-orange-800 text-sm">تحديث حالة المركبة</h4>
                      <p className="text-xs text-orange-600 mt-1">تلقائي</p>
                    </div>
                    
                    <div className="flex justify-center items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-0.5 bg-gray-400"></div>
                        <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 border-2 border-emerald-300 rounded-lg p-3 text-center">
                      <h4 className="font-semibold text-emerald-800 text-sm">إنشاء القيود المحاسبية</h4>
                      <p className="text-xs text-emerald-600 mt-1">تلقائي</p>
                    </div>
                  </div>
                </div>

                {/* نقاط التكامل الحيوية */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-center text-gray-700 mb-6">⚡ نقاط التكامل الحيوية</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg">🔄</span>
                        </div>
                        <h4 className="font-semibold text-purple-800">المزامنة التلقائية</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="text-purple-600">• العقد → حالة المركبة</p>
                        <p className="text-purple-600">• الدفع → القيود المحاسبية</p>
                        <p className="text-purple-600">• المخالفة → حساب العميل</p>
                        <p className="text-purple-600">• الصيانة → سجل المركبة</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg">📊</span>
                        </div>
                        <h4 className="font-semibold text-green-800">التقارير المدمجة</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="text-green-600">• بيانات من جميع الوحدات</p>
                        <p className="text-green-600">• تحديث فوري</p>
                        <p className="text-green-600">• تحليل شامل</p>
                        <p className="text-green-600">• مؤشرات أداء موحدة</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg">🔔</span>
                        </div>
                        <h4 className="font-semibold text-orange-800">التنبيهات الذكية</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="text-orange-600">• انتهاء العقود</p>
                        <p className="text-orange-600">• مواعيد الصيانة</p>
                        <p className="text-orange-600">• المدفوعات المتأخرة</p>
                        <p className="text-orange-600">• حالات الطوارئ</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg">🔐</span>
                        </div>
                        <h4 className="font-semibold text-blue-800">أمان البيانات</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="text-blue-600">• تشفير شامل</p>
                        <p className="text-blue-600">• صلاحيات متدرجة</p>
                        <p className="text-blue-600">• تسجيل العمليات</p>
                        <p className="text-blue-600">• نسخ احتياطي تلقائي</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* مثال عملي للترابط */}
                <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-center text-gray-700 mb-6">📋 مثال عملي: رحلة العقد عبر النظام</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800">إنشاء العقد</h4>
                        <p className="text-sm text-blue-600">العميل يحجز مركبة → النظام ينشئ عقد جديد</p>
                      </div>
                      <div className="text-blue-500">→</div>
                      <div className="bg-blue-100 rounded-lg p-2 text-xs text-blue-700">تحديث: حالة المركبة، دليل العملاء</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">تسليم المركبة</h4>
                        <p className="text-sm text-green-600">الموظف يسلم المركبة → النظام يسجل بيانات التسليم</p>
                      </div>
                      <div className="text-green-500">→</div>
                      <div className="bg-green-100 rounded-lg p-2 text-xs text-green-700">قيد محاسبي تلقائي، تحديث حالة الأسطول</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-800">الدفع</h4>
                        <p className="text-sm text-purple-600">العميل يدفع → النظام يسجل الدفعة</p>
                      </div>
                      <div className="text-purple-500">→</div>
                      <div className="bg-purple-100 rounded-lg p-2 text-xs text-purple-700">قيود الدفع، تحديث حساب العميل، الفواتير</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-800">أثناء التأجير</h4>
                        <p className="text-sm text-orange-600">صيانة أو مخالفة → النظام يربط بالعقد</p>
                      </div>
                      <div className="text-orange-500">→</div>
                      <div className="bg-orange-100 rounded-lg p-2 text-xs text-orange-700">مصروفات إضافية، تحديث تكلفة العقد</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800">استلام المركبة</h4>
                        <p className="text-sm text-red-600">انتهاء العقد → النظام يحسب التسوية النهائية</p>
                      </div>
                      <div className="text-red-500">→</div>
                      <div className="bg-red-100 rounded-lg p-2 text-xs text-red-700">إغلاق القيود، تحرير المركبة، تقييم العميل</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-muted-foreground">
            <p>نظام إدارة تأجير المركبات - مخطط تدفق العمليات الشامل</p>
            <p className="mt-1">تم إنشاؤه في: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};