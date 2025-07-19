
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialHighlights } from "@/components/Dashboard/FinancialHighlights";
import { useAccountingData } from "@/hooks/useAccountingData";
import { TrendingUp, AlertCircle, Users, FileText } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';

export const SimplifiedAccountingDashboard = () => {
  const { financialStats, recentTransactions, loading } = useAccountingData();

  // Mock financial data structure for FinancialHighlights
  const financialData = {
    totalRevenue: financialStats.monthlyRevenue,
    totalExpenses: financialStats.totalExpenses,
    netIncome: financialStats.netProfit,
    cashFlow: financialStats.monthlyRevenue * 0.15, // Mock cash flow
    accountsReceivable: financialStats.pendingPayments,
    accountsPayable: financialStats.totalExpenses * 0.3, // Mock payables
    revenueGrowth: 12.5, // Mock growth
    expenseGrowth: 8.2 // Mock growth
  };

  const quickStats = [
    {
      title: "المعاملات الأخيرة",
      value: recentTransactions.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "المدفوعات المعلقة", 
      value: formatCurrencyKWD(financialStats.pendingPayments),
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* العنوان الرئيسي */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 rtl-title">
          لوحة المعلومات المحاسبية
        </h2>
        <p className="text-muted-foreground">
          نظرة سريعة على الوضع المالي للشركة
        </p>
      </div>

      {/* المؤشرات المالية الرئيسية */}
      <FinancialHighlights data={financialData} loading={loading} />

      {/* إحصائيات سريعة إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* المعاملات الأخيرة */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">آخر المعاملات المحاسبية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.type === 'إيراد' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'إيراد' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrencyKWD(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
