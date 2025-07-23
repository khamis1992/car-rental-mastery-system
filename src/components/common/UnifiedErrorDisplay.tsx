import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UnifiedErrorDisplayProps {
  error: Error;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
  context?: string;
  retryCount?: number;
  maxRetries?: number;
}

export const UnifiedErrorDisplay: React.FC<UnifiedErrorDisplayProps> = ({
  error,
  title = "حدث خطأ",
  onRetry,
  showDetails = false,
  showRetry = true,
  showHome = false,
  context,
  retryCount = 0,
  maxRetries = 3
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const navigate = useNavigate();

  const getErrorSuggestion = (errorMessage: string, context?: string) => {
    // Context-specific suggestions
    if (context === 'employees') {
      if (errorMessage.includes('معاملات الاستعلام غير مكتملة')) {
        return 'تأكد من اختيار قسم وتحديد معايير البحث بشكل صحيح';
      }
      if (errorMessage.includes('فشل في تحميل')) {
        return 'تحقق من صلاحيات الوصول لبيانات الموظفين';
      }
    }

    if (context === 'invoicing') {
      if (errorMessage.includes('معاملات الاستعلام غير مكتملة')) {
        return 'تأكد من اختيار عميل وتحديد نطاق تاريخ صحيح';
      }
      if (errorMessage.includes('فشل في حفظ')) {
        return 'تحقق من صحة البيانات المدخلة وحاول مرة أخرى';
      }
    }

    // General suggestions
    if (errorMessage.includes('failed to parse order')) {
      return 'هناك مشكلة في ترتيب البيانات، سيتم إصلاحها تلقائياً';
    }
    if (errorMessage.includes('فشل في تحميل') || errorMessage.includes('Failed to fetch')) {
      return 'تحقق من اتصال الإنترنت وحاول مرة أخرى';
    }
    if (errorMessage.includes('PermissionError')) {
      return 'تواصل مع المدير للحصول على الصلاحيات المطلوبة';
    }
    if (errorMessage.includes('ValidationError')) {
      return 'تحقق من صحة البيانات المدخلة';
    }
    
    return 'حاول إعادة تحميل الصفحة أو راجع المدخلات';
  };

  const canRetry = showRetry && onRetry && retryCount < maxRetries;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2 text-destructive flex-row-reverse">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {error.message}
        </div>
        
        <div className="text-sm bg-muted p-3 rounded-md">
          <strong>اقتراح الحل:</strong> {getErrorSuggestion(error.message, context)}
        </div>

        {retryCount > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            محاولة رقم {retryCount} من {maxRetries}
          </div>
        )}

        <div className="flex items-center gap-2 flex-row-reverse">
          {canRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="rtl-flex flex-row-reverse"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          )}

          {showHome && (
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="rtl-flex flex-row-reverse"
            >
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Button>
          )}

          {showDetails && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="rtl-flex flex-row-reverse">
                  {isDetailsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  تفاصيل الخطأ
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="text-xs font-mono bg-muted p-2 rounded border overflow-x-auto">
                  <pre>{error.stack || error.message}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};