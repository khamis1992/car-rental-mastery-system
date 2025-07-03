import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle } from 'lucide-react';
import { ContractStageWrapper } from '@/components/Contracts/ContractStageWrapper';

const CompletedStage = () => {
  const navigate = useNavigate();

  return (
    <ContractStageWrapper stageName="مرحلة الاستلام" stageDescription="استلام المركبة وإنهاء العقد">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة الاستلام</h1>
          <p className="text-muted-foreground">استلام المركبة وإنهاء العقد</p>
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
            <Package className="w-5 h-5" />
            استلام المركبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم إنهاء العقد بنجاح</h3>
              </div>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>تم استلام المركبة من العميل</li>
                <li>تم فحص حالة المركبة</li>
                <li>تم إنهاء جميع المعاملات المالية</li>
                <li>تم إغلاق العقد رسمياً</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContractStageWrapper>
  );
};

export default CompletedStage;