import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Car, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { VehicleCostDialog } from './VehicleCostDialog';
import { toast } from 'sonner';

interface VehicleCost {
  id: string;
  vehicle_id: string;
  cost_type: string;
  amount: number;
  cost_date: string;
  description: string;
  invoice_number?: string;
  status: string;
  journal_entry_id?: string;
  vehicles?: {
    license_plate: string;
    make: string;
    model: string;
  };
}

export const VehicleCostManagement = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<VehicleCost | null>(null);
  const queryClient = useQueryClient();

  // جلب تكاليف المركبات
  const { data: vehicleCosts, isLoading } = useQuery({
    queryKey: ['vehicle-costs', selectedVehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_costs')
        .select(`
          *,
          vehicles (
            license_plate,
            make,
            model
          )
        `)
        .order('cost_date', { ascending: false });

      if (selectedVehicleId) {
        query = query.eq('vehicle_id', selectedVehicleId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as VehicleCost[];
    }
  });

  // جلب قائمة المركبات
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .neq('status', 'out_of_service')
        .order('license_plate');
      if (error) throw error;
      return data;
    }
  });

  // إنشاء قيد محاسبي
  const createJournalEntryMutation = useMutation({
    mutationFn: async (costId: string) => {
      const { data, error } = await supabase.rpc('create_vehicle_cost_journal_entry', {
        vehicle_cost_id: costId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-costs'] });
      toast.success('تم إنشاء القيد المحاسبي بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ في إنشاء القيد المحاسبي: ' + error.message);
    }
  });

  // حساب إجمالي التكاليف حسب النوع
  const costSummary = vehicleCosts?.reduce((acc, cost) => {
    acc[cost.cost_type] = (acc[cost.cost_type] || 0) + cost.amount;
    acc.total = (acc.total || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleEditCost = (cost: VehicleCost) => {
    setEditingCost(cost);
    setIsDialogOpen(true);
  };

  const handleCreateJournalEntry = (costId: string) => {
    createJournalEntryMutation.mutate(costId);
  };

  const getCostTypeLabel = (type: string) => {
    const labels = {
      fuel: 'وقود',
      maintenance: 'صيانة',
      insurance: 'تأمين',
      registration: 'تسجيل',
      depreciation: 'إهلاك',
      other: 'أخرى'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getCostTypeBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      fuel: 'default',
      maintenance: 'secondary',
      insurance: 'outline',
      registration: 'destructive',
      depreciation: 'default',
      other: 'secondary'
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة وأزرار التحكم */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة تكاليف المركبات</h2>
          <p className="text-muted-foreground">تتبع وإدارة جميع تكاليف المركبات مع التكامل المحاسبي</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedVehicleId || ''}
            onChange={(e) => setSelectedVehicleId(e.target.value || null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">جميع المركبات</option>
            {vehicles?.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة تكلفة
          </Button>
        </div>
      </div>

      {/* ملخص التكاليف */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
                <p className="text-xl font-bold">{(costSummary.total || 0).toFixed(3)} د.ك</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تكاليف الوقود</p>
                <p className="text-xl font-bold">{(costSummary.fuel || 0).toFixed(3)} د.ك</p>
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
                <p className="text-sm text-muted-foreground">تكاليف الصيانة</p>
                <p className="text-xl font-bold">{(costSummary.maintenance || 0).toFixed(3)} د.ك</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تكاليف التأمين</p>
                <p className="text-xl font-bold">{(costSummary.insurance || 0).toFixed(3)} د.ك</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول التكاليف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            سجل تكاليف المركبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">المركبة</th>
                    <th className="text-right p-3">نوع التكلفة</th>
                    <th className="text-right p-3">المبلغ</th>
                    <th className="text-right p-3">التاريخ</th>
                    <th className="text-right p-3">الوصف</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleCosts?.map((cost) => (
                    <tr key={cost.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {cost.vehicles ? (
                          <div>
                            <p className="font-medium">{cost.vehicles.license_plate}</p>
                            <p className="text-sm text-muted-foreground">
                              {cost.vehicles.make} {cost.vehicles.model}
                            </p>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={getCostTypeBadgeVariant(cost.cost_type)}>
                          {getCostTypeLabel(cost.cost_type)}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">{cost.amount.toFixed(3)} د.ك</td>
                      <td className="p-3">
                        {format(new Date(cost.cost_date), 'dd/MM/yyyy', { locale: ar })}
                      </td>
                      <td className="p-3">{cost.description}</td>
                      <td className="p-3">
                        <Badge variant={cost.journal_entry_id ? "default" : "secondary"}>
                          {cost.journal_entry_id ? "مرحل محاسبياً" : "غير مرحل"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCost(cost)}
                          >
                            تعديل
                          </Button>
                          {!cost.journal_entry_id && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCreateJournalEntry(cost.id)}
                              disabled={createJournalEntryMutation.isPending}
                            >
                              ترحيل محاسبي
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {vehicleCosts?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد تكاليف مسجلة
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleCostDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cost={editingCost}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCost(null);
        }}
      />
    </div>
  );
};