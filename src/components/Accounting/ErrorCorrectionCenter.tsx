
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Search,
  BarChart3,
  Settings,
  Eye,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { advancedAutomationService, ErrorCorrectionTool, CorrectionLog } from '@/services/AdvancedAutomationService';

export const ErrorCorrectionCenter: React.FC = () => {
  const [tools, setTools] = useState<ErrorCorrectionTool[]>([]);
  const [corrections, setCorrections] = useState<CorrectionLog[]>([]);
  const [duplicates, setDuplicates] = useState([]);
  const [unbalanced, setUnbalanced] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCorrectionData();
  }, []);

  const loadCorrectionData = async () => {
    setLoading(true);
    try {
      const [toolsData, correctionsData, duplicatesData, unbalancedData] = await Promise.all([
        advancedAutomationService.getErrorCorrectionTools(),
        advancedAutomationService.getCorrectionLog(),
        advancedAutomationService.detectDuplicateEntries(),
        advancedAutomationService.detectUnbalancedEntries()
      ]);

      setTools(toolsData);
      setCorrections(correctionsData);
      setDuplicates(duplicatesData);
      setUnbalanced(unbalancedData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات التصحيح:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async (toolType: string) => {
    setLoading(true);
    try {
      switch (toolType) {
        case 'duplicate_detector':
          const duplicatesData = await advancedAutomationService.detectDuplicateEntries();
          setDuplicates(duplicatesData);
          
          if (duplicatesData.length > 0) {
            await advancedAutomationService.createCorrectionLog({
              tool_id: tools.find(t => t.tool_type === 'duplicate_detector')?.id || '',
              detection_date: new Date().toISOString(),
              error_type: 'duplicate_entries',
              error_description: `تم اكتشاف ${duplicatesData.length} مجموعة من القيود المكررة`,
              affected_entries: duplicatesData.flatMap(d => d.entry_ids || []),
              severity_level: 'medium',
              status: 'detected',
              auto_fix_applied: false,
              manual_fix_required: true
            });
          }
          break;

        case 'balance_validator':
          const unbalancedData = await advancedAutomationService.detectUnbalancedEntries();
          setUnbalanced(unbalancedData);
          
          if (unbalancedData.length > 0) {
            await advancedAutomationService.createCorrectionLog({
              tool_id: tools.find(t => t.tool_type === 'balance_validator')?.id || '',
              detection_date: new Date().toISOString(),
              error_type: 'unbalanced_entries',
              error_description: `تم اكتشاف ${unbalancedData.length} قيد غير متوازن`,
              affected_entries: unbalancedData.map(u => u.entry_id),
              severity_level: 'high',
              status: 'detected',
              auto_fix_applied: false,
              manual_fix_required: true
            });
          }
          break;
      }

      await loadCorrectionData();
      toast.success('تم تشغيل أداة الكشف بنجاح');
    } catch (error) {
      console.error('خطأ في تشغيل أداة الكشف:', error);
      toast.error('حدث خطأ في تشغيل أداة الكشف');
    } finally {
      setLoading(false);
    }
  };

  const updateCorrectionStatus = async (id: string, status: CorrectionLog['status'], notes?: string) => {
    try {
      await advancedAutomationService.updateCorrectionStatus(id, status, notes);
      await loadCorrectionData();
      toast.success('تم تحديث حالة التصحيح');
    } catch (error) {
      console.error('خطأ في تحديث حالة التصحيح:', error);
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'bg-red-100 text-red-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'detected':
        return 'مكتشف';
      case 'reviewing':
        return 'قيد المراجعة';
      case 'fixed':
        return 'تم الإصلاح';
      case 'ignored':
        return 'متجاهل';
      default:
        return status;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'حرج';
      case 'high':
        return 'عالي';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'منخفض';
      default:
        return severity;
    }
  };

  // إحصائيات سريعة
  const criticalIssues = corrections.filter(c => c.severity_level === 'critical' && c.status === 'detected').length;
  const pendingReviews = corrections.filter(c => c.status === 'reviewing').length;
  const fixedIssues = corrections.filter(c => c.status === 'fixed').length;
  const activeTools = tools.filter(t => t.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مركز التصحيح والمراقبة</h2>
          <p className="text-muted-foreground">اكتشاف وإصلاح الأخطاء المحاسبية تلقائياً</p>
        </div>
        <Button variant="outline" onClick={loadCorrectionData} disabled={loading} className="rtl-flex">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">مشاكل حرجة</p>
                <p className="text-2xl font-bold text-red-600">{criticalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">تم الإصلاح</p>
                <p className="text-2xl font-bold text-green-600">{fixedIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">أدوات نشطة</p>
                <p className="text-2xl font-bold text-blue-600">{activeTools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="duplicates">القيود المكررة</TabsTrigger>
          <TabsTrigger value="unbalanced">غير المتوازنة</TabsTrigger>
          <TabsTrigger value="tools">الأدوات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل التصحيحات الحديثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {corrections.slice(0, 10).map((correction) => (
                  <div key={correction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle 
                        className={`w-5 h-5 ${
                          correction.severity_level === 'critical' ? 'text-red-600' :
                          correction.severity_level === 'high' ? 'text-orange-600' :
                          correction.severity_level === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} 
                      />
                      <div>
                        <h4 className="font-medium">{correction.error_description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(correction.detection_date).toLocaleDateString('ar-SA')}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getSeverityColor(correction.severity_level)}>
                            {getSeverityLabel(correction.severity_level)}
                          </Badge>
                          <Badge className={getStatusColor(correction.status)}>
                            {getStatusLabel(correction.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {correction.status === 'detected' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCorrectionStatus(correction.id, 'reviewing')}
                          >
                            مراجعة
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCorrectionStatus(correction.id, 'fixed')}
                          >
                            إصلاح
                          </Button>
                        </>
                      )}
                      {correction.status === 'reviewing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCorrectionStatus(correction.id, 'fixed')}
                        >
                          تأكيد الإصلاح
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">القيود المكررة المكتشفة</h3>
            <Button 
              onClick={() => runDetection('duplicate_detector')} 
              disabled={loading}
              className="rtl-flex"
            >
              <Search className="w-4 h-4" />
              فحص جديد
            </Button>
          </div>

          {duplicates.length > 0 ? (
            <div className="space-y-4">
              {duplicates.map((duplicate, index) => (
                <Alert key={index} className="border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>قيود مكررة ({duplicate.duplicate_count})</strong>
                        <p className="text-sm mt-1">{duplicate.description}</p>
                        <p className="text-sm text-muted-foreground">
                          المبلغ: {duplicate.total_amount} د.ك | التاريخ: {duplicate.entry_date}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        يتطلب إصلاح
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد قيود مكررة</h3>
                <p className="text-muted-foreground">جميع القيود المحاسبية فريدة</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unbalanced" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">القيود غير المتوازنة</h3>
            <Button 
              onClick={() => runDetection('balance_validator')} 
              disabled={loading}
              className="rtl-flex"
            >
              <Search className="w-4 h-4" />
              فحص جديد
            </Button>
          </div>

          {unbalanced.length > 0 ? (
            <div className="space-y-4">
              {unbalanced.map((entry, index) => (
                <Alert key={index} className="border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>قيد غير متوازن - {entry.entry_number}</strong>
                        <p className="text-sm mt-1">التاريخ: {entry.entry_date}</p>
                        <p className="text-sm text-muted-foreground">
                          المدين: {entry.total_debit} د.ك | الدائن: {entry.total_credit} د.ك | 
                          الفرق: {entry.difference} د.ك
                        </p>
                      </div>
                      <Badge variant="destructive">
                        حرج
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">جميع القيود متوازنة</h3>
                <p className="text-muted-foreground">لا توجد قيود تحتاج لإصلاح</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-flex">
                <Wrench className="w-5 h-5" />
                أدوات التصحيح المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{tool.tool_name}</h4>
                      <Badge variant={tool.is_active ? 'default' : 'secondary'}>
                        {tool.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">الاكتشافات:</span>
                        <span className="font-medium ml-1">{tool.findings_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الإصلاحات:</span>
                        <span className="font-medium ml-1">{tool.fixes_applied}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runDetection(tool.tool_type)}
                        disabled={loading || !tool.is_active}
                        className="flex-1"
                      >
                        تشغيل
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
