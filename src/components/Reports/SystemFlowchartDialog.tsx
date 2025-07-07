import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer } from 'lucide-react';
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
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const downloadAsImage = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = 'system-flowchart.png';
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل المخطط بنجاح",
      });
    } catch (error) {
      console.error('Error downloading chart:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل المخطط",
        variant: "destructive",
      });
    }
  };

  const printChart = () => {
    if (!chartRef.current) return;
    
    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>مخطط النظام</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${chartRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              مخطط تدفق نظام إدارة تأجير المركبات
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={printChart}
              >
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadAsImage}
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل كصورة
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={chartRef} className="p-6 bg-white">
          <div className="flowchart-container" style={{ 
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '800px',
            padding: '40px',
            borderRadius: '12px'
          }}>
            
            {/* Title */}
            <h1 style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '40px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              مخطط تدفق نظام إدارة تأجير المركبات
            </h1>

            {/* Main Process Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
              
              {/* Customer Registration */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #4CAF50'
              }}>
                <h3 style={{ color: '#2E7D32', marginBottom: '10px', fontSize: '18px' }}>📋 تسجيل العميل</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>إدخال بيانات العميل والتحقق من الهوية</p>
              </div>

              {/* Arrow Down */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>

              {/* Quotation Creation */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #2196F3'
              }}>
                <h3 style={{ color: '#1976D2', marginBottom: '10px', fontSize: '18px' }}>💰 إنشاء عرض السعر</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>تحديد المركبة والفترة وحساب التكلفة</p>
              </div>

              {/* Arrow Down */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>

              {/* Contract Creation */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #FF9800'
              }}>
                <h3 style={{ color: '#F57C00', marginBottom: '10px', fontSize: '18px' }}>📄 إنشاء العقد</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>توقيع العقد وتحديد الشروط والأحكام</p>
              </div>

              {/* Parallel Processes */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>
              
              <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                
                {/* Vehicle Inspection */}
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  minWidth: '280px',
                  border: '2px solid #9C27B0'
                }}>
                  <h3 style={{ color: '#7B1FA2', marginBottom: '10px', fontSize: '18px' }}>🔍 فحص المركبة</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>توثيق حالة المركبة والأضرار الموجودة</p>
                </div>

                {/* Payment Processing */}
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  minWidth: '280px',
                  border: '2px solid #E91E63'
                }}>
                  <h3 style={{ color: '#C2185B', marginBottom: '10px', fontSize: '18px' }}>💳 معالجة الدفع</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>استلام الدفعة المقدمة وإصدار الفاتورة</p>
                </div>

              </div>

              {/* Arrow Down */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>

              {/* Vehicle Delivery */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #4CAF50'
              }}>
                <h3 style={{ color: '#2E7D32', marginBottom: '10px', fontSize: '18px' }}>🚗 تسليم المركبة</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>تسليم المركبة للعميل مع المفاتيح والوثائق</p>
              </div>

              {/* During Rental Period */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>
              
              <div style={{
                background: 'linear-gradient(45deg, rgba(255,193,7,0.1), rgba(255,87,34,0.1))',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #FF5722'
              }}>
                <h3 style={{ color: '#D84315', marginBottom: '10px', fontSize: '18px' }}>⏰ فترة التأجير</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>متابعة العقد ومعالجة المخالفات والصيانة</p>
              </div>

              {/* Arrow Down */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>

              {/* Vehicle Return */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #795548'
              }}>
                <h3 style={{ color: '#5D4037', marginBottom: '10px', fontSize: '18px' }}>🔄 استلام المركبة</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>فحص المركبة عند الإرجاع وتقييم الأضرار</p>
              </div>

              {/* Final Settlement */}
              <div style={{ fontSize: '24px', color: 'white' }}>⬇️</div>
              
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: '300px',
                border: '2px solid #607D8B'
              }}>
                <h3 style={{ color: '#455A64', marginBottom: '10px', fontSize: '18px' }}>💰 التسوية النهائية</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>حساب المبلغ النهائي وإرجاع الضمان</p>
              </div>

            </div>

            {/* Side Processes */}
            <div style={{ 
              marginTop: '50px',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              
              {/* Maintenance */}
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                minWidth: '200px',
                border: '1px solid #FFC107'
              }}>
                <h4 style={{ color: '#FF8F00', marginBottom: '8px' }}>🔧 إدارة الصيانة</h4>
                <p style={{ color: '#666', fontSize: '12px' }}>متابعة صيانة الأسطول</p>
              </div>

              {/* Accounting */}
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                minWidth: '200px',
                border: '1px solid #8BC34A'
              }}>
                <h4 style={{ color: '#689F38', marginBottom: '8px' }}>📊 المحاسبة</h4>
                <p style={{ color: '#666', fontSize: '12px' }}>تسجيل العمليات المالية</p>
              </div>

              {/* Reports */}
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                minWidth: '200px',
                border: '1px solid #00BCD4'
              }}>
                <h4 style={{ color: '#0097A7', marginBottom: '8px' }}>📈 التقارير</h4>
                <p style={{ color: '#666', fontSize: '12px' }}>تحليل الأداء والإحصائيات</p>
              </div>

            </div>

            {/* Footer */}
            <div style={{
              marginTop: '40px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px'
            }}>
              نظام إدارة تأجير المركبات - مخطط تدفق العمليات الرئيسية
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};