
import React from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { ChartOfAccountsImportDialog } from '@/components/Accounting/ChartOfAccountsImportDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountStats } from '@/hooks/useAccountStats';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ChartOfAccounts = () => {
  const { stats, loading, error, refetch } = useAccountStats();
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "تم التحديث",
        description: "تم تحديث إحصائيات الحسابات بنجاح",
      });
    } catch (err) {
      console.error('خطأ في تحديث الإحصائيات:', err);
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث إحصائيات الحسابات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">دليل الحسابات</h1>
          <p className="text-muted-foreground">إدارة وتنظيم دليل الحسابات المحاسبي</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            className="rtl-flex"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <ChartOfAccountsImportDialog 
            isOpen={false} 
            onClose={() => {}} 
            onImportComplete={() => window.location.reload()} 
          />
        </div>
      </div>

      {/* عرض رسالة خطأ إذا وجدت */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            حدث خطأ في تحميل البيانات: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الأصول</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.assets || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الخصوم</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.liabilities || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.revenues || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.expenses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart of Accounts Table */}
      <ChartOfAccountsTab />
    </div>
  );
};

export default ChartOfAccounts;
