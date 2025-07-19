import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { financialComparisonService } from '@/services/financialComparisonService';

interface ExportOption {
  format: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface EnhancedReportExportProps {
  reportType: string;
  reportData?: any;
  reportId?: string;
  onExportComplete?: (exportId: string) => void;
}

const EnhancedReportExport: React.FC<EnhancedReportExportProps> = ({
  reportType,
  reportData,
  reportId,
  onExportComplete
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const exportOptions: ExportOption[] = [
    {
      format: 'pdf',
      label: 'PDF',
      icon: <FileText className="w-4 h-4" />,
      description: 'تقرير PDF قابل للطباعة'
    },
    {
      format: 'excel',
      label: 'Excel',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      description: 'جدول بيانات Excel قابل للتحليل'
    },
    {
      format: 'csv',
      label: 'CSV',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      description: 'ملف CSV للبيانات الخام'
    },
    {
      format: 'png',
      label: 'صورة',
      icon: <FileImage className="w-4 h-4" />,
      description: 'صورة عالية الجودة للتقرير'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Log export attempt
      const exportId = await financialComparisonService.logExportHistory(
        reportType,
        selectedFormat,
        { 
          export_date: new Date().toISOString(),
          report_parameters: reportData || {}
        },
        reportId
      );

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would implement the actual export logic
      // For now, we'll just show success
      toast.success(`تم تصدير التقرير بصيغة ${selectedFormat.toUpperCase()} بنجاح`);
      
      if (onExportComplete) {
        onExportComplete(exportId);
      }

      // Refresh export history
      loadExportHistory();
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setIsExporting(false);
    }
  };

  const loadExportHistory = async () => {
    try {
      const history = await financialComparisonService.getExportHistoryByType(reportType);
      setExportHistory(history.slice(0, 5)); // Show last 5 exports
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  React.useEffect(() => {
    loadExportHistory();
  }, [reportType]);

  const getExportStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'غير محدد';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-title">
            <Download className="w-5 h-5" />
            تصدير التقرير المحسن
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exportOptions.map((option) => (
              <Card
                key={option.format}
                className={`cursor-pointer transition-all border-2 ${
                  selectedFormat === option.format 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFormat(option.format)}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {option.icon}
                    <h4 className="font-medium">{option.label}</h4>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Select defaultValue="standard">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">جودة قياسية</SelectItem>
                <SelectItem value="high">جودة عالية</SelectItem>
                <SelectItem value="print">جودة طباعة</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 rtl-flex"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'جاري التصدير...' : 'تصدير التقرير'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-title">
            <Clock className="w-5 h-5" />
            تاريخ التصدير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exportHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد تاريخ تصدير سابق
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((export_item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getExportStatusIcon('completed')}
                    <div>
                      <div className="font-medium">
                        تقرير {export_item.report_type} - {export_item.export_format.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(export_item.exported_at).toLocaleDateString('ar-KW')} - 
                        {formatFileSize(export_item.file_size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      مكتمل
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedReportExport;