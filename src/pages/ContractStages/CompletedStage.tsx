import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  ArrowLeft, 
  BarChart3, 
  FileText, 
  Clock, 
  User,
  Star
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CompletedContractStats } from '@/components/Contracts/Completed/CompletedContractStats';
import { CompletedContractDetails } from '@/components/Contracts/Completed/CompletedContractDetails';
import { CompletedContractTimeline } from '@/components/Contracts/Completed/CompletedContractTimeline';
import { contractService } from '@/services/contractService';

const CompletedStage = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [contractStats, setContractStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadContractData();
    loadContractStats();
  }, [contractId]);

  const loadContractData = async () => {
    if (!contractId) return;
    
    try {
      setLoading(true);
      const data = await contractService.getContractById(contractId);
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContractStats = async () => {
    try {
      const stats = await contractService.getContractStats();
      // يمكن إضافة المزيد من الإحصائيات هنا
      setContractStats({
        totalRevenue: stats.monthlyRevenue,
        completedCount: stats.completed,
        averageRating: 4.5, // يمكن حسابها من قاعدة البيانات
        onTimeCompletionRate: 85 // يمكن حسابها من قاعدة البيانات
      });
    } catch (error) {
      console.error('Error loading contract stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground mb-4">
            لم يتم العثور على العقد
          </h2>
          <Button 
            variant="outline" 
            onClick={() => navigate('/contracts')}
            className="rtl-flex gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للعقود
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-right">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">عقد مكتمل</h1>
              <p className="text-muted-foreground">العقد رقم {contract.contract_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {contract.customers?.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              انتهى في {new Date(contract.actual_end_date || contract.end_date).toLocaleDateString('ar-KW')}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => navigate('/contracts')}
          className="rtl-flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للعقود
        </Button>
      </div>

      {/* Success Banner */}
      <Card className="card-elegant mb-8 border-success/20 bg-success/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success mb-1">تم إنهاء العقد بنجاح</h3>
              <p className="text-sm text-muted-foreground">
                تم استلام المركبة وإنهاء جميع المعاملات المالية بنجاح في {' '}
                {contract.actual_end_date ? new Date(contract.actual_end_date).toLocaleDateString('ar-KW') : 'التاريخ المحدد'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">تقييم ممتاز</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="rtl-flex gap-2">
            <Clock className="w-4 h-4" />
            الجدول الزمني
          </TabsTrigger>
          <TabsTrigger value="details" className="rtl-flex gap-2">
            <FileText className="w-4 h-4" />
            التفاصيل
          </TabsTrigger>
          <TabsTrigger value="overview" className="rtl-flex gap-2">
            <BarChart3 className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CompletedContractStats 
            contract={contract}
            contractStats={contractStats}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <CompletedContractDetails contract={contract} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <CompletedContractTimeline contract={contract} />
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default CompletedStage;