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
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>لبدء توثيق أضرار المركبة:</strong>
            <br />
            1. انقر على زر "إضافة ضرر" أعلاه
            <br />
            2. انقر على موقع الضرر في المخطط
            <br />
            3. أدخل وصف الضرر ومستواه
            <br />
            4. أضف صور توثيقية
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicators */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">حالة التوثيق</h4>
            <div className="flex gap-2">
              <Badge variant={totalDamages > 0 ? "default" : "secondary"}>
                {totalDamages} ضرر مسجل
              </Badge>
              <Badge variant={hasPhotos ? "default" : "secondary"}>
                {hasPhotos ? "يوجد" : "لا يوجد"} صور
              </Badge>
            </div>
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

      {/* Tips */}
      <Alert className="border-amber-200 bg-amber-50">
        <HelpCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>نصائح للتوثيق الأمثل:</strong>
          <br />
          • اكتب وصفاً واضحاً ومفصلاً لكل ضرر
          <br />
          • التقط صوراً واضحة من زوايا مختلفة
          <br />
          • حدد مستوى الضرر بدقة (بسيط/متوسط/شديد)
          <br />
          • تأكد من توثيق جميع الأضرار المرئية
        </AlertDescription>
      </Alert>
    </div>
  );
};