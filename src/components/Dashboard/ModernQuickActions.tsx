
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  FileText, 
  Users, 
  Car, 
  Receipt, 
  Calculator,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ModernQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "عقد جديد",
      description: "إنشاء عقد إيجار جديد",
      icon: FileText,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => navigate('/contracts/new')
    },
    {
      title: "عميل جديد",
      description: "إضافة عميل جديد",
      icon: Users,
      color: "bg-green-500 hover:bg-green-600",
      action: () => navigate('/customers/new')
    },
    {
      title: "فاتورة جديدة",
      description: "إنشاء فاتورة جديدة",
      icon: Receipt,
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => navigate('/invoices/new')
    },
    {
      title: "قيد محاسبي",
      description: "إنشاء قيد محاسبي",
      icon: Calculator,
      color: "bg-orange-500 hover:bg-orange-600",
      action: () => navigate('/journal-entries/new')
    },
    {
      title: "إضافة مركبة",
      description: "تسجيل مركبة جديدة",
      icon: Car,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: () => navigate('/fleet/new')
    },
    {
      title: "التقارير",
      description: "عرض التقارير المالية",
      icon: TrendingUp,
      color: "bg-teal-500 hover:bg-teal-600",
      action: () => navigate('/financial-reports')
    }
  ];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="rtl-title">الإجراءات السريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-200 border-dashed hover:border-solid"
                onClick={action.action}
              >
                <div className={`p-3 rounded-full text-white ${action.color} transition-colors`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
