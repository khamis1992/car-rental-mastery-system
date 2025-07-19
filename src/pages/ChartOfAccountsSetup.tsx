
import React from 'react';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { Button } from '@/components/ui/button';
import { ArrowRight, Database, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChartOfAccountsSetupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">إعداد دليل الحسابات</h1>
          <p className="text-muted-foreground">إعداد وتهيئة دليل الحسابات المحاسبي</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            onClick={() => navigate('/chart-of-accounts')}
            className="rtl-flex"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لدليل الحسابات
          </Button>
        </div>
      </div>

      {/* Setup Component */}
      <ChartOfAccountsSetup />
    </div>
  );
};

export default ChartOfAccountsSetupPage;
