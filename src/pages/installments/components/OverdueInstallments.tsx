import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, DollarSign, Eye, CreditCard, Clock } from "lucide-react";
import { installmentService } from "@/services/installmentService";
import { useToast } from "@/hooks/use-toast";

interface OverdueInstallment {
  id: string;
  installment_number: number;
  due_date: string;
  total_amount: number;
  remaining_amount: number;
  days_overdue: number;
  penalty_amount: number;
  installment_plan: {
    plan_name: string;
    supplier_name: string;
    plan_number: string;
  };
}

interface Props {
  refreshKey: number;
  onRefresh: () => void;
}

export function OverdueInstallments({ refreshKey, onRefresh }: Props) {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<OverdueInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverdueInstallments();
  }, [refreshKey]);

  const loadOverdueInstallments = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getOverdueInstallments();
      setInstallments(data || []);
    } catch (error) {
      console.error("Error loading overdue installments:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الأقساط المتأخرة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOverdueSeverity = (daysOverdue: number) => {
    if (daysOverdue > 90) {
      return { label: "حرج جداً", variant: "destructive" as const, color: "text-red-600" };
    } else if (daysOverdue > 30) {
      return { label: "حرج", variant: "destructive" as const, color: "text-red-500" };
    } else if (daysOverdue > 7) {
      return { label: "متأخر", variant: "outline" as const, color: "text-orange-500" };
    } else {
      return { label: "تأخير طفيف", variant: "secondary" as const, color: "text-yellow-500" };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الأقساط المتأخرة</CardTitle>
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
        <CardTitle className="rtl-title rtl-flex">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          الأقساط المتأخرة
        </CardTitle>
        <CardDescription>
          جميع الأقساط المتأخرة عن موعد الاستحقاق
        </CardDescription>
      </CardHeader>
      <CardContent>
        {installments.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد أقساط متأخرة</p>
            <p className="text-sm text-muted-foreground">جميع الأقساط مدفوعة في موعدها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* إحصائيات سريعة */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">إجمالي المتأخرات</span>
                </div>
                <div className="text-lg font-bold text-red-600 mt-1">
                  {installments.reduce((sum, i) => sum + (i.remaining_amount || 0), 0).toFixed(3)} د.ك
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">متوسط التأخير</span>
                </div>
                <div className="text-lg font-bold text-orange-600 mt-1">
                  {installments.length > 0 
                    ? Math.round(installments.reduce((sum, i) => sum + (i.days_overdue || 0), 0) / installments.length)
                    : 0} يوم
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">الغرامات المحتملة</span>
                </div>
                <div className="text-lg font-bold text-yellow-600 mt-1">
                  {installments.reduce((sum, i) => sum + (i.penalty_amount || 0), 0).toFixed(3)} د.ك
                </div>
              </div>
            </div>

            {/* جدول الأقساط المتأخرة */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم القسط</TableHead>
                    <TableHead className="text-right">خطة الأقساط</TableHead>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-right">المبلغ المتبقي</TableHead>
                    <TableHead className="text-right">أيام التأخير</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment) => {
                    const severity = getOverdueSeverity(installment.days_overdue);
                    return (
                      <TableRow key={installment.id} className="border-l-4 border-l-red-500">
                        <TableCell className="font-medium">
                          #{installment.installment_number}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{installment.installment_plan?.plan_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {installment.installment_plan?.plan_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{installment.installment_plan?.supplier_name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{new Date(installment.due_date).toLocaleDateString('ar-KW')}</div>
                            <div className="text-sm text-red-600">
                              متأخر {installment.days_overdue} يوم
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="rtl-flex">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {installment.remaining_amount?.toFixed(3)} د.ك
                            </div>
                            {installment.penalty_amount > 0 && (
                              <div className="text-sm text-red-600">
                                + {installment.penalty_amount?.toFixed(3)} د.ك غرامة
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${severity.color}`}>
                            {installment.days_overdue} يوم
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severity.variant}>{severity.label}</Badge>
                        </TableCell>
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
                              variant="destructive"
                              size="sm"
                              className="rtl-flex"
                            >
                              <CreditCard className="h-4 w-4" />
                              دفع عاجل
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}