
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Settings,
  Play
} from 'lucide-react';
import { advancedAutomationService, ErrorCorrectionTool, CorrectionLog } from '@/services/AdvancedAutomationService';

export const ErrorCorrectionCenter: React.FC = () => {
  const [tools, setTools] = useState<ErrorCorrectionTool[]>([]);
  const [correctionLog, setCorrectionLog] = useState<CorrectionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCorrectionData();
  }, []);

  const loadCorrectionData = async () => {
    try {
      setLoading(true);
      const [toolsData, logData] = await Promise.all([
        advancedAutomationService.getErrorCorrectionTools(),
        advancedAutomationService.getCorrectionLog()
      ]);
      
      setTools(toolsData);
      setCorrectionLog(logData);
    } catch (error) {
      console.error('Error loading correction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async (toolId: string) => {
    try {
      if (toolId === '1') {
        await advancedAutomationService.detectDuplicateEntries();
      } else {
        await advancedAutomationService.detectUnbalancedEntries();
      }
      await loadCorrectionData();
    } catch (error) {
      console.error('Error running detection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* أدوات التصحيح المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-flex rtl-title">
            <Shield className="w-5 h-5" />
            أدوات التصحيح المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <Card key={tool.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{tool.tool_name}</h4>
                    <Badge variant={tool.is_active ? 'default' : 'secondary'}>
                      {tool.is_active ? 'نشط' : 'متوقف'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">اكتشافات:</span>
                      <span className="font-medium ml-2">{tool.findings_count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">إصلاحات:</span>
                      <span className="font-medium ml-2">{tool.fixes_applied}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runDetection(tool.id)}
                      disabled={!tool.is_active}
                      className="rtl-flex"
                    >
                      <Play className="w-4 h-4" />
                      تشغيل
                    </Button>
                    <Button variant="ghost" size="sm" className="rtl-flex">
                      <Settings className="w-4 h-4" />
                      إعدادات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* سجل التصحيحات */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-flex rtl-title">
            <Search className="w-5 h-5" />
            سجل التصحيحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {correctionLog.length > 0 ? (
              correctionLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      log.severity_level === 'high' ? 'bg-red-100 text-red-600' :
                      log.severity_level === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{log.error_description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.detection_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      log.status === 'fixed' ? 'default' :
                      log.status === 'reviewing' ? 'secondary' :
                      'outline'
                    }>
                      {log.status === 'fixed' ? 'تم الإصلاح' :
                       log.status === 'reviewing' ? 'قيد المراجعة' :
                       'مكتشف'}
                    </Badge>
                    {log.status === 'fixed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد تصحيحات</h3>
                <p className="text-muted-foreground">
                  لم يتم اكتشاف أي أخطاء تتطلب تصحيح
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
