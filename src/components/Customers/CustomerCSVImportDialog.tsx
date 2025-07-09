import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Users,
  Building,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  convertCSVToCustomerData, 
  generateSampleCustomerCSV,
  type CustomerImportData,
  type CustomerCSVImportResult 
} from '@/lib/customerCSVImport';

interface CustomerCSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CustomerCSVImportDialog: React.FC<CustomerCSVImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<CustomerCSVImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "خطأ في نوع الملف",
        description: "يرجى اختيار ملف CSV فقط",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const result = convertCSVToCustomerData(csvContent);
      setCsvData(result);
      
      if (result.success) {
        setStep('preview');
        toast({
          title: "تم تحليل الملف بنجاح",
          description: `تم العثور على ${result.data?.length} عميل صالح للاستيراد`,
        });
      } else {
        toast({
          title: "خطأ في تحليل الملف",
          description: "يرجى مراجعة تنسيق الملف والمحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCustomerCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_customers.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({
      title: "تم تحميل الملف النموذجي",
      description: "يمكنك الآن تعديل الملف وإضافة بيانات العملاء",
    });
  };

  const importCustomers = async () => {
    if (!csvData?.data) return;

    setStep('importing');
    setImportProgress(0);
    
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    const totalCustomers = csvData.data.length;
    
    for (let i = 0; i < csvData.data.length; i++) {
      const customerData = csvData.data[i];
      
      try {
        // Generate customer number
        let customerNumber: string;
        
        const { data: generatedNumber, error: numberError } = await supabase
          .rpc('generate_customer_number');

        if (numberError || !generatedNumber) {
          // Fallback method
          const timestamp = Date.now().toString().slice(-6);
          customerNumber = `CUS${timestamp}${i.toString().padStart(3, '0')}`;
        } else {
          customerNumber = generatedNumber;
        }

        // Insert customer
        const { error } = await supabase
          .from('customers')
          .insert([{
            ...customerData,
            customer_number: customerNumber,
            created_by: user?.id,
            tenant_id: null as any // Will be set by trigger
          }]);

        if (error) {
          console.error(`خطأ في استيراد العميل ${customerData.name}:`, error);
          results.failed++;
          
          if (error.code === '23505') {
            results.errors.push(`العميل "${customerData.name}": رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً`);
          } else {
            results.errors.push(`العميل "${customerData.name}": ${error.message}`);
          }
        } else {
          results.successful++;
        }
      } catch (error) {
        console.error(`خطأ غير متوقع في استيراد العميل ${customerData.name}:`, error);
        results.failed++;
        results.errors.push(`العميل "${customerData.name}": خطأ غير متوقع`);
      }
      
      setImportProgress(Math.round(((i + 1) / totalCustomers) * 100));
    }

    setImportResults(results);
    setStep('complete');
  };

  const handleClose = () => {
    setStep('upload');
    setCsvData(null);
    setImportProgress(0);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
    
    if (importResults?.successful && importResults.successful > 0) {
      onSuccess();
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Upload className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">استيراد عملاء من ملف CSV</h3>
          <p className="text-sm text-muted-foreground mt-1">
            قم بتحميل ملف CSV يحتوي على بيانات العملاء
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">اختيار ملف CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="mt-1"
          />
        </div>
        
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={downloadSampleCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل ملف نموذجي
          </Button>
        </div>
      </div>

      <Alert>
        <FileText className="w-4 h-4" />
        <AlertDescription className="text-right">
          <strong>تنسيق الملف المطلوب:</strong>
          <br />
          • يجب أن يحتوي الملف على العمود customer_type, name, phone كحد أدنى
          <br />
          • نوع العميل: فرد أو شركة (individual أو company)
          <br />
          • يجب أن يكون رقم الهاتف صالحاً (كويتي)
          <br />
          • للشركات، يفضل إضافة الشخص المسؤول
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">معاينة البيانات</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {csvData?.data?.length} عميل
        </div>
      </div>

      {csvData?.warnings && csvData.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>تحذيرات:</strong>
            <ul className="list-disc list-inside mt-1">
              {csvData.warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {csvData?.errors && csvData.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>أخطاء في البيانات:</strong>
            <ScrollArea className="h-32 mt-2">
              <ul className="list-disc list-inside space-y-1">
                {csvData.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-64 border rounded-md p-4">
        <div className="space-y-3">
          {csvData?.data?.map((customer, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {customer.customer_type === 'company' ? (
                    <Building className="w-4 h-4 text-blue-500" />
                  ) : (
                    <User className="w-4 h-4 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {customer.customer_type === 'company' ? 'شركة' : 'فرد'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setStep('upload')}>
          العودة
        </Button>
        <Button 
          onClick={importCustomers}
          disabled={!csvData?.data || csvData.data.length === 0}
          className="btn-primary"
        >
          استيراد العملاء
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      
      <div>
        <h3 className="text-lg font-medium">جاري استيراد العملاء...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          يرجى عدم إغلاق النافذة أثناء عملية الاستيراد
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={importProgress} className="w-full" />
        <p className="text-sm text-muted-foreground">{importProgress}% مكتمل</p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-medium">تم الاستيراد بنجاح!</h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium text-green-600">{importResults?.successful}</span> عميل تم استيرادهم بنجاح
          </p>
          {importResults?.failed && importResults.failed > 0 && (
            <p className="text-sm">
              <span className="font-medium text-red-600">{importResults.failed}</span> عميل فشل في استيرادهم
            </p>
          )}
        </div>
      </div>

      {importResults?.errors && importResults.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>الأخطاء:</strong>
            <ScrollArea className="h-32 mt-2">
              <ul className="list-disc list-inside space-y-1">
                {importResults.errors.map((error, index) => (
                  <li key={index} className="text-sm text-right">{error}</li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleClose} className="btn-primary">
        إغلاق
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>استيراد العملاء من CSV</DialogTitle>
          <DialogDescription>
            استيراد بيانات العملاء بكميات كبيرة من ملف CSV
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerCSVImportDialog;