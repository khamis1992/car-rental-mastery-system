import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Play, CheckCircle, AlertCircle, Calendar } from "lucide-react";

// Dummy data for demonstration
const dummyMonthlyData = [
  {
    id: "1",
    vehicle: { license_plate: "123 أ ب ج", make: "تويوتا", model: "كامري" },
    monthly_depreciation: 125.5,
    book_value: 8750.0,
    is_processed: false
  },
  {
    id: "2",
    vehicle: { license_plate: "456 د ه و", make: "نيسان", model: "التيما" },
    monthly_depreciation: 98.0,
    book_value: 6860.0,
    is_processed: true
  },
  {
    id: "3",
    vehicle: { license_plate: "789 ز ح ط", make: "فورد", model: "إكسبلورر" },
    monthly_depreciation: 165.0,
    book_value: 11550.0,
    is_processed: false
  }
];

const availableMonths = [
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"
];

export function MonthlyProcessingSimple() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessMonth = async () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const unprocessedCount = dummyMonthlyData.filter(item => !item.is_processed).length;
      const totalAmount = dummyMonthlyData
        .filter(item => !item.is_processed)
        .reduce((sum, item) => sum + item.monthly_depreciation, 0);
      
      toast.success(
        `تم معالجة ${unprocessedCount} مركبة بإجمالي استهلاك ${totalAmount.toLocaleString()} د.ك`
      );
      setIsProcessing(false);
    }, 2000);
  };

  const unprocessedItems = dummyMonthlyData.filter(item => !item.is_processed);
  const processedItems = dummyMonthlyData.filter(item => item.is_processed);
  const totalUnprocessedAmount = unprocessedItems.reduce((sum, item) => sum + item.monthly_depreciation, 0);
  const totalAmount = dummyMonthlyData.reduce((sum, item) => sum + item.monthly_depreciation, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="اختر الشهر" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {format(new Date(month + "-01"), "MMMM yyyy", { locale: ar })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleProcessMonth}
          disabled={isProcessing || unprocessedItems.length === 0}
          className="mr-auto"
        >
          <Play className="h-4 w-4 mr-2" />
          {isProcessing ? "جارٍ المعالجة..." : "معالجة الشهر"}
        </Button>
      </div>

      {/* Processing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المركبات المعلقة</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {unprocessedItems.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المركبات المعالجة</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {processedItems.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>الاستهلاك المعلق</CardDescription>
            <CardTitle className="text-2xl">
              {totalUnprocessedAmount.toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي الاستهلاك</CardDescription>
            <CardTitle className="text-2xl">
              {totalAmount.toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alerts */}
      {unprocessedItems.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            يوجد {unprocessedItems.length} مركبة لم يتم معالجة استهلاكها لشهر {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: ar })}
          </AlertDescription>
        </Alert>
      )}

      {processedItems.length > 0 && unprocessedItems.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            تم معالجة جميع مركبات شهر {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: ar })} بنجاح
          </AlertDescription>
        </Alert>
      )}

      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تفاصيل شهر {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: ar })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyMonthlyData.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">
                      {item.vehicle.license_plate}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.vehicle.make} {item.vehicle.model}
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="font-medium">
                    {item.monthly_depreciation.toLocaleString()} د.ك
                  </div>
                  <div className="text-sm text-muted-foreground">
                    استهلاك شهري
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="font-medium">
                    {item.book_value.toLocaleString()} د.ك
                  </div>
                  <div className="text-sm text-muted-foreground">
                    القيمة الدفترية
                  </div>
                </div>
                
                <Badge variant={item.is_processed ? "secondary" : "default"}>
                  {item.is_processed ? "معالج" : "في الانتظار"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}