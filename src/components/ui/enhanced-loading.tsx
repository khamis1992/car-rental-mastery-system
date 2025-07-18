import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  Building2, 
  User, 
  CreditCard,
  Sparkles
} from 'lucide-react';

interface EnhancedLoadingProps {
  type: 'page' | 'step' | 'form' | 'submit';
  title?: string;
  description?: string;
  progress?: number;
  showSteps?: boolean;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  type,
  title = 'جاري التحميل...',
  description = 'يرجى الانتظار',
  progress = 0,
  showSteps = false
}) => {
  // Skeleton للصفحة الكاملة
  if (type === 'page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-4 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              {/* Progress Skeleton */}
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    {[1, 2, 3, 4].map((step) => (
                      <React.Fragment key={step}>
                        <Skeleton className="w-10 h-10 rounded-full" />
                        {step < 4 && <Skeleton className="w-12 h-0.5" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              {/* Content Skeleton */}
              <div className="space-y-6">
                <div className="text-center">
                  <Skeleton className="w-12 h-12 mx-auto mb-4" />
                  <Skeleton className="h-8 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Skeleton للخطوة
  if (type === 'step') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="text-center">
          <Skeleton className="w-12 h-12 mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="p-4 border rounded-xl">
              <Skeleton className="w-8 h-8 mx-auto mb-3" />
              <Skeleton className="h-6 w-24 mx-auto mb-1" />
              <Skeleton className="h-4 w-32 mx-auto mb-3" />
              <Skeleton className="h-6 w-16 mx-auto mb-2" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // حالة تحميل النموذج
  if (type === 'form') {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  // حالة تحميل الإرسال
  if (type === 'submit') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              {/* Animation متقدمة */}
              <div className="relative">
                <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* أيقونات متحركة */}
              <div className="absolute -top-2 -right-2">
                <Building2 className="w-6 h-6 text-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
              </div>
              <div className="absolute -top-2 -left-2">
                <User className="w-6 h-6 text-green-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <CreditCard className="w-6 h-6 text-purple-500 animate-bounce" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-primary">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>

            {/* شريط تقدم */}
            {progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{Math.round(progress)}% مكتمل</p>
              </div>
            )}

            {/* خطوات التقدم */}
            {showSteps && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-700">التحقق من البيانات</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-blue-700">إنشاء الحساب</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>إعداد البيئة</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>التوجه للدفع</span>
                </div>
              </div>
            )}

            {/* تأثير الشرارات */}
            <div className="absolute top-4 right-4">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute bottom-4 left-4">
              <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" style={{ animationDelay: '0.7s' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

// Hook للاستخدام السهل
export const useEnhancedLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingType, setLoadingType] = React.useState<EnhancedLoadingProps['type']>('page');
  const [loadingTitle, setLoadingTitle] = React.useState('جاري التحميل...');
  const [loadingDescription, setLoadingDescription] = React.useState('يرجى الانتظار');
  const [progress, setProgress] = React.useState(0);

  const showLoading = (options?: Partial<EnhancedLoadingProps>) => {
    if (options?.type) setLoadingType(options.type);
    if (options?.title) setLoadingTitle(options.title);
    if (options?.description) setLoadingDescription(options.description);
    if (options?.progress) setProgress(options.progress);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setProgress(0);
  };

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
  };

  return {
    isLoading,
    loadingType,
    loadingTitle,
    loadingDescription,
    progress,
    showLoading,
    hideLoading,
    updateProgress,
    LoadingComponent: () => (
      <EnhancedLoading
        type={loadingType}
        title={loadingTitle}
        description={loadingDescription}
        progress={progress}
        showSteps={loadingType === 'submit'}
      />
    )
  };
}; 