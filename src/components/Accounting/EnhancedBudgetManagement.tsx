
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
  FileText
} from 'lucide-react';
import { BudgetService, BudgetWithItems, BudgetSummary } from '@/services/BudgetService';
import { BudgetItemManager } from '@/components/Budget/BudgetItemManager';
import { BudgetVarianceReport } from '@/components/Budget/BudgetVarianceReport';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

export const EnhancedBudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithItems[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithItems | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [budgetSummaries, setBudgetSummaries] = useState<Map<string, BudgetSummary>>(new Map());

  const budgetService = new BudgetService();

  const [formData, setFormData] = useState({
    budget_name: '',
    budget_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getAllBudgets();
      setBudgets(data);
      
      // تحميل ملخصات الميزانيات
      const summaries = new Map();
      for (const budget of data) {
        try {
          const summary = await budgetService.getBudgetSummary(budget.id);
          summaries.set(budget.id, summary);
        } catch (error) {
          console.error(`Error loading summary for budget ${budget.id}:`, error);
        }
      }
      setBudgetSummaries(summaries);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('فشل في تحميل الميزانيات');
    } finally {
      setLoading(false);
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
          budget_year: formData.budget_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes
        });
        toast.success('تم تحديث الميزانية بنجاح');
      } else {
        await budgetService.createBudget({
          budget_name: formData.budget_name,
          budget_year: formData.budget_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes,
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
      budget_year: budget.budget_year,
      start_date: budget.start_date,
      end_date: budget.end_date,
      notes: budget.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (budget: BudgetWithItems) => {
    setSelectedBudget(budget);
    setActiveTab('details');
  };

  const handleCopy = async (budget: BudgetWithItems) => {
    try {
      await budgetService.copyBudget(budget.id, {
        budget_name: `نسخة من ${budget.budget_name}`,
        budget_year: budget.budget_year + 1
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
        setActiveTab('list');
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
      budget_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      notes: ''
    });
    setEditingBudget(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      approved: { label: 'معتمد', variant: 'default' as const },
      active: { label: 'نشط', variant: 'default' as const },
      closed: { label: 'مقفل', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateBudgetProgress = (summary: BudgetSummary) => {
    return summary.total_budget > 0 ? (summary.total_spent / summary.total_budget) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">قائمة الميزانيات</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedBudget}>
            تفاصيل الميزانية
          </TabsTrigger>
          <TabsTrigger value="variance" disabled={!selectedBudget}>
            تقرير التباين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold rtl-title">الميزانيات</h2>
              <p className="text-muted-foreground">إدارة ومتابعة الميزانيات المالية</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  ميزانية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="rtl-title">
                    {editingBudget ? 'تعديل الميزانية' : 'إنشاء ميزانية جديدة'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="budget_name" className="rtl-label">اسم الميزانية</Label>
                    <Input
                      id="budget_name"
                      value={formData.budget_name}
                      onChange={(e) => setFormData({...formData, budget_name: e.target.value})}
                      placeholder="اسم الميزانية"
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

          {/* قائمة الميزانيات */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>جاري تحميل الميزانيات...</p>
            </div>
          ) : budgets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد ميزانيات</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإنشاء ميزانية جديدة لتتبع وإدارة أموالك
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget) => {
                const summary = budgetSummaries.get(budget.id);
                const progress = summary ? calculateBudgetProgress(summary) : 0;
                
                return (
                  <Card key={budget.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{budget.budget_name}</h3>
                            {getStatusBadge(budget.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                السنة المالية: {budget.budget_year}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                الميزانية: {formatCurrencyKWD(summary?.total_budget || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                المنفق: {formatCurrencyKWD(summary?.total_spent || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                البنود: {summary?.items_count || 0}
                              </span>
                            </div>
                          </div>

                          {summary && (
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">نسبة الاستخدام</span>
                                <span className="text-sm text-muted-foreground">
                                  {progress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={progress} className="w-full" />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(budget)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(budget)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(budget)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedBudget && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold rtl-title">{selectedBudget.budget_name}</h2>
                  <p className="text-muted-foreground">
                    السنة المالية {selectedBudget.budget_year} | {selectedBudget.start_date} إلى {selectedBudget.end_date}
                  </p>
                </div>
                {getStatusBadge(selectedBudget.status)}
              </div>

              <BudgetItemManager
                budgetId={selectedBudget.id}
                items={selectedBudget.budget_items || []}
                onItemsChange={loadBudgets}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          {selectedBudget && (
            <BudgetVarianceReport
              budgetId={selectedBudget.id}
              budgetName={selectedBudget.budget_name}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
