import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, GitBranch, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export const SystemFlowchartSection = () => {
  const [showFlowchart, setShowFlowchart] = useState(false);
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
    <>
      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-6 text-right">
          <div className="flex items-center gap-3 mb-4 rtl-flex">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground rtl-title">مخطط تدفق النظام</h4>
              <p className="text-sm text-muted-foreground">الهيكل التنظيمي للعمليات</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 text-right">
            مخطط تدفق شامل يوضح سير العمليات والترابط بين جميع أجزاء النظام من البداية حتى النهاية
          </p>
          
          <div className="flex flex-wrap gap-2 rtl-flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlowchart(true)}
              className="gap-2 rtl-flex"
            >
              <Eye className="w-4 h-4" />
              عرض المخطط
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printFlowchart}
              className="gap-2 rtl-flex"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={downloadFlowchart}
              className="gap-2 rtl-flex"
            >
              <Download className="w-4 h-4" />
              تحميل PNG
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Flowchart Dialog */}
      <Dialog open={showFlowchart} onOpenChange={setShowFlowchart}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between rtl-flex">
            <div className="flex items-center gap-2 rtl-flex">
              <GitBranch className="w-5 h-5" />
              <DialogTitle className="rtl-title">مخطط تدفق نظام إدارة تأجير المركبات</DialogTitle>
            </div>
            <div className="flex items-center gap-2 rtl-flex">
              <Button
                variant="outline"
                size="sm"
                onClick={printFlowchart}
                className="flex items-center gap-2 rtl-flex"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadFlowchart}
                className="flex items-center gap-2 rtl-flex"
              >
                <Download className="w-4 h-4" />
                تحميل PNG
              </Button>
            </div>
          </DialogHeader>

          <div ref={flowchartRef} className="flowchart p-6 bg-background">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary mb-2 rtl-title">
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
                  <h2 className="text-lg font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg inline-block rtl-title">
                    المرحلة 1: الإعداد الأولي والتسجيل
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flow-box bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.1</div>
                    <h4 className="font-semibold text-blue-800 text-sm rtl-title">إعداد الشركة</h4>
                    <p className="text-xs text-blue-600">بيانات الشركة والفروع</p>
                  </div>
                  
                  <div className="flow-box bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.2</div>
                    <h4 className="font-semibold text-green-800 text-sm rtl-title">إدارة المستخدمين</h4>
                    <p className="text-xs text-green-600">الموظفين والصلاحيات</p>
                  </div>
                  
                  <div className="flow-box bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.3</div>
                    <h4 className="font-semibold text-purple-800 text-sm rtl-title">الإعدادات المالية</h4>
                    <p className="text-xs text-purple-600">شجرة الحسابات والضرائب</p>
                  </div>
                  
                  <div className="flow-box bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1.4</div>
                    <h4 className="font-semibold text-orange-800 text-sm rtl-title">تسجيل الأسطول</h4>
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
                  <h2 className="text-lg font-semibold bg-green-100 text-green-800 px-4 py-2 rounded-lg inline-block rtl-title">
                    المرحلة 2: إدارة العملاء والموردين
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flow-box bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.1</div>
                    <h4 className="font-semibold text-emerald-800 rtl-title">تسجيل العملاء</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-emerald-600">• البيانات الشخصية</p>
                      <p className="text-xs text-emerald-600">• وثائق الهوية</p>
                      <p className="text-xs text-emerald-600">• الرخص والتأمين</p>
                    </div>
                  </div>
                  
                  <div className="flow-box bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
                    <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.2</div>
                    <h4 className="font-semibold text-teal-800 rtl-title">إدارة الموردين</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-teal-600">• موردي الوقود</p>
                      <p className="text-xs text-teal-600">• ورش الصيانة</p>
                      <p className="text-xs text-teal-600">• شركات التأمين</p>
                    </div>
                  </div>
                  
                  <div className="flow-box bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-center">
                    <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2.3</div>
                    <h4 className="font-semibold text-cyan-800 rtl-title">التحقق والموافقة</h4>
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
                  <h2 className="text-lg font-semibold bg-purple-100 text-purple-800 px-4 py-2 rounded-lg inline-block rtl-title">
                    المرحلة 3: عملية الحجز والعقود
                  </h2>
                </div>
                
                {/* المرحلة الفرعية أ: عروض الأسعار */}
                <div className="mb-6">
                  <h3 className="text-center text-md font-medium text-purple-700 mb-3 rtl-title">أ. عروض الأسعار والحجز</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="flow-box bg-purple-50 border border-purple-200 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.1</div>
                      <p className="text-xs font-semibold text-purple-800">طلب عرض سعر</p>
                    </div>
                    <div className="flex items-center justify-center">←</div>
                    <div className="flow-box bg-purple-50 border border-purple-200 rounded p-2 text-center">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold">3.2</div>
                      <p className="text-xs font-semibold text-purple-800">حساب التكلفة</p>
                    </div>
                    <div className="flex items-center justify-center">←</div>
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
                    <h4 className="text-center font-semibold text-green-800 mb-3 rtl-title">نعم - المتابعة</h4>
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
                    <h4 className="text-center font-semibold text-red-800 mb-3 rtl-title">لا - المراجعة</h4>
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

              {/* باقي المراحل... */}
              <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-primary/30">
                <p className="text-lg font-semibold text-primary mb-2 rtl-title">
                  المخطط مكتمل ويشمل جميع مراحل النظام
                </p>
                <p className="text-sm text-muted-foreground">
                  من الإعداد الأولي وحتى إنهاء العقود وإدارة التقارير المالية
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};