import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X,
  Car
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  convertCSVToVehicleData, 
  generateSampleCSV,
  type CSVImportResult 
} from '@/lib/csvImport';
import { type VehicleFormData } from '@/components/Fleet/AddVehicleForm/types';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'خطأ في نوع الملف',
        description: 'يرجى اختيار ملف CSV فقط',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setCsvData(null);

    try {
      const content = await selectedFile.text();
      const result = convertCSVToVehicleData(content);
      setCsvData(result);
    } catch (error) {
      toast({
        title: 'خطأ في قراءة الملف',
        description: 'حدث خطأ أثناء قراءة ملف CSV',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_vehicles.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!csvData?.success || !csvData.data) {
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const vehicles = csvData.data;
      const totalVehicles = vehicles.length;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        
        try {
          // Generate vehicle number
          const { data: vehicleNumber } = await supabase.rpc('generate_vehicle_number');
          
          // Insert vehicle
          const { error } = await supabase
            .from('vehicles')
            .insert({
              vehicle_number: vehicleNumber,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              color: vehicle.color,
              vehicle_type: vehicle.vehicle_type,
              license_plate: vehicle.license_plate,
              daily_rate: vehicle.daily_rate,
              weekly_rate: vehicle.weekly_rate,
              monthly_rate: vehicle.monthly_rate,
              engine_size: vehicle.engine_size,
              fuel_type: vehicle.fuel_type,
              transmission: vehicle.transmission,
              mileage: vehicle.mileage,
              insurance_company: vehicle.insurance_company,
              insurance_policy_number: vehicle.insurance_policy_number,
              insurance_expiry: vehicle.insurance_expiry || null,
              registration_expiry: vehicle.registration_expiry || null,
              notes: vehicle.notes,
            });

          if (error) {
            console.error('Error inserting vehicle:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error processing vehicle:', error);
          errorCount++;
        }

        setImportProgress(((i + 1) / totalVehicles) * 100);
      }

      toast({
        title: 'تم استيراد البيانات',
        description: `تم استيراد ${successCount} مركبة بنجاح${errorCount > 0 ? `، فشل استيراد ${errorCount} مركبة` : ''}`,
      });

      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: 'خطأ في الاستيراد',
        description: 'حدث خطأ أثناء استيراد البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setCsvData(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-6 h-6 text-primary" />
            استيراد المركبات من ملف CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sample CSV Download */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">ملف CSV نموذجي</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تحميل النموذج
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              حمل ملف CSV نموذجي لفهم التنسيق المطلوب للبيانات
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">اسحب ملف CSV هنا أو انقر للاختيار</p>
              <p className="text-sm text-muted-foreground">
                الحد الأقصى لحجم الملف: 5 ميجابايت
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              اختر ملف
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="secondary">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDialog}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">جاري معالجة الملف...</p>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جاري الاستيراد...</span>
                <span>{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {csvData && !isProcessing && (
            <div className="space-y-4">
              <Separator />
              
              {csvData.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">تم تحليل الملف بنجاح</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {csvData.data?.length} مركبة جاهزة للاستيراد
                        </span>
                      </div>
                    </div>
                  </div>

                  {csvData.warnings && csvData.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {csvData.warnings.map((warning, index) => (
                            <div key={index}>{warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">فشل في تحليل الملف</span>
                  </div>
                  
                  {csvData.errors && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {csvData.errors.map((error, index) => (
                            <div key={index} className="text-sm">{error}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              إلغاء
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={!csvData?.success || isImporting || isProcessing}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'جاري الاستيراد...' : `استيراد ${csvData?.data?.length || 0} مركبة`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};