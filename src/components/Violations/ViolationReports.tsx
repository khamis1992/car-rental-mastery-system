import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { violationService } from '@/services/violationService';
import { ViolationReportData } from '@/types/violation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const ViolationReports: React.FC = () => {
  const [reportData, setReportData] = useState<ViolationReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    status: '',
    liability_determination: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // تحديد الفترة الافتراضية (آخر 30 يوم)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0]
    }));
    
    generateReport({
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0]
    });
  }, []);

  const generateReport = async (customFilters?: any) => {
    setLoading(true);
    try {
      const filtersToUse = customFilters || filters;
      const data = await violationService.generateViolationReport(filtersToUse);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'خطأ في تولید التقرير',
        description: 'حدث خطأ أثناء تولید تقرير المخالفات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  const getSeverityColor = (status: string) => {
    const colors = {
      'pending': 'secondary',
      'notified': 'default',
      'paid': 'default',
      'disputed': 'destructive',
      'closed': 'outline'
    } as const;
    return colors[status as keyof typeof colors] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => generateReport()}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {loading ? 'جاري التولید...' : 'تولید التقرير'}
            </Button>
            <CardTitle className="text-right">فلاتر التقرير</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date_from">من تاريخ</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date_to">إلى تاريخ</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="notified">تم الإشعار</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="disputed">متنازع عليها</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="liability">المسؤولية</Label>
              <Select value={filters.liability_determination} onValueChange={(value) => handleFilterChange('liability_determination', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المسؤوليات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المسؤوليات</SelectItem>
                  <SelectItem value="customer">العميل</SelectItem>
                  <SelectItem value="company">الشركة</SelectItem>
                  <SelectItem value="shared">مشتركة</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{reportData.total_violations}</div>
                <p className="text-sm text-muted-foreground">إجمالي المخالفات</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.total_amount)}</div>
                <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.paid_amount)}</div>
                <p className="text-sm text-muted-foreground">المبلغ المدفوع</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.outstanding_amount)}</div>
                <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* تبويبات التقارير */}
      {reportData && (
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trend" className="text-right">الاتجاه الشهري</TabsTrigger>
            <TabsTrigger value="liability" className="text-right">المسؤولية</TabsTrigger>
            <TabsTrigger value="types" className="text-right">أنواع المخالفات</TabsTrigger>
            <TabsTrigger value="status" className="text-right">حسب الحالة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  توزيع المخالفات حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">عدد المخالفات</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.violations_by_status.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(item.status)}>
                            {item.status === 'pending' ? 'معلقة' :
                             item.status === 'notified' ? 'تم الإشعار' :
                             item.status === 'paid' ? 'مدفوعة' :
                             item.status === 'disputed' ? 'متنازع عليها' :
                             item.status === 'closed' ? 'مغلقة' : item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  توزيع المخالفات حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">عدد المخالفات</TableHead>
                      <TableHead className="text-right">نوع المخالفة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.violations_by_type.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.type_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  توزيع المخالفات حسب المسؤولية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">عدد المخالفات</TableHead>
                      <TableHead className="text-right">المسؤولية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.violations_by_liability.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.liability === 'العميل' ? 'destructive' :
                            item.liability === 'الشركة' ? 'default' :
                            item.liability === 'مشتركة' ? 'outline' : 'secondary'
                          }>
                            {item.liability}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  الاتجاه الشهري للمخالفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">عدد المخالفات</TableHead>
                      <TableHead className="text-right">الشهر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.monthly_trend.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.month}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* أزرار التصدير */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">تصدير التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                تصدير PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                تصدير Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};