import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ContractForm } from '@/components/Contracts/ContractForm';
import { ContractsList } from '@/components/Contracts/ContractsList';
import { contractService } from '@/services/contractService';
import { quotationService } from '@/services/quotationService';

const Contracts = () => {
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [selectedQuotationForContract, setSelectedQuotationForContract] = useState<string>('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contractStats, setContractStats] = useState({
    total: 0,
    active: 0,
    endingToday: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // التحقق من وجود quotation parameter في URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quotationId = urlParams.get('quotation');
    if (quotationId) {
      setSelectedQuotationForContract(quotationId);
      setContractFormOpen(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadContracts(),
        loadCustomers(),
        loadVehicles(),
        loadQuotations(),
        loadStats(),
      ]);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuotations = async () => {
    // تحميل العروض النشطة فقط للاستخدام في العقود
    const activeQuotations = await quotationService.getActiveQuotations();
    setQuotations(activeQuotations);
  };

  const loadContracts = async () => {
    const data = await contractService.getContractsWithDetails();
    setContracts(data);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, customer_number')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    setCustomers(data || []);
  };

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, vehicle_number, daily_rate, status')
      .order('vehicle_number');
    
    if (error) throw error;
    setVehicles(data || []);
  };

  const loadStats = async () => {
    const contractStatsData = await contractService.getContractStats();
    setContractStats(contractStatsData);
  };

  const handleConvertToContract = (quotationId: string) => {
    setSelectedQuotationForContract(quotationId);
    setContractFormOpen(true);
  };

  const handleFormSuccess = () => {
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة العقود</h1>
          <p className="text-muted-foreground">إدارة عقود الإيجار وعروض الأسعار</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setContractFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            عقد جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{contractStats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي العقود</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contractStats.active}</p>
                <p className="text-sm text-muted-foreground">عقود نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{contractStats.endingToday}</p>
                <p className="text-sm text-muted-foreground">تنتهي اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{contractStats.monthlyRevenue.toFixed(3)} د.ك</p>
                <p className="text-sm text-muted-foreground">إيرادات الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات - العقود فقط */}
      <ContractsList
        contracts={contracts}
        onView={(id) => console.log('View contract:', id)}
        onEdit={(id) => console.log('Edit contract:', id)}
        onActivate={(id) => console.log('Activate contract:', id)}
        onComplete={(id) => console.log('Complete contract:', id)}
      />

      {/* نموذج إنشاء عقد */}
      <ContractForm
        open={contractFormOpen}
        onOpenChange={(open) => {
          setContractFormOpen(open);
          if (!open) {
            setSelectedQuotationForContract('');
          }
        }}
        customers={customers}
        vehicles={vehicles}
        quotations={quotations.filter(q => ['draft', 'sent', 'accepted'].includes(q.status))}
        selectedQuotation={selectedQuotationForContract}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Contracts;