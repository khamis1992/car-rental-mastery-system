import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ContractForm } from '@/components/Contracts/ContractForm';
import { ContractsList } from '@/components/Contracts/ContractsList';
import { ContractMonitoring } from '@/components/Contracts/ContractMonitoring';
import { ContractStats } from '@/components/Contracts/ContractStats';
import { ContractDetailsDialog } from '@/components/Contracts/ContractDetailsDialog';
import { useContractsOptimized } from '@/hooks/useContractsOptimized';
import { ContractsRealtimeProvider } from '@/contexts/ContractsRealtimeContext';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AbortErrorBoundary, useAbortErrorHandler } from '@/components/ErrorBoundary/AbortErrorBoundary';

const Contracts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useAbortErrorHandler(); // Handle abort errors gracefully
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [selectedQuotationForContract, setSelectedQuotationForContract] = useState<string>('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  
  const {
    quotations,
    contracts,
    customers,
    vehicles,
    contractStats,
    loading,
    errors,
    isConnected,
    lastSync,
    loadData,
    refreshSingleContractFromServer,
    updateSingleContract,
    activateContract,
    completeContract,
    updateStatus,
    syncAllContracts,
  } = useContractsOptimized();

  // التحقق من وجود quotation parameter في URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quotationId = urlParams.get('quotation');
    if (quotationId) {
      setSelectedQuotationForContract(quotationId);
      setContractFormOpen(true);
    }
  }, []);

  const handleFormSuccess = () => {
    // تحديث ذكي بدلاً من إعادة تحميل كامل
    loadData();
  };

  const handleAlertClick = (alert: any) => {
    console.log('Alert clicked:', alert);
  };

  return (
    <AbortErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة العقود</h1>
          <p className="text-muted-foreground">إدارة عقود الإيجار وعروض الأسعار</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isConnected && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-yellow-50 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              غير متصل
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              متصل
            </div>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={syncAllContracts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            مزامنة شاملة
          </Button>
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setContractFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            عقد جديد
          </Button>
        </div>
      </div>

      {/* Error alerts */}
      {Object.entries(errors).map(([key, error]) => 
        error && (
          <Alert key={key} variant="destructive">
            <AlertDescription>
              {error}
              {key === 'general' && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                  className="pr-2 h-auto p-0 text-destructive underline"
                >
                  تسجيل الدخول
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )
      )}

      {/* إحصائيات سريعة */}
      <ErrorBoundary>
        <ContractStats stats={contractStats} />
      </ErrorBoundary>

      {/* لوحة مراقبة العقود */}
      <ErrorBoundary>
        <ContractMonitoring onAlertClick={handleAlertClick} />
      </ErrorBoundary>

      {/* قائمة العقود */}
      <ErrorBoundary>
        <ContractsList
          contracts={contracts}
          customers={customers}
          onView={(id) => {
            setSelectedContractId(id);
            setContractDetailsOpen(true);
          }}
          onEdit={(id) => console.log('Edit contract:', id)}
          onActivate={(id) => activateContract(id, new Date().toISOString().split('T')[0])}
          onComplete={(id) => completeContract(id, new Date().toISOString().split('T')[0])}
          onStatusUpdate={() => {
            // تحديث فوري بدون إعادة تحميل كامل
            toast({
              title: "تم التحديث",
              description: "تم تحديث حالة العقد بنجاح",
            });
          }}
        />
      </ErrorBoundary>

      {/* نموذج إنشاء عقد */}
      <ErrorBoundary>
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
          onGetQuotationDetails={async (id: string) => {
            const { data, error } = await supabase
              .from('quotations')
              .select(`
                id,
                quotation_number,
                customer_id,
                vehicle_id,
                start_date,
                end_date,
                daily_rate,
                total_amount,
                discount_amount,
                tax_amount,
                final_amount,
                special_conditions,
                terms_and_conditions,
                customers(name, phone, email, address),
                vehicles(make, model, year, license_plate, vehicle_number)
              `)
              .eq('id', id)
              .single();
            if (error) throw error;
            return data;
          }}
          onSuccess={handleFormSuccess}
        />
      </ErrorBoundary>

      {/* تفاصيل العقد */}
      <ErrorBoundary>
        <ContractDetailsDialog
          contractId={selectedContractId}
          open={contractDetailsOpen}
          onOpenChange={setContractDetailsOpen}
          onDataUpdate={() => {
            if (selectedContractId) {
              refreshSingleContractFromServer(selectedContractId);
            }
          }}
        />
      </ErrorBoundary>
    </div>
    </AbortErrorBoundary>
  );
};

export default Contracts;