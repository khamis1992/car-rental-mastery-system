import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { ViolationStats as ViolationStatsType } from '@/types/violation';

interface ViolationStatsProps {
  stats: ViolationStatsType;
}

export const ViolationStats: React.FC<ViolationStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  const statsCards = [
    {
      title: 'إجمالي المخالفات',
      value: stats.total_violations,
      icon: AlertTriangle,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'المخالفات المعلقة',
      value: stats.pending_violations,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'المخالفات المدفوعة',
      value: stats.paid_violations,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'المخالفات المتنازع عليها',
      value: stats.disputed_violations,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  const financialCards = [
    {
      title: 'إجمالي قيمة الغرامات',
      value: formatCurrency(stats.total_fines_amount),
      change: null
    },
    {
      title: 'المبلغ المحصل',
      value: formatCurrency(stats.total_paid_amount),
      change: null
    },
    {
      title: 'المبلغ المستحق',
      value: formatCurrency(stats.total_outstanding_amount),
      change: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* إحصائيات المخالفات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {financialCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إحصائيات المسؤولية */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع المسؤولية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مسؤولية العميل</p>
                <p className="text-lg font-bold">{stats.customer_liability_violations}</p>
              </div>
              <Badge variant="secondary">
                {stats.total_violations > 0 
                  ? Math.round((stats.customer_liability_violations / stats.total_violations) * 100)
                  : 0}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مسؤولية الشركة</p>
                <p className="text-lg font-bold">{stats.company_liability_violations}</p>
              </div>
              <Badge variant="outline">
                {stats.total_violations > 0 
                  ? Math.round((stats.company_liability_violations / stats.total_violations) * 100)
                  : 0}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};