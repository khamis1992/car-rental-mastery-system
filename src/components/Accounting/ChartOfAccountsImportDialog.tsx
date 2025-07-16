import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ChartOfAccountsImportResult,
  ChartOfAccountsValidationError,
  generateSampleCSV 
} from '@/lib/chartOfAccountsCsvImport';
import { 
  chartOfAccountsImportService, 
  ImportProgress, 
  ImportSummary 
} from '@/services/chartOfAccountsImportService';

interface ChartOfAccountsImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ChartOfAccountsImportDialog: React.FC<ChartOfAccountsImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'summary'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ChartOfAccountsImportResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false
  });
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'خطأ في نوع الملف',
        description: 'يرجى اختيار ملف CSV فقط',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      validateFile(content);
    };
    reader.readAsText(selectedFile, 'utf-8');
  }, [toast]);

  const validateFile = async (content: string) => {
    try {
      const result = await chartOfAccountsImportService.validateAndPreviewImport(content);
      setValidationResult(result);
      setStep('preview');
    } catch (error) {
      toast({
        title: 'خطأ في معالجة الملف',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!validationResult?.data.length) return;

    setStep('importing');
    setImportProgress({
      stage: 'validating',
      processed: 0,
      total: validationResult.data.length,
      message: 'جاري البدء في عملية الاستيراد...',
      errors: []
    });

    try {
      const summary = await chartOfAccountsImportService.importChartOfAccounts(
        validationResult.data,
        importOptions,
        setImportProgress
      );
      
      setImportSummary(summary);
      setStep('summary');
      
      if (summary.successful > 0) {
        toast({
          title: 'تم الاستيراد بنجاح',
          description: `تم استيراد ${summary.successful} حساب بنجاح`,
        });
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاستيراد',
        description: String(error),
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart_of_accounts_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setCsvContent('');
    setValidationResult(null);
    setImportProgress(null);
    setImportSummary(null);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const getStageMessage = (stage: string) => {
    switch (stage) {
      case 'validating': return 'جاري التحقق من صحة البيانات...';
      case 'checking_duplicates': return 'جاري البحث عن التكرارات...';
      case 'importing': return 'جاري استيراد الحسابات...';
      case 'completed': return 'تم الانتهاء من الاستيراد';
      case 'error': return 'حدث خطأ أثناء الاستيراد';
      default: return 'معالجة...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="rtl-title">
          <DialogTitle className="text-2xl font-bold">استيراد دليل الحسابات من CSV</DialogTitle>
        </DialogHeader>

        {/* خطوة رفع الملف */}
        {step === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title">رفع ملف CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">اختر ملف CSV</h3>
                    <p className="text-gray-500">أو اسحب الملف وأفلته هنا</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer"
                  >
                    اختيار ملف
                  </label>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    يجب أن يحتوي ملف CSV على الأعمدة التالية: رمز الحساب، اسم الحساب، نوع الحساب، فئة الحساب
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={downloadTemplate} className="rtl-flex">
                    <Download className="w-4 h-4" />
                    تحميل نموذج CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* خطوة المعاينة والتحقق */}
        {step === 'preview' && validationResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResult.stats.validRows}
                    </div>
                    <div className="text-sm text-gray-600">حسابات صحيحة</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult.errors.length}
                    </div>
                    <div className="text-sm text-gray-600">أخطاء</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validationResult.warnings.length}
                    </div>
                    <div className="text-sm text-gray-600">تحذيرات</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  يوجد {validationResult.errors.length} خطأ في الملف. يجب إصلاح الأخطاء قبل الاستيراد.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">معاينة البيانات</TabsTrigger>
                {validationResult.errors.length > 0 && (
                  <TabsTrigger value="errors">الأخطاء</TabsTrigger>
                )}
                {validationResult.warnings.length > 0 && (
                  <TabsTrigger value="warnings">التحذيرات</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle className="rtl-title">معاينة الحسابات ({validationResult.data.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رمز الحساب</TableHead>
                            <TableHead>اسم الحساب</TableHead>
                            <TableHead>نوع الحساب</TableHead>
                            <TableHead>فئة الحساب</TableHead>
                            <TableHead>الحساب الأب</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.data.slice(0, 10).map((account, index) => (
                            <TableRow key={index}>
                              <TableCell>{account.account_code}</TableCell>
                              <TableCell>{account.account_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{account.account_type}</Badge>
                              </TableCell>
                              <TableCell>{account.account_category}</TableCell>
                              <TableCell>{account.parent_account_code || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {validationResult.data.length > 10 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          وعرض {validationResult.data.length - 10} حساب إضافي...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {validationResult.errors.length > 0 && (
                <TabsContent value="errors">
                  <Card>
                    <CardHeader>
                      <CardTitle className="rtl-title text-red-600">الأخطاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {validationResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription>
                              <strong>الصف {error.row}:</strong> {error.message}
                              {error.field !== 'unknown' && ` (${error.field})`}
                              {error.value && ` - القيمة: "${error.value}"`}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {validationResult.warnings.length > 0 && (
                <TabsContent value="warnings">
                  <Card>
                    <CardHeader>
                      <CardTitle className="rtl-title text-yellow-600">التحذيرات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {validationResult.warnings.map((warning, index) => (
                          <Alert key={index}>
                            <AlertDescription>{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* خيارات الاستيراد */}
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title">خيارات الاستيراد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rtl-flex">
                  <Checkbox
                    id="skipDuplicates"
                    checked={importOptions.skipDuplicates}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, skipDuplicates: !!checked }))
                    }
                  />
                  <Label htmlFor="skipDuplicates">تخطي الحسابات المكررة</Label>
                </div>
                
                <div className="rtl-flex">
                  <Checkbox
                    id="updateExisting"
                    checked={importOptions.updateExisting}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, updateExisting: !!checked }))
                    }
                  />
                  <Label htmlFor="updateExisting">تحديث الحسابات الموجودة</Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>
                رجوع
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validationResult.errors.length > 0 || validationResult.data.length === 0}
                className="btn-primary"
              >
                بدء الاستيراد ({validationResult.data.length} حساب)
              </Button>
            </div>
          </div>
        )}

        {/* خطوة الاستيراد */}
        {step === 'importing' && importProgress && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title">جاري الاستيراد...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getStageMessage(importProgress.stage)}</span>
                    <span>{importProgress.processed} / {importProgress.total}</span>
                  </div>
                  <Progress 
                    value={(importProgress.processed / importProgress.total) * 100} 
                    className="h-2"
                  />
                </div>
                
                <p className="text-sm text-gray-600">{importProgress.message}</p>
                
                {importProgress.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importProgress.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* خطوة الملخص */}
        {step === 'summary' && importSummary && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold">تم الانتهاء من الاستيراد</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importSummary.totalProcessed}
                  </div>
                  <div className="text-sm text-gray-600">معالج</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importSummary.successful}
                  </div>
                  <div className="text-sm text-gray-600">نجح</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importSummary.failed}
                  </div>
                  <div className="text-sm text-gray-600">فشل</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importSummary.duplicates}
                  </div>
                  <div className="text-sm text-gray-600">مكرر</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-sm text-gray-600">
              المدة: {(importSummary.duration / 1000).toFixed(2)} ثانية
            </div>

            {(importSummary.errors.length > 0 || importSummary.warnings.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="rtl-title">تفاصيل العملية</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={importSummary.errors.length > 0 ? "errors" : "warnings"}>
                    <TabsList>
                      {importSummary.errors.length > 0 && (
                        <TabsTrigger value="errors">الأخطاء ({importSummary.errors.length})</TabsTrigger>
                      )}
                      {importSummary.warnings.length > 0 && (
                        <TabsTrigger value="warnings">التحذيرات ({importSummary.warnings.length})</TabsTrigger>
                      )}
                    </TabsList>

                    {importSummary.errors.length > 0 && (
                      <TabsContent value="errors">
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importSummary.errors.map((error, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {importSummary.warnings.length > 0 && (
                      <TabsContent value="warnings">
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importSummary.warnings.map((warning, index) => (
                            <Alert key={index}>
                              <AlertDescription className="text-sm">{warning}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={handleClose} className="btn-primary">
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};