import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { ContractDetailsDialog } from '@/components/Contracts/ContractDetailsDialog';

const DraftStage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة إنشاء العقد</h1>
          <p className="text-muted-foreground">إعداد العقد والتفاصيل</p>
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
            <FileText className="w-5 h-5" />
            تفاصيل العقد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">المهام المطلوبة:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>التحقق من بيانات العميل</li>
                <li>مراجعة تفاصيل المركبة</li>
                <li>تحديد شروط الإيجار</li>
                <li>إعداد الوثائق المطلوبة</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button className="flex items-center gap-2">
                الانتقال للتوقيع
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

export default DraftStage;