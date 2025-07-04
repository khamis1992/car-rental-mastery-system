import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CheckCircle2, Circle, Clock, FileText, PenTool, Truck, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { contractService } from '@/services/contractService';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'pending';
}

interface ContractData {
  id: string;
  status: string;
  contract_number: string;
  customer_name: string;
  vehicle_info: string;
}

interface ContractProgressIndicatorProps {
  currentStatus: string;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  contractData?: ContractData;
  onStatusUpdate?: () => void;
}

export const ContractProgressIndicator: React.FC<ContractProgressIndicatorProps> = ({
  currentStatus,
  className,
  showLabels = true,
  size = 'md',
  interactive = false,
  contractData,
  onStatusUpdate
}) => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [confirmAction, setConfirmAction] = useState<{ stepId: string; title: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getSteps = (status: string): ProgressStep[] => {
    const baseSteps = [
      {
        id: 'draft',
        title: 'إنشاء العقد',
        description: 'إعداد العقد والتفاصيل',
        icon: FileText,
      },
      {
        id: 'pending',
        title: 'التوقيع',
        description: 'توقيع العقد من الأطراف',
        icon: PenTool,
      },
      {
        id: 'active',
        title: 'التسليم',
        description: 'تسليم المركبة للعميل',
        icon: Truck,
      },
      {
        id: 'payment',
        title: 'الدفع',
        description: 'تسجيل المدفوعات',
        icon: DollarSign,
      },
      {
        id: 'completed',
        title: 'الاستلام',
        description: 'استلام المركبة وإنهاء العقد',
        icon: Package,
      },
    ];

    const statusOrder = ['draft', 'pending', 'active', 'payment', 'completed'];
    const currentIndex = statusOrder.indexOf(status);

    return baseSteps.map((step, index) => ({
      ...step,
      status: 
        index < currentIndex ? 'completed' :
        index === currentIndex ? 'current' :
        'pending'
    }));
  };

  const steps = getSteps(currentStatus);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getNextAllowedStep = (currentStep: string): string | null => {
    const statusOrder = ['draft', 'pending', 'active', 'payment', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStep);
    
    if (currentIndex >= 0 && currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const canAdvanceToStep = (stepId: string): boolean => {
    if (!interactive || !contractData) return false;
    
    const nextStep = getNextAllowedStep(currentStatus);
    return stepId === nextStep;
  };

  const getStepActionText = (stepId: string): { title: string; description: string } => {
    const actions = {
      pending: {
        title: 'تأكيد التوقيع',
        description: 'هل تريد تحويل العقد إلى حالة "في انتظار التوقيع"؟'
      },
      active: {
        title: 'تفعيل العقد',
        description: 'هل تريد تفعيل العقد وتسليم المركبة للعميل؟'
      },
      payment: {
        title: 'تسجيل الدفع',
        description: 'هل تريد الانتقال إلى مرحلة تسجيل المدفوعات؟'
      },
      completed: {
        title: 'إكمال العقد',
        description: 'هل تريد إكمال العقد واستلام المركبة؟'
      }
    };
    
    return actions[stepId as keyof typeof actions] || { title: '', description: '' };
  };

  const handleStepClick = (stepId: string) => {
    if (!interactive || !contractData || !user || !session) return;
    
    // Navigate to the contract stage page
    navigate(`/contracts/stage/${stepId}/${contractData.id}`);
  };

  const executeAction = async () => {
    if (!confirmAction || !contractData || !user || !session) return;
    
    setIsLoading(true);
    try {
      await contractService.updateContractStatus(contractData.id, confirmAction.stepId as any);
      onStatusUpdate?.();
      setConfirmAction(null);
    } catch (error) {
      console.error('خطأ في تحديث حالة العقد:', error);
      // يمكن إضافة toast notification هنا لاحقاً
      alert('حدث خطأ أثناء تحديث حالة العقد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          const isClickable = canAdvanceToStep(step.id);
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* خط الاتصال */}
              <div className="flex items-center w-full">
                {/* دائرة الخطوة */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <div
                        className={cn(
                          "rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                          sizeClasses[size],
                          // Final completed stage - distinctive orange for return/receipt stage
                          step.status === 'completed' && currentStatus === 'completed' && step.id === 'completed' 
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-orange-200 shadow-lg ring-2 ring-orange-200/50"
                            // Regular completed steps - simple green
                            : step.status === 'completed' 
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            // Current active step - blue with animation
                            : step.status === 'current' 
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white animate-pulse shadow-blue-200 shadow-md"
                            // Pending steps - muted
                            : "bg-muted border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50",
                          interactive && contractData && "cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-200"
                        )}
                        onClick={() => interactive && contractData && handleStepClick(step.id)}
                      >
                        {step.status === 'completed' ? (
                          currentStatus === 'completed' && step.id === 'completed' ? (
                            <CheckCircle2 className={cn(iconSizeClasses[size], "drop-shadow-sm")} />
                          ) : (
                            <CheckCircle className={iconSizeClasses[size]} />
                          )
                        ) : step.status === 'current' ? (
                          <Clock className={cn(iconSizeClasses[size], "animate-pulse")} />
                        ) : (
                          <Icon className={iconSizeClasses[size]} />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {interactive && contractData ? 
                          `انقر للانتقال إلى: ${step.title}` : 
                          step.description
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* خط الاتصال إلى الخطوة التالية */}
                {!isLast && (
                  <div className="flex-1 mx-2">
                     <div
                       className={cn(
                         "h-0.5 transition-all duration-300",
                         step.status === 'completed' ? "bg-emerald-500" : "bg-muted-foreground/30"
                       )}
                     />
                  </div>
                )}
              </div>

              {/* تسميات الخطوات */}
              {showLabels && (
                <div className="mt-3 text-center">
                   <div
                     className={cn(
                       "text-sm font-medium transition-colors duration-300",
                        step.status === 'completed' && currentStatus === 'completed' && step.id === 'completed'
                          ? "text-orange-600 font-semibold"
                          : step.status === 'completed' 
                          ? "text-emerald-600"
                         : step.status === 'current' 
                         ? "text-blue-600 font-medium"
                         : "text-muted-foreground"
                     )}
                   >
                    {step.title}
                  </div>
                  {size !== 'sm' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* حوار التأكيد */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={isLoading}>
              {isLoading ? 'جاري التحديث...' : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// مكون مبسط للعرض في الكارت
export const CompactProgressIndicator: React.FC<{ status: string; className?: string }> = ({
  status,
  className
}) => {
  return (
    <ContractProgressIndicator
      currentStatus={status}
      showLabels={false}
      size="sm"
      className={className}
    />
  );
};