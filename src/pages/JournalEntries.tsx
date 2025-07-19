import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Zap, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  Settings,
  Link,
  Target
} from 'lucide-react';
import { JournalEntriesWrapper } from '@/components/Accounting/JournalEntriesWrapper';
import { ReportsContainer } from '@/components/Accounting/Reports/ReportsContainer';
import { AutomatedJournalEntries } from '@/components/Accounting/AutomatedJournalEntries';
import { CostCenterBudgetAlerts } from '@/components/Accounting/CostCenterBudgetAlerts';
import { accountingService } from '@/services/accountingService';
import { JournalEntry } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

// Dashboard Overview Component
const JournalEntriesDashboard = () => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    draftEntries: 0,
    postedEntries: 0,
    automatedEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    balanceIssues: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const entries = await accountingService.getJournalEntries();
      
      const draftEntries = entries.filter(e => e.status === 'draft').length;
      const postedEntries = entries.filter(e => e.status === 'posted').length;
      const automatedEntries = entries.filter(e => e.reference_type !== 'manual').length;
      const totalDebit = entries.reduce((sum, e) => sum + e.total_debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.total_credit, 0);
      const balanceIssues = entries.filter(e => Math.abs(e.total_debit - e.total_credit) > 0.01).length;

      setStats({
        totalEntries: entries.length,
        draftEntries,
        postedEntries,
        automatedEntries,
        totalDebit,
        totalCredit,
        balanceIssues
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل إحصائيات لوحة المعلومات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي القيود</p>
              <p className="text-2xl font-bold text-primary">{stats.totalEntries}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيود مرحلة</p>
              <p className="text-2xl font-bold text-green-600">{stats.postedEntries}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيود تلقائية</p>
              <p className="text-2xl font-bold text-blue-600">{stats.automatedEntries}</p>
            </div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مسودات</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draftEntries}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المدين</p>
              <p className="text-xl font-bold text-green-600">{stats.totalDebit.toFixed(3)} د.ك</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalCredit.toFixed(3)} د.ك</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">فرق الأرصدة</p>
              <p className="text-xl font-bold text-purple-600">
                {Math.abs(stats.totalDebit - stats.totalCredit).toFixed(3)} د.ك
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيود غير متوازنة</p>
              <p className="text-2xl font-bold text-red-600">{stats.balanceIssues}</p>
              {stats.balanceIssues === 0 && (
                <Badge variant="default" className="mt-1">متوازن</Badge>
              )}
            </div>
            <Target className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Cost Center Management Component  
const CostCenterManagement = () => {
  const { toast } = useToast();

  const handleDistributionReport = () => {
    toast({
      title: 'تقرير التوزيع',
      description: 'جاري تحضير تقرير توزيع القيود المحاسبية على مراكز التكلفة...',
      variant: 'default',
    });
    
    // TODO: إضافة منطق تحضير التقرير هنا
    console.log('🔄 بدء تحضير تقرير التوزيع...');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Users className="w-5 h-5" />
            إدارة مراكز التكلفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            عرض وإدارة توزيع القيود المحاسبية على مراكز التكلفة المختلفة
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDistributionReport}>
              <BarChart3 className="w-4 h-4" />
              تقرير التوزيع
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <CostCenterBudgetAlerts showOnlyUnread={false} maxAlerts={20} />
    </div>
  );
};

// Source Links Component
const SourceLinks = () => {
  const [linkedEntries, setLinkedEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinkedEntries();
  }, []);

  const loadLinkedEntries = async () => {
    try {
      const entries = await accountingService.getJournalEntries();
      const linked = entries.filter(e => e.reference_type && e.reference_type !== 'manual');
      setLinkedEntries(linked);
    } catch (error) {
      console.error('Error loading linked entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (referenceType: string) => {
    const labels = {
      invoice: 'فاتورة',
      contract: 'عقد',
      payment: 'دفعة',
      expense_voucher: 'سند مصروف'
    };
    return labels[referenceType as keyof typeof labels] || referenceType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <Link className="w-5 h-5" />
          القيود المرتبطة بمصادر
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : (
          <div className="space-y-3">
            {linkedEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{entry.entry_number}</p>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getSourceLabel(entry.reference_type || '')}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {linkedEntries.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                لا توجد قيود مرتبطة بمصادر
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Reports Component
const JournalReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          التقارير والتحليلات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
            <Calendar className="w-6 h-6" />
            <span>تقرير شهري</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            <span>تحليل الأرصدة</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>تقرير الأداء</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            <span>تقرير المراجعة</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const JournalEntries = () => {
  const [activeTab, setActiveTab] = useState('manual');

  const refreshData = () => {
    // Trigger refresh for current tab
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between" style={{ direction: 'ltr' }}>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          تحديث البيانات
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة القيود المحاسبية</h1>
          <p className="text-muted-foreground">
            مركز شامل لإدارة جميع القيود المحاسبية اليدوية والتلقائية
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="sources">المصادر المرتبطة</TabsTrigger>
          <TabsTrigger value="cost-centers">مراكز التكلفة</TabsTrigger>
          <TabsTrigger value="automated">القيود التلقائية</TabsTrigger>
          <TabsTrigger value="manual">القيود اليدوية</TabsTrigger>
        </TabsList>


        <TabsContent value="manual" className="space-y-4">
          <JournalEntriesWrapper />
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <AutomatedJournalEntries />
        </TabsContent>

        <TabsContent value="cost-centers" className="space-y-4">
          <CostCenterManagement />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <SourceLinks />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsContainer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JournalEntries;