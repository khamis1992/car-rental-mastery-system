import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useSadadStats } from '@/hooks/useSadadData';

const SadadStats: React.FC = () => {
  const [dateFilter, setDateFilter] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { data: stats, isLoading, refetch } = useSadadStats({
    from_date: dateFilter.from,
    to_date: dateFilter.to
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    colorClass 
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    trend?: string;
    colorClass: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-success mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إحصائيات SADAD</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                تطبيق الفلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المدفوعات"
          value={stats?.total_payments || 0}
          icon={DollarSign}
          description="عدد المدفوعات الكلي"
          colorClass="text-primary"
        />

        <StatCard
          title="المدفوعات الناجحة"
          value={stats?.successful_payments || 0}
          icon={CheckCircle}
          description="المدفوعات المكتملة"
          trend={`${(stats?.success_rate || 0).toFixed(1)}% معدل النجاح`}
          colorClass="text-success"
        />

        <StatCard
          title="المدفوعات المعلقة"
          value={stats?.pending_payments || 0}
          icon={Clock}
          description="في انتظار المعالجة"
          colorClass="text-warning"
        />

        <StatCard
          title="المدفوعات الفاشلة"
          value={stats?.failed_payments || 0}
          icon={XCircle}
          description="مدفوعات غير مكتملة"
          colorClass="text-destructive"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              إجمالي المبالغ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">إجمالي المبلغ المحصل</span>
                <span className="text-2xl font-bold text-success">
                  {(stats?.total_amount || 0).toFixed(3)} د.ك
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">متوسط قيمة الدفعة</span>
                <span className="font-medium">
                  {(stats?.average_payment_amount || 0).toFixed(3)} د.ك
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">معدل النجاح</span>
                <span className={`font-medium ${(stats?.success_rate || 0) > 80 ? 'text-success' : 'text-warning'}`}>
                  {(stats?.success_rate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              تحليل الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المدفوعات الناجحة</span>
                  <span>{stats?.successful_payments || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${(stats?.success_rate || 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المدفوعات المعلقة</span>
                  <span>{stats?.pending_payments || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-warning h-2 rounded-full transition-all"
                    style={{ 
                      width: `${stats?.total_payments ? (stats.pending_payments / stats.total_payments) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المدفوعات الفاشلة</span>
                  <span>{stats?.failed_payments || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-destructive h-2 rounded-full transition-all"
                    style={{ 
                      width: `${stats?.total_payments ? (stats.failed_payments / stats.total_payments) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            معلومات الفترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <p className="font-medium">بداية الفترة</p>
              <p className="text-sm text-muted-foreground">
                {new Date(dateFilter.from).toLocaleDateString('ar')}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">نهاية الفترة</p>
              <p className="text-sm text-muted-foreground">
                {new Date(dateFilter.to).toLocaleDateString('ar')}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">عدد الأيام</p>
              <p className="text-sm text-muted-foreground">
                {Math.ceil((new Date(dateFilter.to).getTime() - new Date(dateFilter.from).getTime()) / (1000 * 60 * 60 * 24))} يوم
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SadadStats;