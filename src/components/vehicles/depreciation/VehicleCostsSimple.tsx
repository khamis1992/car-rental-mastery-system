import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";

// Dummy data for demonstration
const dummyVehicles = [
  { id: "1", license_plate: "123 أ ب ج", make: "تويوتا", model: "كامري" },
  { id: "2", license_plate: "456 د ه و", make: "نيسان", model: "التيما" },
];

const dummyCosts = [
  {
    id: "1",
    vehicle_id: "1",
    cost_date: "2024-01-15",
    cost_type: "fuel",
    amount: 45.500,
    description: "تعبئة وقود كاملة",
    invoice_number: "INV-001",
    odometer_reading: 25000,
    vehicles: { license_plate: "123 أ ب ج", make: "تويوتا", model: "كامري" }
  },
  {
    id: "2", 
    vehicle_id: "1",
    cost_date: "2024-01-20",
    cost_type: "maintenance",
    amount: 120.000,
    description: "تغيير زيت وفلتر",
    invoice_number: "INV-002",
    odometer_reading: 25200,
    vehicles: { license_plate: "123 أ ب ج", make: "تويوتا", model: "كامري" }
  },
  {
    id: "3",
    vehicle_id: "2", 
    cost_date: "2024-01-18",
    cost_type: "insurance",
    amount: 300.000,
    description: "قسط التأمين الشهري",
    invoice_number: "INS-001",
    vehicles: { license_plate: "456 د ه و", make: "نيسان", model: "التيما" }
  }
];

const costTypes = [
  { value: "fuel", label: "وقود" },
  { value: "maintenance", label: "صيانة" },
  { value: "insurance", label: "تأمين" },
  { value: "registration", label: "تسجيل" },
  { value: "repairs", label: "إصلاحات" },
  { value: "other", label: "أخرى" },
];

export function VehicleCostsSimple() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedCostType, setSelectedCostType] = useState<string>("all");

  const getCostTypeLabel = (type: string) => {
    return costTypes.find(ct => ct.value === type)?.label || type;
  };

  const filteredCosts = dummyCosts.filter(cost => {
    if (selectedVehicle !== "all" && cost.vehicle_id !== selectedVehicle) return false;
    if (selectedCostType !== "all" && cost.cost_type !== selectedCostType) return false;
    return true;
  });

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
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
              {dummyVehicles.map((vehicle) => (
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

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          إضافة تكلفة
        </Button>
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
              {filteredCosts.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>متوسط التكلفة</CardDescription>
            <CardTitle className="text-2xl">
              {filteredCosts.length > 0 ? (totalCosts / filteredCosts.length).toLocaleString() : 0} د.ك
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
                {filteredCosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      لا توجد تكاليف مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCosts.map((cost) => (
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
                        {formatDate(cost.cost_date)}
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