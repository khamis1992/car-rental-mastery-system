import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, TrendingUp, Star, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/utils';

interface CompletedContractStatsProps {
  contract: any;
  contractStats?: {
    totalRevenue: number;
    completedCount: number;
    averageRating: number;
    onTimeCompletionRate: number;
  };
}

export const CompletedContractStats: React.FC<CompletedContractStatsProps> = ({
  contract,
  contractStats
}) => {
  const contractDuration = contract.actual_end_date && contract.actual_start_date
    ? Math.ceil((new Date(contract.actual_end_date).getTime() - new Date(contract.actual_start_date).getTime()) / (1000 * 60 * 60 * 24))
    : contract.rental_days;

  const wasOnTime = contract.actual_end_date 
    ? new Date(contract.actual_end_date) <= new Date(contract.end_date)
    : true;

  const stats = [
    {
      title: 'مدة الإيجار الفعلية',
      value: `${contractDuration} يوم`,
      icon: <CalendarDays className="w-5 h-5" />,
      subtitle: `من ${formatDate(contract.actual_start_date || contract.start_date)} إلى ${formatDate(contract.actual_end_date || contract.end_date)}`,
    },
    {
      title: 'القيمة الإجمالية',
      value: formatCurrencyKWD(contract.final_amount),
      icon: <DollarSign className="w-5 h-5" />,
      subtitle: `المعدل اليومي: ${formatCurrencyKWD(contract.daily_rate)}`,
    },
    {
      title: 'حالة التسليم',
      value: wasOnTime ? 'في الموعد' : 'متأخر',
      icon: <Clock className="w-5 h-5" />,
      subtitle: contract.actual_end_date ? formatDateTime(contract.actual_end_date) : 'لم يتم التسليم بعد',
      badge: wasOnTime ? { text: 'ممتاز', type: 'success' } : { text: 'متأخر', type: 'warning' }
    },
    {
      title: 'نوع العقد',
      value: contract.contract_type === 'daily' ? 'يومي' : 
             contract.contract_type === 'weekly' ? 'أسبوعي' : 
             contract.contract_type === 'monthly' ? 'شهري' : 'مخصص',
      icon: <CheckCircle2 className="w-5 h-5" />,
      subtitle: `رقم العقد: ${contract.contract_number}`,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="card-elegant hover:card-highlight transition-all duration-300">
            <CardHeader className="space-y-0 pb-2 text-center">
              <div className="text-primary flex justify-center mb-2">
                {stat.icon}
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mb-2">
                  {stat.subtitle}
                </p>
              )}
              {stat.badge && (
                <Badge 
                  variant={stat.badge.type === 'success' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {stat.badge.text}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {contractStats && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              إحصائيات الأداء العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatCurrencyKWD(contractStats.totalRevenue)}
                </div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {contractStats.completedCount}
                </div>
                <p className="text-sm text-muted-foreground">العقود المكتملة</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1 flex items-center justify-center gap-1">
                  {contractStats.averageRating.toFixed(1)}
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm text-muted-foreground">متوسط التقييم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};