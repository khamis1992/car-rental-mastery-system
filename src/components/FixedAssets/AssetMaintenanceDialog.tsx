import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceFormData {
  asset_id: string;
  maintenance_type: string;
  scheduled_date: Date;
  performed_by?: string;
  external_provider?: string;
  cost: number;
  description: string;
  parts_replaced: string[];
  hours_spent: number;
  priority: string;
  warranty_work: boolean;
  notes?: string;
}

interface AssetMaintenanceDialogProps {
  assetId: string;
  assetName: string;
  trigger?: React.ReactNode;
}

export function AssetMaintenanceDialog({ assetId, assetName, trigger }: AssetMaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    asset_id: assetId,
    maintenance_type: "preventive",
    scheduled_date: new Date(),
    cost: 0,
    description: "",
    parts_replaced: [],
    hours_spent: 0,
    priority: "medium",
    warranty_work: false,
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data?.map(emp => ({
        ...emp,
        full_name: `${emp.first_name} ${emp.last_name}`
      }));
    }
  });

  // Fetch existing maintenance records
  const { data: maintenanceHistory } = useQuery({
    queryKey: ['asset-maintenance', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_maintenance')
        .select(`
          *,
          performed_by_employee:employees!asset_maintenance_performed_by_fkey(first_name, last_name)
        `)
        .eq('asset_id', assetId)
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      return data?.map(maintenance => ({
        ...maintenance,
        performed_by_employee: maintenance.performed_by_employee ? {
          ...maintenance.performed_by_employee,
          full_name: `${maintenance.performed_by_employee.first_name} ${maintenance.performed_by_employee.last_name}`
        } : null
      }));
    }
  });

  const saveMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const maintenanceData = {
        ...data,
        scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
        status: 'scheduled',
        tenant_id: 'default-tenant'
      };

      const { data: newMaintenance, error } = await supabase
        .from('asset_maintenance')
        .insert(maintenanceData)
        .select()
        .single();
      
      if (error) throw error;
      return newMaintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance', assetId] });
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم جدولة الصيانة بنجاح"
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الصيانة",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMaintenanceMutation.mutate(formData);
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types = {
      preventive: "وقائية",
      corrective: "تصحيحية",
      emergency: "طارئة",
      routine: "دورية"
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'scheduled': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            صيانة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            صيانة الأصل: {assetName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">جدولة صيانة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_type" className="text-right">نوع الصيانة</Label>
                    <Select value={formData.maintenance_type} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_type: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر نوع الصيانة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">وقائية</SelectItem>
                        <SelectItem value="corrective">تصحيحية</SelectItem>
                        <SelectItem value="emergency">طارئة</SelectItem>
                        <SelectItem value="routine">دورية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-right">الأولوية</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="critical">حرجة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date" className="text-right">تاريخ الصيانة المجدولة</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-right">
                        {formData.scheduled_date ? format(formData.scheduled_date, 'yyyy/MM/dd') : "اختر التاريخ"}
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduled_date: date }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right">وصف الصيانة</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف الأعمال المطلوبة"
                    className="text-right"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="performed_by" className="text-right">المسؤول عن الصيانة</Label>
                    <Select value={formData.performed_by || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, performed_by: value || undefined }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">غير محدد</SelectItem>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="external_provider" className="text-right">مقدم الخدمة الخارجي</Label>
                    <Input
                      id="external_provider"
                      value={formData.external_provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, external_provider: e.target.value }))}
                      placeholder="اسم الشركة أو المقدم"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-right">التكلفة المتوقعة (د.ك)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.000"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours_spent" className="text-right">الساعات المتوقعة</Label>
                    <Input
                      id="hours_spent"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.hours_spent}
                      onChange={(e) => setFormData(prev => ({ ...prev, hours_spent: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="أي ملاحظات إضافية"
                    className="text-right"
                    rows={2}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMaintenanceMutation.isPending}
                    className="px-8"
                  >
                    {saveMaintenanceMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* History Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Clock className="h-5 w-5" />
                تاريخ الصيانة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {maintenanceHistory?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد سجلات صيانة سابقة
                  </p>
                ) : (
                  maintenanceHistory?.map((maintenance) => (
                    <div key={maintenance.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(maintenance.priority)}
                            <span className="font-medium text-sm">
                              {getMaintenanceTypeLabel(maintenance.maintenance_type)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(maintenance.scheduled_date), 'yyyy/MM/dd')}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(maintenance.status)}>
                          {maintenance.status === 'scheduled' && 'مجدولة'}
                          {maintenance.status === 'in_progress' && 'قيد التنفيذ'}
                          {maintenance.status === 'completed' && 'مكتملة'}
                          {maintenance.status === 'cancelled' && 'ملغية'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-right">{maintenance.description}</p>
                      
                      {maintenance.cost > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                          التكلفة: {maintenance.cost.toFixed(3)} د.ك
                        </p>
                      )}
                      
                      {maintenance.performed_by_employee && (
                        <p className="text-xs text-muted-foreground text-right">
                          المسؤول: {maintenance.performed_by_employee.full_name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}