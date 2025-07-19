import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Users,
  Building2,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FinancialModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  status: 'active' | 'pending' | 'warning';
  priority: 'high' | 'medium' | 'low';
  features: string[];
  recentActivity?: number;
  gradient: string;
}

export const FinancialNavigationHub: React.FC = () => {
  const navigate = useNavigate();

  const financialModules: FinancialModule[] = [
    {
      id: 'chart-accounts',
      title: 'دليل الحسابات',
      description: 'إدارة وتنظيم دليل الحسابات المحاسبي',
      icon: Calculator,
      route: '/chart-of-accounts',
      status: 'active',
      priority: 'high',
      features: ['عرض شجري', 'إدارة الحسابات', 'تقارير الأرصدة'],
      recentActivity: 5,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'journal-entries',
      title: 'القيود المحاسبية',
      description: 'إنشاء ومراجعة القيود المحاسبية',
      icon: FileText,
      route: '/journal-entries',
      status: 'active',
      priority: 'high',
      features: ['قيود تلقائية', 'مراجعة', 'مراكز التكلفة'],
      recentActivity: 12,
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'financial-reports',
      title: 'التقارير المالية',
      description: 'إنشاء التقارير المالية والتحليلية',
      icon: BarChart3,
      route: '/financial-reports',
      status: 'active',
      priority: 'medium',
      features: ['ميزانية عمومية', 'قائمة دخل', 'تدفقات نقدية'],
      recentActivity: 3,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'cost-centers',
      title: 'مراكز التكلفة',
      description: 'إدارة وتحليل مراكز التكلفة',
      icon: Building2,
      route: '/cost-centers',
      status: 'pending',
      priority: 'medium',
      features: ['توزيع التكاليف', 'تحليل الربحية', 'الموازنات'],
      recentActivity: 0,
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'accounting-automation',
      title: 'الأتمتة المحاسبية',
      description: 'إعدادات الأتمتة والذكاء الاصطناعي',
      icon: Zap,
      route: '/accounting-automation',
      status: 'warning',
      priority: 'low',
      features: ['قيود تلقائية', 'ذكاء اصطناعي', 'كشف الأخطاء'],
      recentActivity: 1,
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'analytics',
      title: 'التحليلات المالية',
      description: 'تحليلات متقدمة ومؤشرات الأداء',
      icon: TrendingUp,
      route: '/financial-analytics',
      status: 'active',
      priority: 'medium',
      features: ['مؤشرات الأداء', 'تحليل الاتجاهات', 'التنبؤات'],
      recentActivity: 8,
      gradient: 'from-teal-500 to-teal-600'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            مركز الإدارة المالية
          </CardTitle>
          <p className="text-muted-foreground">
            الواجهة الموحدة لجميع الوظائف المحاسبية والمالية في النظام
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financialModules.map((module) => {
          const IconComponent = module.icon;
          
          return (
            <Card 
              key={module.id} 
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(module.route)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${module.gradient} shadow-lg`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusIcon(module.status)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(module.priority)}`}
                    >
                      {module.priority === 'high' ? 'عالي' : 
                       module.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">الميزات الرئيسية:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {module.recentActivity !== undefined && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      النشاط الأخير
                    </span>
                    <span className="text-sm font-medium">
                      {module.recentActivity > 0 ? `${module.recentActivity} عملية` : 'لا يوجد'}
                    </span>
                  </div>
                )}
                
                <Button 
                  className="w-full group-hover:shadow-md transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(module.route);
                  }}
                >
                  <span>الانتقال إلى الوحدة</span>
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Access Actions */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <FileText className="w-5 h-5" />
              <span className="text-xs">قيد جديد</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Calculator className="w-5 h-5" />
              <span className="text-xs">حساب جديد</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">تقرير سريع</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">تحليل الأرصدة</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};