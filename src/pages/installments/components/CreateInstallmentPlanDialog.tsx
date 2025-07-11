import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { installmentService } from "@/services/installmentService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateInstallmentPlanDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: "",
    supplier_name: "",
    total_amount: "",
    down_payment: "",
    number_of_installments: "",
    installment_frequency: "monthly",
    first_installment_date: "",
    notes: "",
  });

  // Function to download CSV template
  const downloadTemplate = () => {
    const headers = [
      'اسم الخطة',
      'اسم المورد', 
      'المبلغ الإجمالي',
      'الدفعة المقدمة',
      'عدد الأقساط',
      'دورية الأقساط',
      'تاريخ أول قسط',
      'ملاحظات'
    ];
    
    const sampleData = [
      'خطة أقساط العقد الأول',
      'مورد الأسطول',
      '10000.000',
      '2000.000', 
      '12',
      'monthly',
      '2024-01-01',
      'خطة أقساط تجريبية'
    ];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'قالب_خطط_الأقساط.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to parse CSV file
  const parseCsvFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            reject(new Error('ملف CSV يجب أن يحتوي على بيانات'));
            return;
          }
          
          const headers = lines[0].split(',');
          const data = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              plan_name: values[0]?.trim() || '',
              supplier_name: values[1]?.trim() || '',
              total_amount: parseFloat(values[2]?.trim() || '0'),
              down_payment: parseFloat(values[3]?.trim() || '0'),
              number_of_installments: parseInt(values[4]?.trim() || '1'),
              installment_frequency: values[5]?.trim() || 'monthly',
              first_installment_date: values[6]?.trim() || '',
              notes: values[7]?.trim() || ''
            };
          });
          
          resolve(data);
        } catch (error) {
          reject(new Error('خطأ في قراءة ملف CSV'));
        }
      };
      reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Function to handle CSV import
  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف CSV",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    try {
      const csvData = await parseCsvFile(csvFile);
      let successCount = 0;
      let errorCount = 0;

      for (const data of csvData) {
        try {
          // Calculate last installment date
          const firstDate = new Date(data.first_installment_date);
          const lastDate = new Date(firstDate);
          
          if (data.installment_frequency === 'monthly') {
            lastDate.setMonth(lastDate.getMonth() + data.number_of_installments - 1);
          } else if (data.installment_frequency === 'quarterly') {
            lastDate.setMonth(lastDate.getMonth() + (data.number_of_installments * 3) - 3);
          } else if (data.installment_frequency === 'annually') {
            lastDate.setFullYear(lastDate.getFullYear() + data.number_of_installments - 1);
          }

          const planData = {
            ...data,
            remaining_amount: data.total_amount - data.down_payment,
            last_installment_date: lastDate.toISOString().split('T')[0],
            tenant_id: "00000000-0000-0000-0000-000000000000", // This should be dynamic
          };

          await installmentService.createInstallmentPlan(planData);
          successCount++;
        } catch (error) {
          console.error('Error creating plan:', error);
          errorCount++;
        }
      }

      toast({
        title: "اكتمل الاستيراد",
        description: `تم استيراد ${successCount} خطة بنجاح، فشل في ${errorCount} خطة`,
      });

      if (successCount > 0) {
        onSuccess();
        onOpenChange(false);
        setCsvFile(null);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ أثناء استيراد ملف CSV",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate last installment date
      const firstDate = new Date(formData.first_installment_date);
      const lastDate = new Date(firstDate);
      
      const installments = parseInt(formData.number_of_installments);
      if (formData.installment_frequency === 'monthly') {
        lastDate.setMonth(lastDate.getMonth() + installments - 1);
      } else if (formData.installment_frequency === 'quarterly') {
        lastDate.setMonth(lastDate.getMonth() + (installments * 3) - 3);
      } else if (formData.installment_frequency === 'annually') {
        lastDate.setFullYear(lastDate.getFullYear() + installments - 1);
      }

      const planData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        down_payment: parseFloat(formData.down_payment || "0"),
        remaining_amount: parseFloat(formData.total_amount) - parseFloat(formData.down_payment || "0"),
        number_of_installments: parseInt(formData.number_of_installments),
        last_installment_date: lastDate.toISOString().split('T')[0],
        tenant_id: "00000000-0000-0000-0000-000000000000", // This should be dynamic
      };

      await installmentService.createInstallmentPlan(planData);
      
      toast({
        title: "تم إنشاء الخطة بنجاح",
        description: "تم إنشاء خطة الأقساط الجديدة",
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        plan_name: "",
        supplier_name: "",
        total_amount: "",
        down_payment: "",
        number_of_installments: "",
        installment_frequency: "monthly",
        first_installment_date: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الخطة",
        description: "حدث خطأ أثناء إنشاء خطة الأقساط",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">إنشاء خطة أقساط جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل خطة الأقساط الجديدة أو استورد من ملف CSV
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2" dir="rtl">
            <TabsTrigger value="manual" className="rtl-flex">
              <FileText className="h-4 w-4" />
              إدخال يدوي
            </TabsTrigger>
            <TabsTrigger value="import" className="rtl-flex">
              <Upload className="h-4 w-4" />
              استيراد CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plan_name" className="rtl-label">اسم الخطة</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier_name" className="rtl-label">اسم المورد</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_amount" className="rtl-label">المبلغ الإجمالي (د.ك)</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.001"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="down_payment" className="rtl-label">الدفعة المقدمة (د.ك)</Label>
                  <Input
                    id="down_payment"
                    type="number"
                    step="0.001"
                    value={formData.down_payment}
                    onChange={(e) => setFormData(prev => ({ ...prev, down_payment: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="number_of_installments" className="rtl-label">عدد الأقساط</Label>
                  <Input
                    id="number_of_installments"
                    type="number"
                    value={formData.number_of_installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, number_of_installments: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installment_frequency" className="rtl-label">دورية الأقساط</Label>
                  <Select
                    value={formData.installment_frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, installment_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                      <SelectItem value="annually">سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_installment_date" className="rtl-label">تاريخ أول قسط</Label>
                <Input
                  id="first_installment_date"
                  type="date"
                  value={formData.first_installment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_installment_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "جار الإنشاء..." : "إنشاء الخطة"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title">استيراد خطط أقساط من ملف CSV</CardTitle>
                <CardDescription>
                  قم بتحميل قالب CSV وملئه بالبيانات ثم استورده
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download Template Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="rtl-flex"
                  >
                    <Download className="h-4 w-4" />
                    تحميل القالب
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="csv-file" className="rtl-label">اختر ملف CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  {csvFile && (
                    <p className="text-sm text-muted-foreground">
                      تم اختيار: {csvFile.name}
                    </p>
                  )}
                </div>

                {/* CSV Format Instructions */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">تعليمات تنسيق ملف CSV:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• يجب أن يحتوي الملف على 8 أعمدة بالترتيب التالي:</li>
                    <li>• اسم الخطة، اسم المورد، المبلغ الإجمالي، الدفعة المقدمة</li>
                    <li>• عدد الأقساط، دورية الأقساط (monthly/quarterly/annually)</li>
                    <li>• تاريخ أول قسط (YYYY-MM-DD)، ملاحظات</li>
                    <li>• تأكد من حفظ الملف بترميز UTF-8</li>
                  </ul>
                </div>

                {/* Import Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleCsvImport}
                    disabled={!csvFile || importLoading}
                    className="rtl-flex"
                  >
                    <Upload className="h-4 w-4" />
                    {importLoading ? "جار الاستيراد..." : "استيراد البيانات"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}