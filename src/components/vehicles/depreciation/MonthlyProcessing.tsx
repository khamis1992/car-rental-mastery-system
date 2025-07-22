import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Play, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface ProcessingResult {
  success: boolean;
  processed_vehicles: number;
  total_depreciation: number;
  entries_created: number;
  target_month: string;
}

export function MonthlyProcessing() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();

  // Get available months for processing
  const { data: availableMonths = [] } = useQuery({
    queryKey: ["available-processing-months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_depreciation_schedule")
        .select("depreciation_date")
        .eq("is_processed", false)
        .order("depreciation_date");
      
      if (error) throw error;
      
      const months = Array.from(
        new Set(
          data.map(item => format(new Date(item.depreciation_date), "yyyy-MM"))
        )
      );
      
      return months;
    },
  });

  // Get monthly summary
  const { data: monthlySummary } = useQuery({
    queryKey: ["monthly-summary", selectedMonth],
    queryFn: async () => {
      const startDate = startOfMonth(new Date(selectedMonth + "-01"));
      const endDate = endOfMonth(startDate);
      
      const { data, error } = await supabase
        .from("vehicle_depreciation_schedule")
        .select(`
          *,
          vehicles:vehicle_id (
            license_plate,
            make,
            model
          )
        `)
        .gte("depreciation_date", format(startDate, "yyyy-MM-dd"))
        .lte("depreciation_date", format(endDate, "yyyy-MM-dd"))
        .order("depreciation_date");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMonth,
  });

  // Process monthly depreciation
  const processMonthMutation = useMutation({
    mutationFn: async (targetMonth: string) => {
      const { data, error } = await supabase.rpc(
        "process_monthly_depreciation",
        { target_month: new Date(targetMonth + "-01").toISOString().split('T')[0] }
      );
      if (error) throw error;
      return data as ProcessingResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `تم معالجة ${result.processed_vehicles} مركبة بإجمالي استهلاك ${result.total_depreciation.toLocaleString()} د.ك`
        );
        queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
        queryClient.invalidateQueries({ queryKey: ["available-processing-months"] });
      } else {
        toast.error("فشل في معالجة الاستهلاك الشهري");
      }
    },
    onError: (error) => {
      toast.error("خطأ في المعالجة: " + error.message);
    },
  });

  const handleProcessMonth = () => {
    if (!selectedMonth) return;
    processMonthMutation.mutate(selectedMonth);
  };

  const unprocessedItems = monthlySummary?.filter(item => !item.is_processed) || [];
  const processedItems = monthlySummary?.filter(item => item.is_processed) || [];
  const totalUnprocessedAmount = unprocessedItems.reduce((sum, item) => sum + item.monthly_depreciation, 0);

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
          disabled={!selectedMonth || processMonthMutation.isPending || unprocessedItems.length === 0}
          className="mr-auto"
        >
          <Play className="h-4 w-4 mr-2" />
          معالجة الشهر
        </Button>
      </div>

      {/* Processing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المركبات المعلقة</CardDescription>
            <CardTitle className="text-2xl text-warning">
              {unprocessedItems.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المركبات المعالجة</CardDescription>
            <CardTitle className="text-2xl text-success">
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
              {monthlySummary?.reduce((sum, item) => sum + item.monthly_depreciation, 0).toLocaleString() || 0} د.ك
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
      {monthlySummary && monthlySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تفاصيل شهر {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: ar })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlySummary.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {item.vehicles?.license_plate}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.vehicles?.make} {item.vehicles?.model}
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
      )}
    </div>
  );
}