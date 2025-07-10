import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useSadadTransactionLogs } from '@/hooks/useSadadData';

const SadadTransactionLogs: React.FC = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs, isLoading } = useSadadTransactionLogs(selectedPaymentId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-success text-success-foreground',
      error: 'bg-destructive text-destructive-foreground',
      warning: 'bg-warning text-warning-foreground',
      info: 'bg-primary text-primary-foreground'
    };

    const labels = {
      success: 'نجح',
      error: 'خطأ',
      warning: 'تحذير',
      info: 'معلومات'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getActionLabel = (action: string) => {
    const actions = {
      'create_payment': 'إنشاء دفعة',
      'check_status': 'فحص الحالة',
      'process_webhook': 'معالجة Webhook',
      'update_status': 'تحديث الحالة',
      'send_notification': 'إرسال إشعار',
      'validate_signature': 'التحقق من التوقيع'
    };

    return actions[action as keyof typeof actions] || action;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              سجل معاملات SADAD
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">معرف الدفعة</label>
              <Input
                placeholder="أدخل معرف الدفعة للبحث في السجلات"
                value={selectedPaymentId}
                onChange={(e) => setSelectedPaymentId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث في السجلات</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث في الإجراءات أو الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">جاري تحميل السجلات...</p>
              </div>
            </div>
          ) : selectedPaymentId && logs ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{getActionLabel(log.action)}</h4>
                          {getStatusBadge(log.status)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('ar')}
                          </span>
                        </div>
                        
                        {log.error_message && (
                          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive font-medium">رسالة الخطأ:</p>
                            <p className="text-sm text-destructive">{log.error_message}</p>
                          </div>
                        )}
                        
                        {log.request_data && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">بيانات الطلب:</p>
                            <div className="p-3 bg-muted rounded-md">
                              <pre className="text-xs font-mono overflow-x-auto">
                                {JSON.stringify(log.request_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {log.response_data && (
                          <div>
                            <p className="text-sm font-medium mb-1">بيانات الاستجابة:</p>
                            <div className="p-3 bg-muted rounded-md">
                              <pre className="text-xs font-mono overflow-x-auto">
                                {JSON.stringify(log.response_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">لا توجد سجلات</p>
                  <p className="text-muted-foreground">
                    لا توجد سجلات معاملات لهذه الدفعة
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">اختر دفعة لعرض السجلات</p>
              <p className="text-muted-foreground">
                أدخل معرف الدفعة في الحقل أعلاه لعرض سجل المعاملات
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي السجلات</p>
              <p className="text-2xl font-bold">{logs?.length || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">العمليات الناجحة</p>
              <p className="text-2xl font-bold text-success">
                {logs?.filter(log => log.status === 'success').length || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الأخطاء</p>
              <p className="text-2xl font-bold text-destructive">
                {logs?.filter(log => log.status === 'error').length || 0}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">التحذيرات</p>
              <p className="text-2xl font-bold text-warning">
                {logs?.filter(log => log.status === 'warning').length || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SadadTransactionLogs;