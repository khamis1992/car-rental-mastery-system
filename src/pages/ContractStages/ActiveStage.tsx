import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, ArrowRight } from 'lucide-react';
import { ContractStageWrapper } from '@/components/Contracts/ContractStageWrapper';

const ActiveStage = () => {
  const navigate = useNavigate();

  return (
    <ContractStageWrapper stageName="مرحلة التسليم" stageDescription="تسليم المركبة للعميل">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة التسليم</h1>
          <p className="text-muted-foreground">تسليم المركبة للعميل</p>
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
            <Truck className="w-5 h-5" />
            تسليم المركبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">المهام المطلوبة:</h3>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>فحص المركبة قبل التسليم</li>
                <li>توثيق حالة المركبة بالصور</li>
                <li>تسليم المفاتيح والوثائق</li>
                <li>تأكيد استلام العميل</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button className="flex items-center gap-2">
                الانتقال للدفع
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContractStageWrapper>
  );
};

export default ActiveStage;