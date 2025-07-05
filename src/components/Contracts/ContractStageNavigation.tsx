import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  PenTool, 
  Truck, 
  CreditCard, 
  CheckCircle,
  ChevronRight 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContractStageNavigationProps {
  currentStage: string;
  onStageChange: (stage: string) => void;
  contract: any;
}

export const ContractStageNavigation: React.FC<ContractStageNavigationProps> = ({
  currentStage,
  onStageChange,
  contract
}) => {
  const [paymentStatus, setPaymentStatus] = React.useState({ hasPayments: false, isFullyPaid: false });

  React.useEffect(() => {
    checkPaymentStatus();
  }, [contract?.id]);

  const checkPaymentStatus = async () => {
    if (!contract?.id) return;
    
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          outstanding_amount,
          payments(id, amount, status)
        `)
        .eq('contract_id', contract.id);
      
      const hasPayments = invoices?.some(inv => inv.payments && inv.payments.length > 0);
      const isFullyPaid = invoices?.every(inv => inv.outstanding_amount <= 0) && invoices?.length > 0;
      
      setPaymentStatus({ hasPayments, isFullyPaid });
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const stages = [
    {
      id: 'draft',
      name: 'إنشاء العقد',
      icon: FileText,
      description: 'إعداد العقد والتفاصيل',
      completed: contract.status !== 'draft'
    },
    {
      id: 'pending',
      name: 'التوقيع',
      icon: PenTool,
      description: 'توقيع العقد من الأطراف',
      completed: contract.customer_signature && contract.company_signature
    },
    {
      id: 'delivery',
      name: 'التسليم',
      icon: Truck,
      description: 'تسليم المركبة للعميل',
      completed: contract.delivery_completed_at
    },
    {
      id: 'payment',
      name: 'الدفع',
      icon: CreditCard,
      description: 'تسجيل المدفوعات والفواتير',
      completed: paymentStatus.isFullyPaid
    },
    {
      id: 'return',
      name: 'الاستلام',
      icon: CheckCircle,
      description: 'استلام المركبة من العميل',
      completed: contract.actual_end_date
    },
    {
      id: 'completed',
      name: 'إنهاء العقد',
      icon: CheckCircle,
      description: 'العقد مكتمل',
      completed: contract.status === 'completed'
    }
  ];

  const getStageStatus = (stage: any) => {
    if (stage.completed) return 'completed';
    if (stage.id === currentStage) return 'current';
    return 'pending';
  };

  const getStageVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'current': return 'default';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="border-b border-border pb-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-right">مراحل العقد</h2>
        <Badge variant="outline">
          العقد رقم: {contract.contract_number}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const status = getStageStatus(stage);
          const isClickable = status === 'completed' || status === 'current';
          
          return (
            <div key={stage.id} className="flex items-center gap-2">
              <Button
                variant={currentStage === stage.id ? "default" : "ghost"}
                size="sm"
                onClick={() => isClickable && onStageChange(stage.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2 min-w-fit text-sm whitespace-nowrap ${
                  currentStage === stage.id ? 'bg-primary text-primary-foreground' : ''
                } ${status === 'completed' ? 'text-green-600' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{stage.name}</span>
                {status === 'completed' && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
              </Button>
              
              {index < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-sm text-muted-foreground text-right">
        {stages.find(s => s.id === currentStage)?.description}
      </div>
    </div>
  );
};