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
          <div className="space-y-8">
            
            {/* المرحلة الأولى: التسجيل والإعداد */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الأولى: التسجيل والإعداد
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flow-box bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
                  <h3 className="font-semibold text-blue-800">تسجيل العملاء</h3>
                  <p className="text-sm text-blue-600 mt-1">إضافة بيانات العملاء الجدد</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                </div>
                
                <div className="flow-box bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
                  <h3 className="font-semibold text-green-800">إدارة الأسطول</h3>
                  <p className="text-sm text-green-600 mt-1">تسجيل المركبات وتفاصيلها</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
            </div>

            {/* المرحلة الثانية: عملية التأجير */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الثانية: عملية التأجير
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <div className="flow-box bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                  <h4 className="font-semibold text-purple-800 text-sm">عروض الأسعار</h4>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-6 h-0.5 bg-gray-400"></div>
                </div>
                
                <div className="flow-box bg-orange-50 border-2 border-orange-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                  <h4 className="font-semibold text-orange-800 text-sm">إنشاء العقد</h4>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-6 h-0.5 bg-gray-400"></div>
                </div>
                
                <div className="flow-box bg-teal-50 border-2 border-teal-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">5</div>
                  <h4 className="font-semibold text-teal-800 text-sm">تسليم المركبة</h4>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
            </div>

            {/* المرحلة الثالثة: المتابعة والإدارة */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الثالثة: المتابعة والإدارة
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="flow-box bg-pink-50 border-2 border-pink-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">6</div>
                  <h4 className="font-semibold text-pink-800 text-sm">متابعة العقود</h4>
                  <p className="text-xs text-pink-600 mt-1">العقود النشطة والمنتهية</p>
                </div>
                
                <div className="flow-box bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">7</div>
                  <h4 className="font-semibold text-indigo-800 text-sm">الصيانة</h4>
                  <p className="text-xs text-indigo-600 mt-1">جدولة وتتبع صيانة المركبات</p>
                </div>
                
                <div className="flow-box bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">8</div>
                  <h4 className="font-semibold text-amber-800 text-sm">المخالفات</h4>
                  <p className="text-xs text-amber-600 mt-1">تسجيل ومتابعة المخالفات</p>
                </div>
                
                <div className="flow-box bg-cyan-50 border-2 border-cyan-200 rounded-lg p-3 text-center">
                  <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">9</div>
                  <h4 className="font-semibold text-cyan-800 text-sm">استلام المركبة</h4>
                  <p className="text-xs text-cyan-600 mt-1">فحص وتوثيق حالة الإرجاع</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
            </div>

            {/* المرحلة الرابعة: الإدارة المالية */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الرابعة: الإدارة المالية
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flow-box bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">10</div>
                  <h3 className="font-semibold text-emerald-800">الفواتير والمدفوعات</h3>
                  <p className="text-sm text-emerald-600 mt-1">إنشاء الفواتير وتتبع المدفوعات</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                </div>
                
                <div className="flow-box bg-violet-50 border-2 border-violet-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-violet-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">11</div>
                  <h3 className="font-semibold text-violet-800">المحاسبة</h3>
                  <p className="text-sm text-violet-600 mt-1">التقارير المالية والمحاسبية</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
            </div>

            {/* المرحلة الخامسة: إدارة الموارد البشرية */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الخامسة: إدارة الموارد البشرية
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flow-box bg-rose-50 border-2 border-rose-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">12</div>
                  <h3 className="font-semibold text-rose-800">إدارة الموظفين</h3>
                  <p className="text-sm text-rose-600 mt-1">تسجيل بيانات الموظفين</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                </div>
                
                <div className="flow-box bg-lime-50 border-2 border-lime-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-lime-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">13</div>
                  <h3 className="font-semibold text-lime-800">الحضور والرواتب</h3>
                  <p className="text-sm text-lime-600 mt-1">تتبع الحضور وإعداد كشوف الرواتب</p>
                </div>
              </div>
            </div>

            {/* السهم للأسفل */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-400"></div>
            </div>

            {/* المرحلة الأخيرة: التحليلات والتقارير */}
            <div className="flow-section">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-foreground bg-secondary px-4 py-2 rounded-lg inline-block">
                  المرحلة الأخيرة: التحليلات والتقارير
                </h2>
              </div>
              
              <div className="flex justify-center">
                <div className="flow-box bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 text-center max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">📊</div>
                  <h3 className="font-semibold text-blue-800 text-lg">التحليلات والتقارير المتقدمة</h3>
                  <p className="text-sm text-blue-600 mt-2">
                    تحليل البيانات وإنتاج التقارير الشاملة لاتخاذ القرارات الاستراتيجية
                  </p>
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