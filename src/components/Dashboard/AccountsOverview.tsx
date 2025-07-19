
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';

interface AccountsData {
  totalReceivables: number;
  totalPayables: number;
  overdueReceivables: number;
  overduePayables: number;
  receivablesCount: number;
  payablesCount: number;
  overdueReceivablesCount: number;
  overduePayablesCount: number;
}

interface AccountsOverviewProps {
  data: AccountsData;
  loading?: boolean;
}

export const AccountsOverview: React.FC<AccountsOverviewProps> = ({ 
  data, 
  loading = false 
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const accountsData = [
    {
      title: "الذمم المدينة",
      total: data.totalReceivables,
      overdue: data.overdueReceivables,
      count: data.receivablesCount,
      overdueCount: data.overdueReceivablesCount,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: () => navigate('/customers')
    },
    {
      title: "الذمم الدائنة", 
      total: data.totalPayables,
      overdue: data.overduePayables,
      count: data.payablesCount,
      overdueCount: data.overduePayablesCount,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      action: () => navigate('/suppliers')
    }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="rtl-title">نظرة عامة على الحسابات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accountsData.map((account, index) => {
            const IconComponent = account.icon;
            const overduePercentage = account.total > 0 ? (account.overdue / account.total) * 100 : 0;
            
            return (
              <div 
                key={index}
                className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={account.action}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${account.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${account.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{account.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.count} حساب
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">الإجمالي</span>
                    <span className="font-semibold">
                      {formatCurrencyKWD(account.total)}
                    </span>
                  </div>
                  
                  {account.overdue > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-sm text-red-600">متأخر</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {account.overdueCount}
                        </Badge>
                        <span className="font-semibold text-red-600">
                          {formatCurrencyKWD(account.overdue)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {account.overdue === 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-sm">جميع الحسابات محدثة</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
