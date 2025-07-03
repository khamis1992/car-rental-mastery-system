import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowRight } from 'lucide-react';
import { ContractDetailsDialog } from '@/components/Contracts/ContractDetailsDialog';

const PaymentStage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة الدفع</h1>
          <p className="text-muted-foreground">تسجيل المدفوعات</p>
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
            <DollarSign className="w-5 h-5" />
            تسجيل المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-2">المهام المطلوبة:</h3>
              <ul className="list-disc list-inside text-purple-800 space-y-1">
                <li>تسجيل الدفعات المستلمة</li>
                <li>إصدار الفواتير</li>
                <li>متابعة المتأخرات</li>
                <li>تأكيد اكتمال الدفع</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button className="flex items-center gap-2">
                إنهاء العقد
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {contractId && (
        <ContractDetailsDialog
          contractId={contractId}
          open={true}
          onOpenChange={(open) => !open && navigate('/contracts')}
        />
      )}
    </div>
  );
};

export default PaymentStage;