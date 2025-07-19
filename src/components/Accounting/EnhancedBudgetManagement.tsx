import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Download, Upload, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import { BudgetService, type BudgetWithItems, type BudgetSummary } from '@/services/BudgetService';
import { BudgetItemManager } from '@/components/Budget/BudgetItemManager';
import { BudgetVarianceReport } from '@/components/Budget/BudgetVarianceReport';
import { toast } from 'sonner';
import { formatCurrencyKWD } from '@/lib/currency';

export const EnhancedBudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithItems[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithItems | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const budgetService = new BudgetService();

  const [formData, setFormData] = useState({
    budget_name: '',
    budget_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    notes: '',
    status: 'draft'
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
    try {
      setLoading(true);
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

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.budget_name || !formData.start_date || !formData.end_date) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      await budgetService.createBudget(formData);
      toast.success('تم إنشاء الميزانية بنجاح');
      setIsCreateDialogOpen(false);
      resetForm();
      loadBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('فشل في إنشاء الميزانية');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      budget_name: '',
      budget_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      notes: '',
      status: 'draft'
    });
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الميزانية؟')) return;

    try {
      await budgetService.deleteBudget(budgetId);
      toast.success('تم حذف الميزانية بنجاح');
      loadBudgets();
      if (selectedBudget?.id === budgetId) {
        setSelectedBudget(null);
        setBudgetSummary(null);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('فشل في حذف الميزانية');
    }
  };

  const handleCopyBudget = async (budget: BudgetWithItems) => {
    try {
      const newBudgetName = `نسخة من ${budget.budget_name} - ${new Date().getFullYear()}`;
      await budgetService.copyBudget(budget.id, {
        budget_name: newBudgetName,
        budget_year: new Date().getFullYear()
      });
      toast.success('تم نسخ الميزانية بنجاح');
      loadBudgets();
    } catch (error) {
      console.error('Error copying budget:', error);
      toast.error('فشل في نسخ الميزانية');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة الميزانيات</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rtl-flex">
              <Plus className="w-4 h-4" />
              إنشاء ميزانية جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="rtl-title">إنشاء ميزانية جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <Label htmlFor="budget_name" className="rtl-label">اسم الميزانية</Label>
                <Input
                  id="budget_name"
                  value={formData.budget_name}
                  onChange={(e) => setFormData({...formData, budget_name: e.target.value})}
                  placeholder="ميزانية 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="budget_year" className="rtl-label">السنة المالية</Label>
                <Input
                  id="budget_year"
                  type="number"
                  value={formData.budget_year}
                  onChange={(e) => setFormData({...formData, budget_year: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="rtl-label">تاريخ البداية</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date" className="rtl-label">تاريخ النهاية</Label>
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
                <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="ملاحظات الميزانية..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* قائمة الميزانيات */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="rtl-title">الميزانيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedBudget?.id === budget.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedBudget(budget)}
              >
                <div className="font-medium">{budget.budget_name}</div>
                <div className="text-sm text-muted-foreground">
                  السنة المالية: {budget.budget_year}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    budget.status === 'active' ? 'bg-green-100 text-green-700' :
                    budget.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {budget.status === 'active' ? 'نشط' :
                     budget.status === 'approved' ? 'معتمد' : 'مسودة'}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyBudget(budget);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBudget(budget.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* تفاصيل الميزانية */}
        <div className="lg:col-span-3">
          {selectedBudget && budgetSummary && (
            <>
              {/* ملخص الميزانية */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrencyKWD(budgetSummary.total_budget)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المبلغ المنفق</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrencyKWD(budgetSummary.total_spent)}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrencyKWD(budgetSummary.remaining_budget)}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold">₪</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">نسبة الاستخدام</p>
                        <p className="text-2xl font-bold text-foreground">
                          {budgetSummary.utilization_percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        budgetSummary.utilization_percentage > 80 
                          ? 'bg-red-100' 
                          : budgetSummary.utilization_percentage > 60 
                            ? 'bg-yellow-100' 
                            : 'bg-green-100'
                      }`}>
                        <span className={`font-bold ${
                        budgetSummary.utilization_percentage > 80 
                          ? 'text-red-600' 
                          : budgetSummary.utilization_percentage > 60 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                        }`}>
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تبويبات إدارة الميزانية */}
              <Tabs defaultValue="items" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">بنود الميزانية</TabsTrigger>
                  <TabsTrigger value="variance">تقرير التباين</TabsTrigger>
                </TabsList>

                <TabsContent value="items">
                  <BudgetItemManager
                    budgetId={selectedBudget.id}
                    items={selectedBudget.budget_items || []}
                    onItemsChange={() => {
                      loadBudgets();
                      loadBudgetSummary(selectedBudget.id);
                    }}
                  />
                </TabsContent>

                <TabsContent value="variance">
                  <BudgetVarianceReport budgetId={selectedBudget.id} />
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedBudget && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    لا توجد ميزانية محددة
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    اختر ميزانية من القائمة الجانبية أو أنشئ ميزانية جديدة
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
