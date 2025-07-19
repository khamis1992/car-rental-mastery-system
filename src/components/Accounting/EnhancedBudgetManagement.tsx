
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy, BarChart3, FileText, AlertTriangle } from 'lucide-react';
import { BudgetService, BudgetWithItems, BudgetSummary } from '@/services/BudgetService';
import { BudgetItemManager } from '@/components/Budget/BudgetItemManager';
import { BudgetVarianceReport } from '@/components/Budget/BudgetVarianceReport';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

export const EnhancedBudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithItems[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithItems | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  const budgetService = new BudgetService();

  const [formData, setFormData] = useState({
    budget_name: '',
    fiscal_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    description: '',
    cost_center_id: ''
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      loadBudgetSummary(selectedBudget.id);
    }
  }, [selectedBudget]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getAllBudgets();
      setBudgets(data);
      if (data.length > 0 && !selectedBudget) {
        setSelectedBudget(data[0]);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('فشل في تحميل الميزانيات');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetSummary = async (budgetId: string) => {
    try {
      const summary = await budgetService.getBudgetSummary(budgetId);
      setBudgetSummary(summary);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.budget_name || !formData.start_date || !formData.end_date) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.id, {
          budget_name: formData.budget_name,
          fiscal_year: formData.fiscal_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description
        });
        toast.success('تم تحديث الميزانية بنجاح');
      } else {
        await budgetService.createBudget({
          budget_name: formData.budget_name,
          fiscal_year: formData.fiscal_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description,
          status: 'draft'
        });
        toast.success('تم إنشاء الميزانية بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
      loadBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('فشل في حفظ الميزانية');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: BudgetWithItems) => {
    setEditingBudget(budget);
    setFormData({
      budget_name: budget.budget_name,
      fiscal_year: budget.fiscal_year,
      start_date: budget.start_date,
      end_date: budget.end_date,
      description: budget.description || '',
      cost_center_id: budget.cost_center_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleCopy = async (budget: BudgetWithItems) => {
    const newYear = budget.fiscal_year + 1;
    try {
      await budgetService.copyBudget(budget.id, {
        budget_name: `${budget.budget_name} - ${newYear}`,
        fiscal_year: newYear,
        start_date: `${newYear}-01-01`,
        end_date: `${newYear}-12-31`
      });
      toast.success('تم نسخ الميزانية بنجاح');
      loadBudgets();
    } catch (error) {
      console.error('Error copying budget:', error);
      toast.error('فشل في نسخ الميزانية');
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الميزانية؟')) return;

    try {
      await budgetService.deleteBudget(budgetId);
      toast.success('تم حذف الميزانية بنجاح');
      
      if (selectedBudget?.id === budgetId) {
        setSelectedBudget(null);
        setBudgetSummary(null);
      }
      
      loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('فشل في حذف الميزانية');
    }
  };

  const resetForm = () => {
    setFormData({
      budget_name: '',
      fiscal_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      description: '',
      cost_center_id: ''
    });
    setEditingBudget(null);
  };

  const getBudgetStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      active: { label: 'نشطة', variant: 'default' as const },
      approved: { label: 'معتمدة', variant: 'default' as const },
      closed: { label: 'مغلقة', variant: 'outline' as const }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      {/* قائمة الميزانيات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الميزانيات</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  ميزانية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBudget ? 'تعديل الميزانية' : 'إنشاء ميزانية جديدة'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="budget_name">اسم الميزانية</Label>
                    <Input
                      id="budget_name"
                      value={formData.budget_name}
                      onChange={(e) => setFormData({...formData, budget_name: e.target.value})}
                      placeholder="اسم الميزانية"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="fiscal_year">السنة المالية</Label>
                    <Input
                      id="fiscal_year"
                      type="number"
                      value={formData.fiscal_year}
                      onChange={(e) => setFormData({...formData, fiscal_year: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">تاريخ البداية</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">تاريخ النهاية</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="وصف الميزانية..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <Card 
                key={budget.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBudget?.id === budget.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedBudget(budget)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{budget.budget_name}</h3>
                    <Badge {...getBudgetStatusBadge(budget.status)}>
                      {getBudgetStatusBadge(budget.status).label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    السنة المالية: {budget.fiscal_year}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {budget.start_date} إلى {budget.end_date}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {budget.budget_items?.length || 0} بند
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(budget);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(budget);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(budget.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الميزانية المحددة */}
      {selectedBudget && (
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="items">البنود</TabsTrigger>
            <TabsTrigger value="variance">تقرير التباين</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedBudget.budget_name} - نظرة عامة</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrencyKWD(budgetSummary.total_budget)}
                      </div>
                      <div className="text-sm text-muted-foreground">إجمالي الميزانية</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrencyKWD(budgetSummary.total_spent)}
                      </div>
                      <div className="text-sm text-muted-foreground">إجمالي المنفق</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrencyKWD(budgetSummary.remaining_budget)}
                      </div>
                      <div className="text-sm text-muted-foreground">المتبقي</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {budgetSummary.utilization_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">معدل الاستخدام</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {budgetSummary.overbudget_items}
                      </div>
                      <div className="text-sm text-muted-foreground">بنود متجاوزة</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <BudgetItemManager
              budgetId={selectedBudget.id}
              items={selectedBudget.budget_items || []}
              onItemsChange={() => {
                loadBudgets();
                if (selectedBudget) {
                  loadBudgetSummary(selectedBudget.id);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="variance">
            <BudgetVarianceReport
              budgetId={selectedBudget.id}
              budgetName={selectedBudget.budget_name}
            />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>التقارير المتخصصة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 rtl-flex flex-col">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    تقرير الأداء
                  </Button>
                  <Button variant="outline" className="h-20 rtl-flex flex-col">
                    <FileText className="w-6 h-6 mb-2" />
                    تقرير التنفيذ
                  </Button>
                  <Button variant="outline" className="h-20 rtl-flex flex-col">
                    <AlertTriangle className="w-6 h-6 mb-2" />
                    تقرير المخاطر
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
