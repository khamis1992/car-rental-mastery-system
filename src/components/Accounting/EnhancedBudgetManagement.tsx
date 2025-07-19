import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, BarChart3, Calendar, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { BudgetService, BudgetWithItems } from '@/services/BudgetService';
import { BudgetVarianceReport } from '@/components/Budget/BudgetVarianceReport';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

export const EnhancedBudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithItems[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithItems | null>(null);
  const [showNewBudgetDialog, setShowNewBudgetDialog] = useState(false);
  const [showVarianceReport, setShowVarianceReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('budgets');

  const budgetService = new BudgetService();

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getAllBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('فشل في تحميل الميزانيات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (budgetData: any) => {
    try {
      await budgetService.createBudget({
        budget_name: budgetData.budget_name,
        budget_year: budgetData.budget_year,
        start_date: budgetData.start_date,
        end_date: budgetData.end_date,
        notes: budgetData.notes,
        status: 'draft'
      });
      toast.success('تم إنشاء الميزانية بنجاح');
      setShowNewBudgetDialog(false);
      loadBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('فشل في إنشاء الميزانية');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الميزانية؟')) return;
    
    try {
      await budgetService.deleteBudget(budgetId);
      toast.success('تم حذف الميزانية بنجاح');
      loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('فشل في حذف الميزانية');
    }
  };

  const getBudgetUtilization = (budget: BudgetWithItems): number => {
    if (!budget.budget_items?.length) return 0;
    const totalBudgeted = budget.budget_items.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0);
    const totalActual = budget.budget_items.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    return totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
  };

  const getBudgetStatus = (utilization: number) => {
    if (utilization <= 75) return { label: 'جيد', color: 'bg-green-500' };
    if (utilization <= 90) return { label: 'تحذير', color: 'bg-yellow-500' };
    return { label: 'خطر', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="rtl-flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold rtl-title">إدارة الميزانيات</h2>
          <p className="text-muted-foreground">تخطيط ومراقبة الميزانيات والتحكم في الإنفاق</p>
        </div>
        <div className="rtl-flex gap-2">
          <Button variant="outline" onClick={loadBudgets}>
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowNewBudgetDialog(true)}>
            <Plus className="w-4 h-4" />
            ميزانية جديدة
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budgets">الميزانيات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل</TabsTrigger>
          <TabsTrigger value="variance" disabled={!selectedBudget}>
            تقرير التباين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>جاري تحميل الميزانيات...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget) => {
                const utilization = getBudgetUtilization(budget);
                const status = getBudgetStatus(utilization);
                const totalBudgeted = budget.budget_items?.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0) || 0;
                const totalActual = budget.budget_items?.reduce((sum, item) => sum + (item.actual_amount || 0), 0) || 0;

                return (
                  <Card key={budget.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="rtl-flex justify-between items-start">
                        <div>
                          <CardTitle className="rtl-title">{budget.budget_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            السنة المالية: {budget.budget_year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            من {new Date(budget.start_date).toLocaleDateString('ar-KW')} 
                            إلى {new Date(budget.end_date).toLocaleDateString('ar-KW')}
                          </p>
                        </div>
                        <div className="rtl-flex gap-2">
                          <Badge variant={budget.status === 'active' ? 'default' : 'secondary'}>
                            {budget.status === 'active' ? 'نشط' : 'مسودة'}
                          </Badge>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-muted-foreground">المخطط</div>
                            <div className="font-semibold">{formatCurrencyKWD(totalBudgeted)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">الفعلي</div>
                            <div className="font-semibold">{formatCurrencyKWD(totalActual)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">المتبقي</div>
                            <div className="font-semibold">{formatCurrencyKWD(totalBudgeted - totalActual)}</div>
                          </div>
                        </div>

                        <div>
                          <div className="rtl-flex justify-between text-sm mb-2">
                            <span>نسبة الاستخدام</span>
                            <span>{utilization.toFixed(1)}%</span>
                          </div>
                          <Progress value={utilization} className="w-full" />
                        </div>

                        <div className="rtl-flex justify-between">
                          <div className="rtl-flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBudget(budget);
                                setActiveTab('variance');
                              }}
                            >
                              <BarChart3 className="w-4 h-4" />
                              تقرير التباين
                            </Button>
                          </div>
                          <div className="rtl-flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">تحليل الميزانيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                سيتم إضافة تحليلات مفصلة للميزانيات قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          {selectedBudget ? (
            <BudgetVarianceReport 
              budgetId={selectedBudget.id} 
              budgetName={selectedBudget.budget_name}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  يرجى اختيار ميزانية لعرض تقرير التباين
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for creating new budget */}
      <Dialog open={showNewBudgetDialog} onOpenChange={setShowNewBudgetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="rtl-title">ميزانية جديدة</DialogTitle>
          </DialogHeader>
          <NewBudgetForm onSubmit={handleCreateBudget} onCancel={() => setShowNewBudgetDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for creating new budget
const NewBudgetForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    budget_name: '',
    budget_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="budget_name" className="rtl-label">اسم الميزانية</Label>
        <Input
          id="budget_name"
          value={formData.budget_name}
          onChange={(e) => setFormData(prev => ({ ...prev, budget_name: e.target.value }))}
          placeholder="أدخل اسم الميزانية"
          required
        />
      </div>

      <div>
        <Label htmlFor="budget_year" className="rtl-label">السنة المالية</Label>
        <Input
          id="budget_year"
          type="number"
          value={formData.budget_year}
          onChange={(e) => setFormData(prev => ({ ...prev, budget_year: parseInt(e.target.value) }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date" className="rtl-label">تاريخ النهاية</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="ملاحظات إضافية (اختياري)"
        />
      </div>

      <div className="rtl-flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          إنشاء الميزانية
        </Button>
      </div>
    </form>
  );
};
