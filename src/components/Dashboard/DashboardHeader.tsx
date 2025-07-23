
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RealtimeIndicator } from './RealtimeIndicator';
import { UnifiedRealtimeStatus } from './UnifiedRealtimeStatus';

export const DashboardHeader = () => {
  return (
    <div className="space-y-4">
      {/* مؤشر الاتصال في الأعلى */}
      <div className="flex justify-end">
        <RealtimeIndicator size="md" showDetails={true} />
      </div>
      
      {/* حالة النظام التفصيلية */}
      <UnifiedRealtimeStatus />
    </div>
  );
};
