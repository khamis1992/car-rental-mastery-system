import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calendar, DollarSign } from 'lucide-react';

interface ContractStatsProps {
  stats: {
    total: number;
    active: number;
    endingToday: number;
    monthlyRevenue: number;
  };
}

export const ContractStats: React.FC<ContractStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي العقود</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">عقود نشطة</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.endingToday}</p>
              <p className="text-sm text-muted-foreground">تنتهي اليوم</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(3)} د.ك</p>
              <p className="text-sm text-muted-foreground">إيرادات الشهر</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};