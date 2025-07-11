import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { installmentService } from "@/services/installmentService";
import { useToast } from "@/hooks/use-toast";

interface InstallmentPlan {
  id: string;
  plan_number: string;
  plan_name: string;
  supplier_name: string;
  total_amount: number;
  remaining_amount: number;
  number_of_installments: number;
  status: string;
  first_installment_date: string;
  last_installment_date: string;
  created_at: string;
}

interface Props {
  refreshKey: number;
  onRefresh: () => void;
}

export function InstallmentPlansList({ refreshKey, onRefresh }: Props) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, [refreshKey]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getInstallmentPlans();
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل خطط الأقساط",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "نشطة", variant: "default" as const },
      completed: { label: "مكتملة", variant: "secondary" as const },
      cancelled: { label: "ملغية", variant: "destructive" as const },
      suspended: { label: "معلقة", variant: "outline" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>خطط الأقساط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title">خطط الأقساط</CardTitle>
        <CardDescription>
          قائمة بجميع خطط الأقساط النشطة والمكتملة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد خطط أقساط حالياً</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الخطة</TableHead>
                  <TableHead className="text-right">اسم الخطة</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                  <TableHead className="text-right">المبلغ المتبقي</TableHead>
                  <TableHead className="text-right">عدد الأقساط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.plan_number}</TableCell>
                    <TableCell>{plan.plan_name}</TableCell>
                    <TableCell>{plan.supplier_name}</TableCell>
                    <TableCell>
                      <div className="rtl-flex">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {plan.total_amount?.toFixed(3)} د.ك
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="rtl-flex">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {plan.remaining_amount?.toFixed(3)} د.ك
                      </div>
                    </TableCell>
                    <TableCell>{plan.number_of_installments}</TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}