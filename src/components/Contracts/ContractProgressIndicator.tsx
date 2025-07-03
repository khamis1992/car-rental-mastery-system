import React from 'react';
import { CheckCircle, Circle, Clock, FileText, PenTool, Truck, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'pending';
}

interface ContractProgressIndicatorProps {
  currentStatus: string;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ContractProgressIndicator: React.FC<ContractProgressIndicatorProps> = ({
  currentStatus,
  className,
  showLabels = true,
  size = 'md'
}) => {
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

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* خط الاتصال */}
              <div className="flex items-center w-full">
                {/* دائرة الخطوة */}
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    sizeClasses[size],
                    step.status === 'completed' && "bg-green-500 border-green-500 text-white",
                    step.status === 'current' && "bg-primary border-primary text-white animate-pulse",
                    step.status === 'pending' && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className={iconSizeClasses[size]} />
                  ) : step.status === 'current' ? (
                    <Clock className={iconSizeClasses[size]} />
                  ) : (
                    <Icon className={iconSizeClasses[size]} />
                  )}
                </div>

                {/* خط الاتصال إلى الخطوة التالية */}
                {!isLast && (
                  <div className="flex-1 mx-2">
                    <div
                      className={cn(
                        "h-0.5 transition-all duration-300",
                        step.status === 'completed' ? "bg-green-500" : "bg-muted-foreground/30"
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
                      step.status === 'completed' && "text-green-600",
                      step.status === 'current' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
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