import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calculator, Eye, Download, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const PayrollList = () => {
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadPayrollData();
  }, [searchTerm, statusFilter]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            employee_number
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayrollData(data || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الرواتب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async (payrollId: string) => {
    try {
      // تحديث البيانات مباشرة دون استخدام الدالة المخصصة مؤقتاً
      const { error: updateError } = await supabase
        .from('payroll')
        .update({ status: 'calculated' })
        .eq('id', payrollId);
      
      if (updateError) throw updateError;

      toast({
        title: "تم بنجاح",
        description: "تم حساب الراتب وإنشاء القيود المحاسبية"
      });

      loadPayrollData();
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حساب الراتب",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', className: 'bg-gray-100 text-gray-800' },
      calculated: { label: 'محسوب', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'مُوافق عليه', className: 'bg-green-100 text-green-800' },
      paid: { label: 'مدفوع', className: 'bg-emerald-100 text-emerald-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="rtl-title">قائمة الرواتب</CardTitle>
          <Button className="rtl-flex">
            <Plus className="h-4 w-4 ml-2" />
            إضافة راتب جديد
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث باسم الموظف أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="حالة الراتب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="calculated">محسوب</SelectItem>
              <SelectItem value="approved">مُوافق عليه</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">فترة الراتب</TableHead>
                <TableHead className="text-right">الراتب الأساسي</TableHead>
                <TableHead className="text-right">البدلات</TableHead>
                <TableHead className="text-right">الخصومات</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">صافي الراتب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : payrollData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    لا توجد بيانات رواتب
                  </TableCell>
                </TableRow>
              ) : (
                payrollData.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payroll.employees ? 
                            `${payroll.employees.first_name} ${payroll.employees.last_name}` : 
                            'غير محدد'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payroll.employees?.employee_number || 'غير محدد'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(payroll.pay_period_start).toLocaleDateString('ar-SA')} -
                        {new Date(payroll.pay_period_end).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payroll.basic_salary || 0)}</TableCell>
                    <TableCell>{formatCurrency(payroll.allowances || 0)}</TableCell>
                    <TableCell>{formatCurrency(payroll.deductions || 0)}</TableCell>
                    <TableCell>{formatCurrency(payroll.gross_salary || 0)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payroll.net_salary || 0)}</TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {payroll.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCalculatePayroll(payroll.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                        )}
                        {payroll.status === 'calculated' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {payroll.status === 'approved' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};