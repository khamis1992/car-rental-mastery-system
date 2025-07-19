
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2,
  Info,
  Target,
  Users,
  DollarSign
} from 'lucide-react';
import { CostCenterManagement } from '@/components/Accounting/CostCenterManagement';

const CostCenters = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            مراكز التكلفة
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة شاملة لمراكز التكلفة والميزانيات والموظفين والأداء
          </p>
        </div>
      </div>

      {/* Explanation Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="rtl-title text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p>
              <strong>مراكز التكلفة الرئيسية:</strong> هذا القسم مخصص للإدارة الشاملة لمراكز التكلفة كوحدات تنظيمية، 
              بما في ذلك إنشاء المراكز، إدارة الميزانيات، تعيين الموظفين، ومراقبة الأداء.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">إدارة المراكز</p>
                  <p className="text-xs text-muted-foreground">إنشاء وتحديث مراكز التكلفة</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">إدارة الميزانيات</p>
                  <p className="text-xs text-muted-foreground">تخطيط ومراقبة ميزانيات المراكز</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">إدارة الموظفين</p>
                  <p className="text-xs text-muted-foreground">تعيين وإدارة موظفي المراكز</p>
                </div>
              </div>
            </div>
            <p className="text-sm mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 text-yellow-800 dark:text-yellow-200">
              <Target className="w-4 h-4 inline ml-2" />
              لتوزيع القيود المحاسبية على مراكز التكلفة، يرجى زيارة قسم "إدارة القيود المحاسبية" &gt; "توزيع التكاليف"
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <CostCenterManagement />
    </div>
  );
};

export default CostCenters;
