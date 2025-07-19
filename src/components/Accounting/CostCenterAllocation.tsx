import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CostCenterService, CostCenter } from '@/services/BusinessServices/CostCenterService';

interface CostCenterAllocationItem {
  id: string;
  cost_center_id: string;
  cost_center_name?: string;
  allocation_percentage?: number;
  allocation_amount?: number;
  notes?: string;
}

interface CostCenterAllocationProps {
  allocations: CostCenterAllocationItem[];
  onAllocationsChange: (allocations: CostCenterAllocationItem[]) => void;
  totalAmount: number;
  disabled?: boolean;
  mode?: 'percentage' | 'amount' | 'both';
}

export const CostCenterAllocation: React.FC<CostCenterAllocationProps> = ({
  allocations,
  onAllocationsChange,
  totalAmount,
  disabled = false,
  mode = 'both'
}) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const costCenterService = new CostCenterService();

  useEffect(() => {
    loadCostCenters();
  }, []);

  const loadCostCenters = async () => {
    try {
      const data = await costCenterService.getAllCostCenters();
      setCostCenters(data.filter(cc => cc.is_active));
    } catch (error) {
      console.error('Error loading cost centers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل مراكز التكلفة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAllocation = () => {
    const newAllocation: CostCenterAllocationItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      cost_center_id: '',
      allocation_percentage: mode === 'amount' ? undefined : 0,
      allocation_amount: mode === 'percentage' ? undefined : 0,
      notes: ''
    };
    onAllocationsChange([...allocations, newAllocation]);
  };

  const removeAllocation = (id: string) => {
    const updatedAllocations = allocations.filter(alloc => alloc.id !== id);
    onAllocationsChange(updatedAllocations);
  };

  const updateAllocation = (id: string, field: keyof CostCenterAllocationItem, value: any) => {
    const updatedAllocations = allocations.map(alloc => {
      if (alloc.id === id) {
        const updated = { ...alloc, [field]: value };
        
        // Update cost center name when cost center is selected
        if (field === 'cost_center_id') {
          const selectedCostCenter = costCenters.find(cc => cc.id === value);
          updated.cost_center_name = selectedCostCenter?.cost_center_name;
        }
        
        // Auto-calculate percentage from amount or vice versa
        if (mode === 'both' && totalAmount > 0) {
          if (field === 'allocation_amount' && value) {
            updated.allocation_percentage = (Number(value) / totalAmount) * 100;
          } else if (field === 'allocation_percentage' && value) {
            updated.allocation_amount = (Number(value) / 100) * totalAmount;
          }
        }
        
        return updated;
      }
      return alloc;
    });
    onAllocationsChange(updatedAllocations);
  };

  const distributeEqually = () => {
    if (allocations.length === 0) return;
    
    const percentagePerAllocation = 100 / allocations.length;
    const amountPerAllocation = totalAmount / allocations.length;
    
    const updatedAllocations = allocations.map(alloc => ({
      ...alloc,
      allocation_percentage: mode === 'amount' ? undefined : percentagePerAllocation,
      allocation_amount: mode === 'percentage' ? undefined : amountPerAllocation
    }));
    
    onAllocationsChange(updatedAllocations);
    
    toast({
      title: 'تم بنجاح',
      description: 'تم توزيع المبالغ بالتساوي على مراكز التكلفة',
    });
  };

  const getTotalPercentage = () => {
    return allocations.reduce((sum, alloc) => sum + (alloc.allocation_percentage || 0), 0);
  };

  const getTotalAmount = () => {
    return allocations.reduce((sum, alloc) => sum + (alloc.allocation_amount || 0), 0);
  };

  const getValidationStatus = () => {
    const totalPercentage = getTotalPercentage();
    const totalAllocatedAmount = getTotalAmount();
    
    if (mode === 'percentage' || mode === 'both') {
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return {
          isValid: false,
          message: `إجمالي النسب: ${totalPercentage.toFixed(2)}% (يجب أن يساوي 100%)`
        };
      }
    }
    
    if (mode === 'amount' || mode === 'both') {
      if (Math.abs(totalAllocatedAmount - totalAmount) > 0.01) {
        return {
          isValid: false,
          message: `إجمالي المبالغ: ${totalAllocatedAmount.toFixed(3)} د.ك (يجب أن يساوي ${totalAmount.toFixed(3)} د.ك)`
        };
      }
    }
    
    return { isValid: true, message: 'التوزيع صحيح' };
  };

  const validation = getValidationStatus();

  if (loading) {
    return <div className="text-center py-4">جاري تحميل مراكز التكلفة...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg rtl-title">توزيع مراكز التكلفة</CardTitle>
          <div className="flex items-center gap-2">
            {allocations.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEqually}
                disabled={disabled}
              >
                <Calculator className="w-4 h-4" />
                توزيع متساو
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAllocation}
              disabled={disabled}
            >
              <Plus className="w-4 h-4" />
              إضافة مركز تكلفة
            </Button>
          </div>
        </div>
        
        {/* Validation Status */}
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✓ {validation.message}
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validation.message}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {allocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لم يتم إضافة أي مراكز تكلفة</p>
            <p className="text-sm">انقر على "إضافة مركز تكلفة" للبدء</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allocations.map((allocation, index) => (
              <Card key={allocation.id} className="p-4 border-l-4 border-l-primary">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">مركز التكلفة #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllocation(allocation.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Cost Center Selection */}
                    <div className="space-y-2">
                      <Label>مركز التكلفة</Label>
                      <Select
                        value={allocation.cost_center_id}
                        onValueChange={(value) => updateAllocation(allocation.id, 'cost_center_id', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مركز التكلفة" />
                        </SelectTrigger>
                        <SelectContent>
                          {costCenters.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.cost_center_name} ({cc.cost_center_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Percentage Input */}
                    {(mode === 'percentage' || mode === 'both') && (
                      <div className="space-y-2">
                        <Label>النسبة المئوية (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={allocation.allocation_percentage || ''}
                          onChange={(e) => updateAllocation(allocation.id, 'allocation_percentage', Number(e.target.value))}
                          disabled={disabled}
                          className="text-right"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    
                    {/* Amount Input */}
                    {(mode === 'amount' || mode === 'both') && (
                      <div className="space-y-2">
                        <Label>المبلغ (د.ك)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={allocation.allocation_amount || ''}
                          onChange={(e) => updateAllocation(allocation.id, 'allocation_amount', Number(e.target.value))}
                          disabled={disabled}
                          className="text-right"
                          placeholder="0.000"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>ملاحظات (اختياري)</Label>
                    <Textarea
                      value={allocation.notes || ''}
                      onChange={(e) => updateAllocation(allocation.id, 'notes', e.target.value)}
                      disabled={disabled}
                      className="text-right min-h-[60px]"
                      placeholder="ملاحظات حول التوزيع..."
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Summary */}
        {allocations.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">عدد مراكز التكلفة:</span>
                  <span className="font-medium mr-2">{allocations.length}</span>
                </div>
                {(mode === 'percentage' || mode === 'both') && (
                  <div>
                    <span className="text-muted-foreground">إجمالي النسب:</span>
                    <span className={`font-medium mr-2 ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalPercentage().toFixed(2)}%
                    </span>
                  </div>
                )}
                {(mode === 'amount' || mode === 'both') && (
                  <div>
                    <span className="text-muted-foreground">إجمالي المبالغ:</span>
                    <span className={`font-medium mr-2 ${Math.abs(getTotalAmount() - totalAmount) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalAmount().toFixed(3)} د.ك
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};