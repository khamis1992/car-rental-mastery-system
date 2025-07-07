import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MousePointer, Camera, AlertTriangle, CheckCircle } from 'lucide-react';

interface DamageGuidanceHelperProps {
  isAddingDamage: boolean;
  totalDamages: number;
  hasPhotos: boolean;
  readonly?: boolean;
}

export const DamageGuidanceHelper: React.FC<DamageGuidanceHelperProps> = ({
  isAddingDamage,
  totalDamages,
  hasPhotos,
  readonly = false
}) => {
  if (readonly) {
    return (
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertDescription>
          هذا المخطط للعرض فقط. يمكنك النقر على أي ضرر لعرض تفاصيله.
        </AlertDescription>
      </Alert>
    );
  }

  if (isAddingDamage) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <MousePointer className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>وضع إضافة الأضرار نشط:</strong>
          <br />
          • انقر على أي مكان في مخطط المركبة لتحديد موقع الضرر
          • تأكد من الدقة في تحديد الموقع
          • سيتم فتح نافذة لإدخال تفاصيل الضرر
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Start Guide */}
      {totalDamages === 0 && (
        <Alert className="flex flex-row-reverse items-start gap-3">
          <HelpCircle className="h-4 w-4 mt-0.5" />
          <AlertDescription className="text-right">
            <strong>لبدء توثيق أضرار المركبة:</strong>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <span>انقر على زر "إضافة ضرر" أعلاه</span>
                <span className="font-bold">.1</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>انقر على موقع الضرر في المخطط</span>
                <span className="font-bold">.2</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>أدخل وصف الضرر ومستواه</span>
                <span className="font-bold">.3</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>أضف صور توثيقية</span>
                <span className="font-bold">.4</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicators */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <Badge variant={totalDamages > 0 ? "default" : "secondary"}>
                {totalDamages} ضرر مسجل
              </Badge>
              <Badge variant={hasPhotos ? "default" : "secondary"}>
                {hasPhotos ? "يوجد" : "لا يوجد"} صور
              </Badge>
            </div>
            <h4 className="text-sm font-medium">حالة التوثيق</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3 h-3 ${totalDamages > 0 ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={totalDamages > 0 ? 'text-green-700' : 'text-gray-500'}>
                تسجيل الأضرار
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Camera className={`w-3 h-3 ${hasPhotos ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={hasPhotos ? 'text-green-700' : 'text-gray-500'}>
                التوثيق بالصور
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span className="text-orange-700">
                تحديد مستوى الضرر
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Alert className="border-blue-200 bg-blue-50 flex items-start gap-3">
        <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5" />
        <AlertDescription className="text-blue-700 text-left">
          <strong>دليل الاستخدام:</strong>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>انقر على أي ضرر لعرض التفاصيل</span>
            </div>
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>استخدم زر "إضافة ضرر" لتسجيل ضرر جديد</span>
            </div>
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>يُنصح بإضافة صور للأضرار الشديدة</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Tips */}
      <Alert className="border-amber-200 bg-amber-50 flex flex-row-reverse items-start gap-3">
        <HelpCircle className="h-4 w-4 text-amber-600 mt-0.5" />
        <AlertDescription className="text-amber-700 text-right">
          <strong>نصائح للتوثيق الأمثل:</strong>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 justify-end">
              <span>اكتب وصفاً واضحاً ومفصلاً لكل ضرر</span>
              <span>•</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>التقط صوراً واضحة من زوايا مختلفة</span>
              <span>•</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>حدد مستوى الضرر بدقة (بسيط/متوسط/شديد)</span>
              <span>•</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>تأكد من توثيق جميع الأضرار المرئية</span>
              <span>•</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};