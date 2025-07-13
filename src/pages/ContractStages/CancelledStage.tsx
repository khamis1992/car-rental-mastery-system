import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CancelledStageProps {
  contract: any;
}

const CancelledStage: React.FC<CancelledStageProps> = ({ contract }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive rtl-title">
          <AlertCircle className="w-5 h-5" />
          العقد ملغي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-muted-foreground">
            تم إلغاء هذا العقد ولا يمكن تنفيذ أي إجراءات عليه.
          </div>
          
          {contract?.notes && (
            <div>
              <h4 className="font-medium mb-2">ملاحظات الإلغاء:</h4>
              <p className="text-sm text-muted-foreground">{contract.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CancelledStage;