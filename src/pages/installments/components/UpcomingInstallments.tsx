import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Eye, CreditCard } from "lucide-react";
import { installmentService } from "@/services/installmentService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface UpcomingInstallment {
  id: string;
  installment_number: number;
  due_date: string;
  total_amount: number;
  remaining_amount: number;
  status: string;
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

export function UpcomingInstallments({ refreshKey, onRefresh }: Props) {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<UpcomingInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingInstallments();
  }, [refreshKey]);

  const loadUpcomingInstallments = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getUpcomingInstallments(30);
      setInstallments(data || []);
    } catch (error) {
      console.error("Error loading upcoming installments:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الأقساط القادمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDueDateBadge = (dueDate: string) => {
    const date = parseISO(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return <Badge variant="destructive">عاجل ({diffDays} أيام)</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="outline">قريب ({diffDays} أيام)</Badge>;
    } else {
      return <Badge variant="secondary">{diffDays} يوم</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الأقساط القادمة</CardTitle>
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
        <CardTitle className="rtl-title">الأقساط القادمة</CardTitle>
        <CardDescription>
          الأقساط المستحقة خلال الـ 30 يوم القادمة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {installments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد أقساط مستحقة قريباً</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم القسط</TableHead>
                  <TableHead className="text-right">خطة الأقساط</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => (
                  <TableRow key={installment.id}>
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
                        {getDueDateBadge(installment.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="rtl-flex">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {installment.remaining_amount?.toFixed(3)} د.ك
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">معلق</Badge>
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
                          variant="default"
                          size="sm"
                          className="rtl-flex"
                        >
                          <CreditCard className="h-4 w-4" />
                          دفع
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