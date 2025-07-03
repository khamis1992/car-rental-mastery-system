import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, ArrowRight } from 'lucide-react';
import { ContractStageWrapper } from '@/components/Contracts/ContractStageWrapper';

const PendingStage = () => {
  const navigate = useNavigate();

  return (
    <ContractStageWrapper stageName="مرحلة التوقيع" stageDescription="توقيع العقد من الأطراف">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة التوقيع</h1>
          <p className="text-muted-foreground">توقيع العقد من الأطراف</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2"
        >
          العودة للعقود
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <PenTool className="w-5 h-5" />
            التوقيع الإلكتروني
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-900 mb-2">المهام المطلوبة:</h3>
              <ul className="list-disc list-inside text-orange-800 space-y-1">
                <li>إرسال العقد للعميل للتوقيع</li>
                <li>متابعة توقيع العميل</li>
                <li>توقيع الشركة على العقد</li>
                <li>التأكد من اكتمال جميع التوقيعات</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button className="flex items-center gap-2">
                تفعيل العقد
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContractStageWrapper>
  );
};

export default PendingStage;