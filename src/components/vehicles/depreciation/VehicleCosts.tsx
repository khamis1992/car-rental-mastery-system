import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus, Edit, Trash2, FileText } from "lucide-react";

interface VehicleCost {
  id: string;
  vehicle_id: string;
  cost_date: string;
  cost_type: string;
  amount: number;
  description: string;
  supplier_id?: string;
  invoice_number?: string;
  odometer_reading?: number;
  is_recurring: boolean;
  recurring_frequency?: string;
  vehicles?: {
    license_plate: string;
    make: string;
    model: string;
  };
}

interface NewCostForm {
  vehicle_id: string;
  cost_date: string;
  cost_type: string;
  amount: number;
  description: string;
  invoice_number?: string;
  odometer_reading?: number;
  is_recurring: boolean;
  recurring_frequency?: string;
}

const costTypes = [
  { value: "fuel", label: "وقود" },
  { value: "maintenance", label: "صيانة" },
  { value: "insurance", label: "تأمين" },
  { value: "registration", label: "تسجيل" },
  { value: "repairs", label: "إصلاحات" },
  { value: "other", label: "أخرى" },
];

const recurringFrequencies = [
  { value: "monthly", label: "شهري" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "annually", label: "سنوي" },
];

export function VehicleCosts() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedCostType, setSelectedCostType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState<NewCostForm>({
    vehicle_id: "",
    cost_date: format(new Date(), "yyyy-MM-dd"),
    cost_type: "fuel",
    amount: 0,
    description: "",
    invoice_number: "",
    odometer_reading: undefined,
    is_recurring: false,
    recurring_frequency: undefined,
  });

  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model")
        .eq("is_active", true)
        .order("license_plate");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicle costs
  const { data: costsData = [], isLoading } = useQuery({
    queryKey: ["vehicle-costs", selectedVehicle, selectedCostType],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_costs")
        .select(`
          *,
          vehicles:vehicle_id (
            license_plate,
            make,
            model
          )
        `)
        .order("cost_date", { ascending: false });

      if (selectedVehicle !== "all") {
        query = query.eq("vehicle_id", selectedVehicle);
      }

      if (selectedCostType !== "all") {
        query = query.eq("cost_type", selectedCostType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VehicleCost[];
    },
  });

  // Add cost mutation
  const addCostMutation = useMutation({
    mutationFn: async (costData: NewCostForm) => {
      const { data, error } = await supabase
        .from("vehicle_costs")
        .insert([costData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم إضافة التكلفة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["vehicle-costs"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("خطأ في إضافة التكلفة: " + error.message);
    },
  });

  const resetForm = () => {
    setNewCost({
      vehicle_id: "",
      cost_date: format(new Date(), "yyyy-MM-dd"),
      cost_type: "fuel",
      amount: 0,
      description: "",
      invoice_number: "",
      odometer_reading: undefined,
      is_recurring: false,
      recurring_frequency: undefined,
    });
  };

  const handleAddCost = () => {
    if (!newCost.vehicle_id || !newCost.description || newCost.amount <= 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    addCostMutation.mutate(newCost);
  };

  const getCostTypeLabel = (type: string) => {
    return costTypes.find(ct => ct.value === type)?.label || type;
  };

  const totalCosts = costsData.reduce((sum, cost) => sum + cost.amount, 0);
  const costsByType = costTypes.map(type => ({
    type: type.label,
    amount: costsData.filter(cost => cost.cost_type === type.value).reduce((sum, cost) => sum + cost.amount, 0)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="اختر المركبة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المركبات</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCostType} onValueChange={setSelectedCostType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="نوع التكلفة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {costTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة تكلفة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة تكلفة جديدة</DialogTitle>
              <DialogDescription>
                أضف تكلفة جديدة للمركبة
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">المركبة *</Label>
                <Select value={newCost.vehicle_id} onValueChange={(value) => setNewCost(prev => ({ ...prev, vehicle_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_type">نوع التكلفة *</Label>
                <Select value={newCost.cost_type} onValueChange={(value) => setNewCost(prev => ({ ...prev, cost_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {costTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_date">التاريخ *</Label>
                <Input
                  type="date"
                  value={newCost.cost_date}
                  onChange={(e) => setNewCost(prev => ({ ...prev, cost_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ (د.ك) *</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={newCost.amount}
                  onChange={(e) => setNewCost(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_number">رقم الفاتورة</Label>
                <Input
                  value={newCost.invoice_number}
                  onChange={(e) => setNewCost(prev => ({ ...prev, invoice_number: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometer_reading">قراءة العداد</Label>
                <Input
                  type="number"
                  value={newCost.odometer_reading || ""}
                  onChange={(e) => setNewCost(prev => ({ ...prev, odometer_reading: parseInt(e.target.value) || undefined }))}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">الوصف *</Label>
                <Textarea
                  value={newCost.description}
                  onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddCost} disabled={addCostMutation.isPending}>
                إضافة التكلفة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي التكاليف</CardDescription>
            <CardTitle className="text-2xl">
              {totalCosts.toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>عدد التكاليف</CardDescription>
            <CardTitle className="text-2xl">
              {costsData.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>متوسط التكلفة</CardDescription>
            <CardTitle className="text-2xl">
              {costsData.length > 0 ? (totalCosts / costsData.length).toLocaleString() : 0} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>تكاليف المركبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المركبة</TableHead>
                  <TableHead>نوع التكلفة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العداد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : costsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      لا توجد تكاليف مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  costsData.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {cost.vehicles?.license_plate}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cost.vehicles?.make} {cost.vehicles?.model}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCostTypeLabel(cost.cost_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(cost.cost_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {cost.amount.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {cost.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cost.invoice_number && (
                          <Badge variant="secondary">
                            <FileText className="h-3 w-3 mr-1" />
                            {cost.invoice_number}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cost.odometer_reading?.toLocaleString() || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}