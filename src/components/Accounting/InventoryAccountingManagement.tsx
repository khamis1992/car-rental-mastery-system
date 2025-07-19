import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { InventoryItemDialog } from './InventoryItemDialog';
import { InventoryMovementDialog } from './InventoryMovementDialog';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  unit_cost: number;
  quantity_on_hand: number;
  total_value: number;
  reorder_level: number;
  account_id?: string;
  valuation_method: string;
  chart_of_accounts?: {
    account_name: string;
    account_code: string;
  };
}

interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  total_amount?: number;
  movement_date: string;
  description: string;
  inventory_accounting?: {
    item_name: string;
    item_code: string;
  };
}

export const InventoryAccountingManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // جلب بنود المخزون
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['inventory-items', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('inventory_accounting')
        .select(`
          *,
          chart_of_accounts (
            account_name,
            account_code
          )
        `)
        .order('item_name');

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  // جلب حركات المخزون الأخيرة
  const { data: recentMovements } = useQuery({
    queryKey: ['inventory-movements-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory_accounting (
            item_name,
            item_code
          )
        `)
        .order('movement_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as InventoryMovement[];
    }
  });

  // جلب الفئات
  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_accounting')
        .select('category')
        .order('category');
      if (error) throw error;
      return [...new Set(data.map(item => item.category))];
    }
  });

  // حساب إحصائيات المخزون
  const inventoryStats = React.useMemo(() => {
    if (!inventoryItems) return { totalValue: 0, totalItems: 0, lowStockItems: 0 };
    
    return {
      totalValue: inventoryItems.reduce((sum, item) => sum + item.total_value, 0),
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.quantity_on_hand <= item.reorder_level).length
    };
  }, [inventoryItems]);

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  };

  const handleAddMovement = (itemId: string) => {
    setSelectedItemForMovement(itemId);
    setIsMovementDialogOpen(true);
  };

  const getMovementTypeLabel = (type: string) => {
    const labels = {
      purchase: 'شراء',
      sale: 'بيع',
      transfer: 'تحويل',
      adjustment: 'تسوية',
      maintenance_issue: 'صرف صيانة'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementTypeBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      purchase: 'default',
      sale: 'destructive',
      transfer: 'outline',
      adjustment: 'secondary',
      maintenance_issue: 'destructive'
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة وأزرار التحكم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة المخزون المحاسبي</h2>
          <p className="text-muted-foreground">تتبع وإدارة المخزون مع التكامل المحاسبي الكامل</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">جميع الفئات</option>
            {categories?.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <Button 
            onClick={() => setIsItemDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة صنف
          </Button>
        </div>
      </div>

      {/* إحصائيات المخزون */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">قيمة المخزون الإجمالية</p>
                <p className="text-xl font-bold">{inventoryStats.totalValue.toFixed(3)} د.ك</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد الأصناف</p>
                <p className="text-xl font-bold">{inventoryStats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">أصناف منخفضة المخزون</p>
                <p className="text-xl font-bold text-orange-600">{inventoryStats.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط التكلفة</p>
                <p className="text-xl font-bold">
                  {inventoryStats.totalItems > 0 
                    ? (inventoryStats.totalValue / inventoryStats.totalItems).toFixed(3)
                    : '0.000'
                  } د.ك
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* جدول أصناف المخزون */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              أصناف المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">الكود</th>
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">الكمية</th>
                      <th className="text-right p-2">القيمة</th>
                      <th className="text-right p-2">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems?.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{item.item_code}</td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                            {item.quantity_on_hand <= item.reorder_level && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                مخزون منخفض
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{item.quantity_on_hand}</td>
                        <td className="p-2 font-medium">{item.total_value.toFixed(3)} د.ك</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="text-xs"
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAddMovement(item.id)}
                              className="text-xs"
                            >
                              حركة
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {inventoryItems?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أصناف مخزون
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* حركات المخزون الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              الحركات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements?.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getMovementTypeBadgeVariant(movement.movement_type)}>
                        {getMovementTypeLabel(movement.movement_type)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {movement.inventory_accounting?.item_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movement.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {movement.total_amount?.toFixed(3) || '0.000'} د.ك
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.movement_date).toLocaleDateString('ar-KW')}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد حركات مخزون
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <InventoryItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={editingItem}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingItem(null);
        }}
      />

      <InventoryMovementDialog
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
        itemId={selectedItemForMovement}
        onClose={() => {
          setIsMovementDialogOpen(false);
          setSelectedItemForMovement(null);
        }}
      />
    </div>
  );
};