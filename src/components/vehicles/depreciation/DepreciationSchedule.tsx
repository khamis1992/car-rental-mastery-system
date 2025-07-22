import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RefreshCw } from "lucide-react";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
}

interface DepreciationScheduleItem {
  id: string;
  vehicle_id: string;
  depreciation_date: string;
  monthly_depreciation: number;
  accumulated_depreciation: number;
  book_value: number;
  is_processed: boolean;
  vehicle?: Vehicle;
}

export function DepreciationSchedule() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, year")
        .eq("is_active", true)
        .order("license_plate");
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  // Fetch depreciation schedule
  const { data: scheduleData = [], isLoading } = useQuery({
    queryKey: ["depreciation-schedule", selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_depreciation_schedule")
        .select(`
          *,
          vehicles:vehicle_id (
            id,
            license_plate,
            make,
            model,
            year
          )
        `)
        .order("depreciation_date", { ascending: false });

      if (selectedVehicle !== "all") {
        query = query.eq("vehicle_id", selectedVehicle);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DepreciationScheduleItem[];
    },
  });

  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { data, error } = await supabase.rpc(
        "generate_vehicle_depreciation_schedule",
        { vehicle_id_param: vehicleId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`تم إنشاء ${data} سجل للجدولة`);
      queryClient.invalidateQueries({ queryKey: ["depreciation-schedule"] });
    },
    onError: (error) => {
      toast.error("خطأ في إنشاء الجدولة: " + error.message);
    },
  });

  const handleGenerateSchedule = (vehicleId?: string) => {
    const targetVehicle = vehicleId || selectedVehicle;
    if (targetVehicle === "all") {
      vehicles.forEach((vehicle) => {
        generateScheduleMutation.mutate(vehicle.id);
      });
    } else {
      generateScheduleMutation.mutate(targetVehicle);
    }
  };

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
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateSchedule()}
            disabled={generateScheduleMutation.isPending}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            إنشاء الجدولة
          </Button>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["depreciation-schedule"] })}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المركبات</CardDescription>
            <CardTitle className="text-2xl">
              {vehicles.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>الاستهلاك الشهري</CardDescription>
            <CardTitle className="text-2xl">
              {scheduleData
                .filter(item => !item.is_processed && new Date(item.depreciation_date).getMonth() === new Date().getMonth())
                .reduce((sum, item) => sum + item.monthly_depreciation, 0)
                .toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>الاستهلاك المتراكم</CardDescription>
            <CardTitle className="text-2xl">
              {scheduleData
                .reduce((sum, item) => Math.max(sum, item.accumulated_depreciation), 0)
                .toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>القيمة الدفترية</CardDescription>
            <CardTitle className="text-2xl">
              {scheduleData
                .reduce((sum, item) => sum + item.book_value, 0)
                .toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>جدولة الاستهلاك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المركبة</TableHead>
                  <TableHead>تاريخ الاستهلاك</TableHead>
                  <TableHead>الاستهلاك الشهري</TableHead>
                  <TableHead>الاستهلاك المتراكم</TableHead>
                  <TableHead>القيمة الدفترية</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : scheduleData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      لا توجد بيانات جدولة
                    </TableCell>
                  </TableRow>
                ) : (
                  scheduleData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.vehicle?.license_plate}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.vehicle?.make} {item.vehicle?.model}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.depreciation_date), "MMMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {item.monthly_depreciation.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        {item.accumulated_depreciation.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        {item.book_value.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_processed ? "secondary" : "default"}>
                          {item.is_processed ? "معالج" : "في الانتظار"}
                        </Badge>
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