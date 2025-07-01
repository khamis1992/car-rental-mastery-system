import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContractForm } from '@/components/Contracts/ContractForm';
import { ContractsList } from '@/components/Contracts/ContractsList';
import { ContractMonitoring } from '@/components/Contracts/ContractMonitoring';
import { ContractStats } from '@/components/Contracts/ContractStats';
import { useContractsData } from '@/hooks/useContractsData';

const Contracts = () => {
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [selectedQuotationForContract, setSelectedQuotationForContract] = useState<string>('');
  
  const {
    quotations,
    contracts,
    customers,
    vehicles,
    contractStats,
    loading,
    loadData,
  } = useContractsData();

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
    loadData();
  };

  const handleAlertClick = (alert: any) => {
    console.log('Alert clicked:', alert);
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
      <ContractStats stats={contractStats} />

      {/* لوحة مراقبة العقود */}
      <ContractMonitoring onAlertClick={handleAlertClick} />

      {/* قائمة العقود */}
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