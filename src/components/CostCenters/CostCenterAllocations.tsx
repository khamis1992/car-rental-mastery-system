import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, TrendingUp, Users, Car, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CostCenterService, type CostCenterAllocation } from '@/services/BusinessServices/CostCenterService';
import { toast } from 'sonner';

const CostCenterAllocations = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedReferenceType, setSelectedReferenceType] = useState('');
  const [allocationData, setAllocationData] = useState({
    reference_type: '',
    reference_id: '',
    cost_center_id: '',
    allocation_percentage: 100,
    allocation_amount: 0,
    notes: ''
  });

  const costCenterService = new CostCenterService();

  // جلب مراكز التكلفة
  const { data: costCenters } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => costCenterService.getAllCostCenters()
  });

  // جلب التوزيعات
  const { data: allocations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cost-center-allocations'],
    queryFn: () => costCenterService.getAllAllocations()
  });

  const referenceTypes = [
    { value: 'contract', label: 'عقد', icon: FileText },
    { value: 'employee', label: 'موظف', icon: Users },
    { value: 'vehicle', label: 'مركبة', icon: Car },
    { value: 'expense', label: 'مصروف', icon: TrendingUp }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await costCenterService.createAllocation(allocationData);
      toast.success('تم إنشاء توزيع التكلفة بنجاح');
      refetch(); // تحديث البيانات
      setShowAddForm(false);
      setAllocationData({
        reference_type: '',
        reference_id: '',
        cost_center_id: '',
        allocation_percentage: 100,
        allocation_amount: 0,
        notes: ''
      });
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      toast.error(error.message || 'فشل في إنشاء توزيع التكلفة');
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التوزيع؟')) {
      return;
    }

    try {
      await costCenterService.deleteAllocation(id);
      toast.success('تم حذف التوزيع بنجاح');
      refetch(); // تحديث البيانات
    } catch (error: any) {
      console.error('Error deleting allocation:', error);
      toast.error(error.message || 'فشل في حذف التوزيع');
    }
  };

  const getReferenceTypeLabel = (type: string) => {
    const typeObj = referenceTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getReferenceTypeIcon = (type: string) => {
    const typeObj = referenceTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : FileText;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between rtl-flex">
            <CardTitle className="flex items-center gap-2 rtl-flex">
              <TrendingUp className="h-5 w-5" />
              توزيع التكاليف على مراكز التكلفة
            </CardTitle>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="gap-2 rtl-flex">
                  <Plus className="h-4 w-4" />
                  إضافة توزيع جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="rtl-title">إضافة توزيع تكلفة جديد</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="rtl-label">نوع المرجع *</Label>
                      <Select 
                        value={allocationData.reference_type}
                        onValueChange={(value) => {
                          setAllocationData(prev => ({ ...prev, reference_type: value }));
                          setSelectedReferenceType(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المرجع" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2 rtl-flex">
                                  <Icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="rtl-label">مركز التكلفة *</Label>
                      <Select 
                        value={allocationData.cost_center_id}
                        onValueChange={(value) => setAllocationData(prev => ({ ...prev, cost_center_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مركز التكلفة" />
                        </SelectTrigger>
                        <SelectContent>
                          {costCenters?.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.cost_center_name} ({cc.cost_center_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="rtl-label">معرف المرجع *</Label>
                    <Input
                      value={allocationData.reference_id}
                      onChange={(e) => setAllocationData(prev => ({ ...prev, reference_id: e.target.value }))}
                      placeholder="معرف العنصر المراد توزيع تكلفته"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="rtl-label">نسبة التوزيع (%)</Label>
                      <Input
                        type="number"
                        value={allocationData.allocation_percentage}
                        onChange={(e) => setAllocationData(prev => ({ ...prev, allocation_percentage: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="rtl-label">مبلغ التوزيع (د.ك)</Label>
                      <Input
                        type="number"
                        value={allocationData.allocation_amount}
                        onChange={(e) => setAllocationData(prev => ({ ...prev, allocation_amount: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="rtl-label">ملاحظات</Label>
                    <Textarea
                      value={allocationData.notes}
                      onChange={(e) => setAllocationData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات حول التوزيع..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 rtl-flex">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">
                      إضافة التوزيع
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">
                {error instanceof Error ? error.message : 'حدث خطأ في جلب البيانات'}
              </p>
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع المرجع</TableHead>
                  <TableHead className="text-right">معرف المرجع</TableHead>
                  <TableHead className="text-right">مركز التكلفة</TableHead>
                  <TableHead className="text-right">النسبة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">تاريخ التوزيع</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      جاري تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد توزيعات تكلفة حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((allocation: any) => {
                    const Icon = getReferenceTypeIcon(allocation.reference_type);
                    return (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 rtl-flex">
                            <Icon className="h-4 w-4" />
                            <Badge variant="secondary">
                              {getReferenceTypeLabel(allocation.reference_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {allocation.reference_id}
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">
                              {allocation.cost_center?.cost_center_name || 'غير محدد'}
                            </div>
                            {allocation.cost_center?.cost_center_code && (
                              <div className="text-sm text-muted-foreground">
                                {allocation.cost_center.cost_center_code}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {allocation.allocation_percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {allocation.allocation_amount?.toLocaleString('ar-KW', {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3
                          })} د.ك
                        </TableCell>
                        <TableCell>
                          {allocation.allocation_date 
                            ? new Date(allocation.allocation_date).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'غير محدد'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 rtl-flex">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAllocation(allocation.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCenterAllocations;