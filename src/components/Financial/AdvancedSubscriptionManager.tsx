import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, Crown, Zap, Rocket, Users, Car, FileText, 
  Shield, Settings, Plus, Edit, Trash2, Check, 
  DollarSign, Package, Clock, Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: string;
  price_per_month: number;
  features: Record<string, any>;
  limits: Record<string, any>;
  active: boolean;
  created_at: string;
  subscribers_count?: number;
  revenue?: number;
}

const AdvancedSubscriptionManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // بيانات خطط الاشتراك الافتراضية
  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'الخطة الأساسية',
      type: 'monthly',
      price_per_month: 50.00,
      features: {
        vehicles: 10,
        users: 5,
        contracts: 100,
        storage: '5GB',
        support: 'email',
        api_access: false,
        custom_reports: false,
        ai_features: false,
        white_label: false
      },
      limits: {
        max_vehicles: 10,
        max_users: 5,
        max_contracts: 100,
        max_storage_gb: 5
      },
      active: true,
      created_at: '2025-01-01',
      subscribers_count: 45,
      revenue: 2250
    },
    {
      id: 'professional',
      name: 'الخطة المهنية',
      type: 'monthly',
      price_per_month: 150.00,
      features: {
        vehicles: 50,
        users: 15,
        contracts: 500,
        storage: '25GB',
        support: 'phone_email',
        api_access: true,
        custom_reports: true,
        ai_features: false,
        white_label: false
      },
      limits: {
        max_vehicles: 50,
        max_users: 15,
        max_contracts: 500,
        max_storage_gb: 25
      },
      active: true,
      created_at: '2025-01-01',
      subscribers_count: 30,
      revenue: 4500
    },
    {
      id: 'enterprise',
      name: 'الخطة التجارية',
      type: 'monthly',
      price_per_month: 500.00,
      features: {
        vehicles: 'unlimited',
        users: 'unlimited',
        contracts: 'unlimited',
        storage: '100GB',
        support: '24/7',
        api_access: true,
        custom_reports: true,
        ai_features: true,
        white_label: false
      },
      limits: {
        max_vehicles: -1,
        max_users: -1,
        max_contracts: -1,
        max_storage_gb: 100
      },
      active: true,
      created_at: '2025-01-01',
      subscribers_count: 20,
      revenue: 10000
    },
    {
      id: 'ultimate',
      name: 'الخطة الشاملة',
      type: 'monthly',
      price_per_month: 1000.00,
      features: {
        vehicles: 'unlimited',
        users: 'unlimited',
        contracts: 'unlimited',
        storage: 'unlimited',
        support: '24/7',
        api_access: true,
        custom_reports: true,
        ai_features: true,
        white_label: true
      },
      limits: {
        max_vehicles: -1,
        max_users: -1,
        max_contracts: -1,
        max_storage_gb: -1
      },
      active: true,
      created_at: '2025-01-01',
      subscribers_count: 5,
      revenue: 5000
    }
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // محاكاة تحميل البيانات من قاعدة البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPlans(defaultPlans);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل خطط الاشتراك',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      starter: <Star className="w-6 h-6 text-blue-500" />,
      professional: <Zap className="w-6 h-6 text-green-500" />,
      enterprise: <Rocket className="w-6 h-6 text-orange-500" />,
      ultimate: <Crown className="w-6 h-6 text-purple-500" />
    };
    return icons[planId as keyof typeof icons] || <Package className="w-6 h-6" />;
  };

  const getPlanColor = (planId: string) => {
    const colors = {
      starter: 'border-blue-200 bg-blue-50',
      professional: 'border-green-200 bg-green-50',
      enterprise: 'border-orange-200 bg-orange-50',
      ultimate: 'border-purple-200 bg-purple-50'
    };
    return colors[planId as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  const togglePlanStatus = async (planId: string) => {
    try {
      setPlans(plans.map(plan => 
        plan.id === planId 
          ? { ...plan, active: !plan.active }
          : plan
      ));
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الخطة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الخطة',
        variant: 'destructive'
      });
    }
  };

  const formatFeatureValue = (value: any) => {
    if (value === 'unlimited') return 'غير محدود';
    if (typeof value === 'boolean') return value ? 'متاح' : 'غير متاح';
    return value;
  };

  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.revenue || 0), 0);
  const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscribers_count || 0), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل خطط الاشتراك...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              إدارة خطط الاشتراك المتقدمة
            </h1>
            <p className="text-muted-foreground">
              إدارة شاملة لخطط الاشتراك الأربعة مع الميزات المتقدمة
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          خطة جديدة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} د.ك</div>
            <p className="text-xs text-muted-foreground">من جميع الخطط</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتركين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">مؤسسة نشطة</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الخطط</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">خطة متاحة</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`card-elegant ${getPlanColor(plan.id)} relative overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <Switch
                  checked={plan.active}
                  onCheckedChange={() => togglePlanStatus(plan.id)}
                />
              </div>
              <div className="text-3xl font-bold text-center py-4">
                {plan.price_per_month} د.ك
                <span className="text-sm font-normal text-muted-foreground">/شهر</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">الميزات الرئيسية:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>المركبات:</span>
                    <Badge variant="outline">{formatFeatureValue(plan.features.vehicles)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>المستخدمون:</span>
                    <Badge variant="outline">{formatFeatureValue(plan.features.users)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>العقود:</span>
                    <Badge variant="outline">{formatFeatureValue(plan.features.contracts)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>التخزين:</span>
                    <Badge variant="outline">{plan.features.storage}</Badge>
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">الميزات المتقدمة:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    {plan.features.api_access ? 
                      <Check className="w-3 h-3 text-green-500" /> : 
                      <span className="w-3 h-3 text-gray-300">×</span>
                    }
                    <span>API</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.features.ai_features ? 
                      <Check className="w-3 h-3 text-green-500" /> : 
                      <span className="w-3 h-3 text-gray-300">×</span>
                    }
                    <span>ذكاء اصطناعي</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.features.custom_reports ? 
                      <Check className="w-3 h-3 text-green-500" /> : 
                      <span className="w-3 h-3 text-gray-300">×</span>
                    }
                    <span>تقارير مخصصة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.features.white_label ? 
                      <Check className="w-3 h-3 text-green-500" /> : 
                      <span className="w-3 h-3 text-gray-300">×</span>
                    }
                    <span>علامة بيضاء</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>المشتركون:</span>
                  <Badge variant="secondary">{plan.subscribers_count}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>الإيرادات:</span>
                  <Badge variant="secondary">{plan.revenue?.toLocaleString()} د.ك</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-3 h-3 ml-1" />
                  تعديل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>

            {/* Popular Badge */}
            {plan.id === 'professional' && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500 text-white">الأكثر شعبية</Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedPlan && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(selectedPlan.id)}
              تفاصيل {selectedPlan.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="features">الميزات</TabsTrigger>
                <TabsTrigger value="limits">الحدود</TabsTrigger>
                <TabsTrigger value="analytics">الإحصائيات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedPlan.features).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium capitalize">{key.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{formatFeatureValue(value)}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="limits" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedPlan.limits).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">{key.replace('max_', '').replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">
                        {value === -1 ? 'غير محدود' : value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{selectedPlan.subscribers_count}</div>
                    <div className="text-sm text-muted-foreground">مشترك نشط</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{selectedPlan.revenue?.toLocaleString()} د.ك</div>
                    <div className="text-sm text-muted-foreground">إيرادات شهرية</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">
                      {selectedPlan.revenue && totalRevenue ? 
                        Math.round((selectedPlan.revenue / totalRevenue) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">من إجمالي الإيرادات</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء خطة اشتراك جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم الخطة</Label>
                <Input id="name" placeholder="مثال: الخطة المتقدمة" />
              </div>
              <div>
                <Label htmlFor="price">السعر الشهري (د.ك)</Label>
                <Input id="price" type="number" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" placeholder="وصف مفصل للخطة..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button>إنشاء الخطة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedSubscriptionManager; 