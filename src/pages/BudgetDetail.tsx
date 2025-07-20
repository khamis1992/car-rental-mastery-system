
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { BudgetItemManager } from '@/components/Budget/BudgetItemManager';
import { BudgetService, BudgetWithItems } from '@/services/BudgetService';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

const BudgetDetail = () => {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<BudgetWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const budgetService = new BudgetService();

  useEffect(() => {
    if (budgetId) {
      loadBudget();
    }
  }, [budgetId]);

  const loadBudget = async () => {
    if (!budgetId) return;
    
    setLoading(true);
    try {
      const budgetData = await budgetService.getBudgetById(budgetId);
      setBudget(budgetData);
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('فشل في تحميل بيانات الميزانية');
      navigate('/budget-management');
    } finally {
      setLoading(false);
    }
  };

  const handleItemsChange = () => {
    loadBudget(); // Reload budget data when items change
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center mt-2">جاري تحميل بيانات الميزانية...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">الميزانية غير موجودة</p>
          <Button onClick={() => navigate('/budget-management')} className="mt-4">
            العودة للميزانيات
          </Button>
        </div>
      </div>
    );
  }

  const totalBudgeted = budget.budget_items?.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0) || 0;
  const totalActual = budget.budget_items?.reduce((sum, item) => sum + (item.actual_amount || 0), 0) || 0;
  const utilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="rtl-flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/budget-management')}
            className="rtl-flex"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold rtl-title">{budget.budget_name}</h1>
            <p className="text-muted-foreground">
              السنة المالية {budget.budget_year} • من {new Date(budget.start_date).toLocaleDateString('ar-KW')} إلى {new Date(budget.end_date).toLocaleDateString('ar-KW')}
            </p>
          </div>
        </div>
        
        <div className="rtl-flex gap-2">
          <Badge variant={budget.status === 'active' ? 'default' : 'secondary'}>
            {budget.status === 'active' ? 'نشط' : 'مسودة'}
          </Badge>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrencyKWD(totalBudgeted)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي المخطط</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrencyKWD(totalActual)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الفعلي</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrencyKWD(totalBudgeted - totalActual)}
              </div>
              <div className="text-sm text-muted-foreground">المتبقي</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {utilization.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">نسبة الاستخدام</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items Manager */}
      <BudgetItemManager
        budgetId={budget.id}
        items={budget.budget_items || []}
        onItemsChange={handleItemsChange}
      />
      
      {/* Additional Notes */}
      {budget.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{budget.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetDetail;
