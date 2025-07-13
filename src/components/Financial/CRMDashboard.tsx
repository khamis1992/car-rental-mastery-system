import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, TrendingUp, DollarSign, Phone, Mail, Calendar, 
  Plus, Search, Filter, Star, Target, Activity, 
  CheckCircle, Clock, AlertCircle, MessageSquare,
  Building2, FileText, Camera, Send, Edit, Trash2
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive' | 'potential';
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'advocate';
  total_value: number;
  last_interaction: string;
  created_at: string;
}

interface Opportunity {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  value: number;
  probability: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expected_close_date: string;
  created_at: string;
}

interface Activity {
  id: string;
  customer_id: string;
  opportunity_id?: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'proposal_sent' | 'contract_signed';
  title: string;
  description: string;
  outcome: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'direct_mail';
  target_audience: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  reach: number;
  engagement: number;
  conversions: number;
  created_at: string;
}

const CRMDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // بيانات تجريبية
  const sampleCustomers: Customer[] = [
    {
      id: '1',
      name: 'شركة الخليج للتجارة',
      email: 'info@gulf-trading.com',
      phone: '+965 2222 3333',
      company: 'شركة الخليج للتجارة',
      status: 'active',
      lifecycle_stage: 'customer',
      total_value: 45000,
      last_interaction: '2025-01-10',
      created_at: '2024-12-01'
    },
    {
      id: '2',
      name: 'مؤسسة البيان',
      email: 'contact@bayan.com',
      phone: '+965 2233 4444',
      company: 'مؤسسة البيان',
      status: 'active',
      lifecycle_stage: 'prospect',
      total_value: 28000,
      last_interaction: '2025-01-08',
      created_at: '2024-11-15'
    },
    {
      id: '3',
      name: 'شركة الرواد',
      email: 'info@pioneers.com',
      phone: '+965 2244 5555',
      company: 'شركة الرواد',
      status: 'potential',
      lifecycle_stage: 'lead',
      total_value: 0,
      last_interaction: '2025-01-05',
      created_at: '2025-01-01'
    }
  ];

  const sampleOpportunities: Opportunity[] = [
    {
      id: '1',
      customer_id: '1',
      title: 'تأجير أسطول - 20 مركبة',
      description: 'عقد تأجير طويل الأمد لأسطول من 20 مركبة',
      value: 60000,
      probability: 85,
      stage: 'negotiation',
      expected_close_date: '2025-01-25',
      created_at: '2024-12-15'
    },
    {
      id: '2',
      customer_id: '2',
      title: 'خدمات الصيانة الشاملة',
      description: 'عقد صيانة شاملة لمدة سنة',
      value: 35000,
      probability: 70,
      stage: 'proposal',
      expected_close_date: '2025-02-10',
      created_at: '2024-12-20'
    },
    {
      id: '3',
      customer_id: '3',
      title: 'تأجير قصير الأمد',
      description: 'تأجير مركبات لفترة 3 أشهر',
      value: 15000,
      probability: 40,
      stage: 'qualification',
      expected_close_date: '2025-01-30',
      created_at: '2025-01-05'
    }
  ];

  const sampleActivities: Activity[] = [
    {
      id: '1',
      customer_id: '1',
      opportunity_id: '1',
      type: 'call',
      title: 'مكالمة متابعة',
      description: 'مناقشة تفاصيل العقد والأسعار',
      outcome: 'positive',
      created_at: '2025-01-10'
    },
    {
      id: '2',
      customer_id: '2',
      opportunity_id: '2',
      type: 'email',
      title: 'إرسال عرض أسعار',
      description: 'تم إرسال عرض أسعار مفصل لخدمات الصيانة',
      outcome: 'neutral',
      created_at: '2025-01-08'
    },
    {
      id: '3',
      customer_id: '3',
      type: 'meeting',
      title: 'اجتماع تعريفي',
      description: 'اجتماع أولي لفهم احتياجات العميل',
      outcome: 'positive',
      created_at: '2025-01-05'
    }
  ];

  const sampleCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'حملة عروض الشتاء',
      type: 'email',
      target_audience: 'العملاء الحاليين',
      status: 'active',
      budget: 5000,
      reach: 1250,
      engagement: 280,
      conversions: 45,
      created_at: '2025-01-01'
    },
    {
      id: '2',
      name: 'حملة العملاء الجدد',
      type: 'sms',
      target_audience: 'العملاء المحتملين',
      status: 'active',
      budget: 3000,
      reach: 800,
      engagement: 120,
      conversions: 18,
      created_at: '2024-12-20'
    }
  ];

  // بيانات الرسوم البيانية
  const salesFunnelData = [
    { stage: 'العملاء المحتملون', count: 150, value: 450000 },
    { stage: 'المؤهلون', count: 85, value: 320000 },
    { stage: 'العروض', count: 45, value: 200000 },
    { stage: 'التفاوض', count: 25, value: 140000 },
    { stage: 'الصفقات المغلقة', count: 12, value: 75000 }
  ];

  const customerLifecycleData = [
    { stage: 'عملاء محتملون', count: 35, percentage: 35 },
    { stage: 'عملاء مؤهلون', count: 28, percentage: 28 },
    { stage: 'عملاء حاليون', count: 25, percentage: 25 },
    { stage: 'عملاء مؤيدون', count: 12, percentage: 12 }
  ];

  const activityData = [
    { day: 'الأحد', calls: 15, emails: 25, meetings: 8 },
    { day: 'الاثنين', calls: 22, emails: 35, meetings: 12 },
    { day: 'الثلاثاء', calls: 18, emails: 28, meetings: 10 },
    { day: 'الأربعاء', calls: 25, emails: 40, meetings: 15 },
    { day: 'الخميس', calls: 20, emails: 30, meetings: 11 },
    { day: 'الجمعة', calls: 12, emails: 18, meetings: 6 },
    { day: 'السبت', calls: 8, emails: 12, meetings: 4 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // محاكاة تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCustomers(sampleCustomers);
      setOpportunities(sampleOpportunities);
      setActivities(sampleActivities);
      setCampaigns(sampleCampaigns);
      
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات CRM',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'lead': 'bg-blue-100 text-blue-800',
      'prospect': 'bg-yellow-100 text-yellow-800',
      'customer': 'bg-green-100 text-green-800',
      'advocate': 'bg-purple-100 text-purple-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getOpportunityStageColor = (stage: string) => {
    const colors = {
      'prospecting': 'bg-blue-100 text-blue-800',
      'qualification': 'bg-yellow-100 text-yellow-800',
      'proposal': 'bg-orange-100 text-orange-800',
      'negotiation': 'bg-green-100 text-green-800',
      'closed_won': 'bg-emerald-100 text-emerald-800',
      'closed_lost': 'bg-red-100 text-red-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'call': <Phone className="w-4 h-4" />,
      'email': <Mail className="w-4 h-4" />,
      'meeting': <Calendar className="w-4 h-4" />,
      'note': <FileText className="w-4 h-4" />,
      'proposal_sent': <Send className="w-4 h-4" />,
      'contract_signed': <CheckCircle className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  const totalCustomers = customers.length;
  const totalOpportunities = opportunities.length;
  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const averageOpportunityValue = totalOpportunities > 0 ? totalOpportunityValue / totalOpportunities : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل نظام CRM...</p>
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
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              نظام CRM المتطور
            </h1>
            <p className="text-muted-foreground">
              إدارة شاملة للعملاء والفرص والأنشطة التسويقية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            عميل جديد
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-500 ml-1" />
              +12% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفرص</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpportunities}</div>
            <div className="text-xs text-muted-foreground">
              {totalOpportunityValue.toLocaleString()} د.ك إجمالي القيمة
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الفرصة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageOpportunityValue.toLocaleString()} د.ك</div>
            <div className="text-xs text-muted-foreground">
              معدل الإغلاق: 68%
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأنشطة اليوم</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-xs text-muted-foreground">
              15 مكالمة، 8 اجتماعات
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="opportunities">الفرص</TabsTrigger>
          <TabsTrigger value="activities">الأنشطة</TabsTrigger>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة العملاء</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 ml-2" />
                    فلترة
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4 ml-2" />
                    بحث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStageColor(customer.lifecycle_stage)}>
                        {customer.lifecycle_stage}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {customer.total_value.toLocaleString()} د.ك
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>الفرص التجارية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{opportunity.title}</h3>
                      <Badge className={getOpportunityStageColor(opportunity.stage)}>
                        {opportunity.stage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <strong>القيمة:</strong> {opportunity.value.toLocaleString()} د.ك
                        </div>
                        <div className="text-sm">
                          <strong>الاحتمالية:</strong> {opportunity.probability}%
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        تاريخ الإغلاق المتوقع: {opportunity.expected_close_date}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={opportunity.probability} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>الأنشطة الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{activity.title}</h4>
                        <Badge variant="outline">{activity.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {activity.created_at}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>الحملات التسويقية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{campaign.budget.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">الميزانية (د.ك)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{campaign.reach.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">الوصول</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{campaign.engagement}</div>
                        <div className="text-xs text-muted-foreground">التفاعل</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{campaign.conversions}</div>
                        <div className="text-xs text-muted-foreground">التحويلات</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Funnel */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>قمع المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesFunnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Lifecycle */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>دورة حياة العميل</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerLifecycleData}
                      dataKey="count"
                      nameKey="stage"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {customerLifecycleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>الأنشطة الأسبوعية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calls" stroke="#8884d8" name="المكالمات" />
                  <Line type="monotone" dataKey="emails" stroke="#82ca9d" name="الإيميلات" />
                  <Line type="monotone" dataKey="meetings" stroke="#ffc658" name="الاجتماعات" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم العميل</Label>
                <Input id="name" placeholder="اسم العميل" />
              </div>
              <div>
                <Label htmlFor="company">الشركة</Label>
                <Input id="company" placeholder="اسم الشركة" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" placeholder="+965 1234 5678" />
              </div>
            </div>
            <div>
              <Label htmlFor="stage">مرحلة العميل</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">عميل محتمل</SelectItem>
                  <SelectItem value="prospect">عميل مؤهل</SelectItem>
                  <SelectItem value="customer">عميل حالي</SelectItem>
                  <SelectItem value="advocate">عميل مؤيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" placeholder="ملاحظات إضافية..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button>إضافة العميل</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMDashboard; 