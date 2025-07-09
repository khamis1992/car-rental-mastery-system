import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Users, FileText, Car, Search, Filter } from 'lucide-react';
import { CostCenter, CostCenterService } from '@/services/BusinessServices/CostCenterService';
import { toast } from 'sonner';
import CostCenterForm from './CostCenterForm';

interface CostCenterListProps {
  costCenters: CostCenter[];
  onRefresh: () => void;
  isLoading: boolean;
}

const CostCenterList = ({ costCenters, onRefresh, isLoading }: CostCenterListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const costCenterService = new CostCenterService();

  const filteredCostCenters = costCenters.filter(cc => {
    const matchesSearch = cc.cost_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cc.cost_center_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || cc.cost_center_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (costCenter: CostCenter) => {
    if (!confirm(`هل أنت متأكد من حذف مركز التكلفة "${costCenter.cost_center_name}"؟`)) {
      return;
    }

    try {
      await costCenterService.deleteCostCenter(costCenter.id);
      toast.success('تم حذف مركز التكلفة بنجاح');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting cost center:', error);
      toast.error(error.message || 'فشل في حذف مركز التكلفة');
    }
  };

  const getCostCenterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      operational: 'تشغيلي',
      administrative: 'إداري',
      revenue: 'إيرادات',
      support: 'دعم'
    };
    return types[type] || type;
  };

  const getCostCenterTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      operational: 'blue',
      administrative: 'green',
      revenue: 'purple',
      support: 'orange'
    };
    return colors[type] || 'gray';
  };

  const calculateUtilization = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <FileText className="h-5 w-5" />
            قائمة مراكز التكلفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* أدوات البحث والتصفية */}
          <div className="flex gap-4 mb-6 rtl-flex">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في مراكز التكلفة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="operational">تشغيلي</SelectItem>
                <SelectItem value="administrative">إداري</SelectItem>
                <SelectItem value="revenue">إيرادات</SelectItem>
                <SelectItem value="support">دعم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* جدول مراكز التكلفة */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                  <TableHead className="text-right font-semibold">الاستخدام</TableHead>
                  <TableHead className="text-right font-semibold">المصروف</TableHead>
                  <TableHead className="text-right font-semibold">الميزانية</TableHead>
                  <TableHead className="text-right font-semibold">المستوى</TableHead>
                  <TableHead className="text-right font-semibold">النوع</TableHead>
                  <TableHead className="text-right font-semibold">اسم مركز التكلفة</TableHead>
                  <TableHead className="text-right font-semibold">الكود</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredCostCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد مراكز تكلفة مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCostCenters.map((costCenter) => (
                    <TableRow key={costCenter.id}>
                      <TableCell>
                        <div className="flex gap-2 rtl-flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCostCenter(costCenter)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(costCenter)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={calculateUtilization(costCenter.actual_spent, costCenter.budget_amount)}
                            className="h-2"
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            {calculateUtilization(costCenter.actual_spent, costCenter.budget_amount).toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {costCenter.actual_spent.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell className="font-medium">
                        {costCenter.budget_amount.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: costCenter.level }, (_, i) => (
                            <div key={i} className="w-2 h-2 bg-primary rounded-full"></div>
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            {costCenter.level}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`bg-${getCostCenterTypeColor(costCenter.cost_center_type)}-100`}>
                          {getCostCenterTypeLabel(costCenter.cost_center_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium rtl-title">
                            {costCenter.cost_center_name}
                          </div>
                          {costCenter.description && (
                            <div className="text-sm text-muted-foreground">
                              {costCenter.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {costCenter.cost_center_code}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نموذج التعديل */}
      {editingCostCenter && (
        <CostCenterForm
          costCenter={editingCostCenter}
          onClose={() => setEditingCostCenter(null)}
          onSuccess={() => {
            setEditingCostCenter(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default CostCenterList;