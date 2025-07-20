
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ErrorDisplayProps {
  error: Error;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "حدث خطأ",
  onRetry,
  showDetails = false
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getErrorSuggestion = (errorMessage: string) => {
    if (errorMessage.includes('معاملات الاستعلام غير مكتملة')) {
      return 'تأكد من اختيار حساب وتحديد نطاق تاريخ صحيح';
    }
    if (errorMessage.includes('failed to parse order')) {
      return 'هناك مشكلة في ترتيب البيانات، سيتم إصلاحها تلقائياً';
    }
    if (errorMessage.includes('فشل في تحميل')) {
      return 'تحقق من اتصال الإنترنت وحاول مرة أخرى';
    }
    return 'حاول إعادة تحميل الصفحة أو راجع المدخلات';
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {error.message}
        </div>
        
        <div className="text-sm bg-muted p-3 rounded-md">
          <strong>اقتراح الحل:</strong> {getErrorSuggestion(error.message)}
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="rtl-flex"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          )}

          {showDetails && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="rtl-flex">
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
