import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, RotateCcw, CheckCircle } from 'lucide-react';
import { ImportTransactionsTab } from './ImportTransactionsTab';
import { MatchTransactionsTab } from './MatchTransactionsTab';
import { ReconciliationReportsTab } from './ReconciliationReportsTab';
import { BankReconciliationService } from '@/services/bankReconciliationService';
import { useToast } from '@/hooks/use-toast';

const BankReconciliation = () => {
  const { toast } = useToast();
  const [statistics, setStatistics] = useState({
    total_imported: 0,
    total_matched: 0,
    total_unmatched: 0,
    matching_percentage: 0,
    total_variance: 0,
    last_reconciliation_date: null as string | null
  });
  const [loading, setLoading] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');

  const loadStatistics = async () => {
    if (!selectedBankAccount) return;
    
    try {
      setLoading(true);
      const stats = await BankReconciliationService.getReconciliationStatistics(selectedBankAccount);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إحصائيات المطابقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [selectedBankAccount]);

  const StatisticsCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div className="rtl-title">
          <h1 className="text-3xl font-bold text-foreground">المطابقة البنكية</h1>
          <p className="text-muted-foreground">مطابقة المعاملات البنكية مع القيود المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            className="rtl-flex"
            onClick={loadStatistics}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="إجمالي المعاملات المستوردة"
          value={statistics.total_imported.toLocaleString()}
          icon={Upload}
          color="text-primary"
        />
        <StatisticsCard
          title="المعاملات المطابقة"
          value={statistics.total_matched.toLocaleString()}
          icon={CheckCircle}
          color="text-success"
        />
        <StatisticsCard
          title="المعاملات غير المطابقة"
          value={statistics.total_unmatched.toLocaleString()}
          icon={Download}
          color="text-destructive"
        />
        <StatisticsCard
          title="نسبة المطابقة"
          value={`${statistics.matching_percentage.toFixed(1)}%`}
          icon={CheckCircle}
          color="text-success"
        />
      </div>

      {/* تبويبات المطابقة البنكية */}
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">استيراد المعاملات</TabsTrigger>
          <TabsTrigger value="match">مطابقة المعاملات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <ImportTransactionsTab 
            onImportComplete={loadStatistics}
            onBankAccountChange={setSelectedBankAccount}
          />
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          <MatchTransactionsTab 
            selectedBankAccount={selectedBankAccount}
            onMatchComplete={loadStatistics}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReconciliationReportsTab 
            selectedBankAccount={selectedBankAccount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankReconciliation;