import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Calculator, 
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  urgency: 'high' | 'medium' | 'low';
  category: 'create' | 'review' | 'report' | 'analysis';
  estimatedTime: string;
  gradient: string;
}

export const FinancialQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'new-journal-entry',
      title: 'قيد محاسبي جديد',
      description: 'إنشاء قيد محاسبي يدوي',
      icon: FileText,
      action: () => navigate('/journal-entries/new'),
      urgency: 'high',
      category: 'create',
      estimatedTime: '5 دقائق',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'new-account',
      title: 'حساب جديد',
      description: 'إضافة حساب جديد للدليل',
      icon: Calculator,
      action: () => navigate('/chart-of-accounts/new'),
      urgency: 'medium',
      category: 'create',
      estimatedTime: '3 دقائق',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'financial-report',
      title: 'تقرير مالي سريع',
      description: 'إنشاء تقرير مالي أساسي',
      icon: BarChart3,
      action: () => navigate('/financial-reports?quick=true'),
      urgency: 'medium',
      category: 'report',
      estimatedTime: '2 دقيقة',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'balance-analysis',
      title: 'تحليل الأرصدة',
      description: 'مراجعة سريعة لأرصدة الحسابات',
      icon: TrendingUp,
      action: () => navigate('/financial-analytics?type=balance'),
      urgency: 'low',
      category: 'analysis',
      estimatedTime: '1 دقيقة',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'pending-review',
      title: 'مراجعة القيود المعلقة',
      description: 'مراجعة القيود في انتظار الموافقة',
      icon: Clock,
      action: () => navigate('/journal-entries?status=pending'),
      urgency: 'high',
      category: 'review',
      estimatedTime: '10 دقائق',
      gradient: 'from-red-500 to-red-600'
    },
    {
      id: 'auto-entries',
      title: 'تشغيل القيود التلقائية',
      description: 'معالجة القيود التلقائية المعلقة',
      icon: Zap,
      action: () => navigate('/accounting-automation?action=process'),
      urgency: 'medium',
      category: 'create',
      estimatedTime: '2 دقيقة',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'create':
        return 'إنشاء';
      case 'review':
        return 'مراجعة';
      case 'report':
        return 'تقرير';
      case 'analysis':
        return 'تحليل';
      default:
        return category;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          الإجراءات السريعة
        </CardTitle>
        <p className="text-muted-foreground">
          أهم المهام المحاسبية التي تحتاج لاتخاذ إجراء
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Card 
                key={action.id}
                className="group hover:shadow-md transition-all duration-200 border cursor-pointer hover:-translate-y-0.5"
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.gradient} shadow-sm`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getUrgencyIcon(action.urgency)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getUrgencyColor(action.urgency)}`}
                      >
                        {getCategoryLabel(action.category)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        ⏱️ {action.estimatedTime}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/financial-dashboard')}
          >
            <Plus className="w-4 h-4 ml-2" />
            عرض جميع الإجراءات المتاحة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};