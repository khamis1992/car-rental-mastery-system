import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Filter, UserCheck, Bell, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ViolationWithDetails } from '@/types/violation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ViolationsListProps {
  violations: ViolationWithDetails[];
  onView: (id: string) => void;
  onDetermineLiability: (id: string, liability: 'customer' | 'company' | 'shared', percentage: number, reason?: string) => void;
  onMarkAsNotified: (id: string) => void;
  loading: boolean;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  onView,
  onDetermineLiability,
  onMarkAsNotified,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [liabilityFilter, setLiabilityFilter] = useState('');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const },
      notified: { label: 'تم الإشعار', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      disputed: { label: 'متنازع عليها', variant: 'destructive' as const },
      closed: { label: 'مغلقة', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      unpaid: { label: 'غير مدفوعة', variant: 'destructive' as const },
      partial: { label: 'مدفوعة جزئياً', variant: 'secondary' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLiabilityBadge = (liability: string) => {
    const liabilityConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const },
      customer: { label: 'العميل', variant: 'destructive' as const },
      company: { label: 'الشركة', variant: 'default' as const },
      shared: { label: 'مشتركة', variant: 'outline' as const },
    };

    const config = liabilityConfig[liability as keyof typeof liabilityConfig] || liabilityConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      minor: { label: 'بسيطة', variant: 'outline' as const },
      moderate: { label: 'متوسطة', variant: 'secondary' as const },
      major: { label: 'كبيرة', variant: 'destructive' as const },
      severe: { label: 'خطيرة', variant: 'destructive' as const },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.minor;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const filteredViolations = violations.filter(violation => {
    const matchesSearch = searchTerm === '' || 
      violation.violation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.vehicles?.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || statusFilter === 'all' || violation.status === statusFilter;
    const matchesLiability = liabilityFilter === '' || liabilityFilter === 'all' || violation.liability_determination === liabilityFilter;

    return matchesSearch && matchesStatus && matchesLiability;
  });

  const handleQuickLiabilityDetermination = (violationId: string, liability: 'customer' | 'company') => {
    onDetermineLiability(violationId, liability, liability === 'customer' ? 100 : 0, 'تحديد سريع للمسؤولية');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">قائمة المخالفات المرورية</CardTitle>
        
        {/* فلاتر البحث */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث برقم المخالفة، العميل، أو المركبة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="notified">تم الإشعار</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="disputed">متنازع عليها</SelectItem>
              <SelectItem value="closed">مغلقة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={liabilityFilter} onValueChange={setLiabilityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="المسؤولية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المسؤوليات</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="customer">العميل</SelectItem>
              <SelectItem value="company">الشركة</SelectItem>
              <SelectItem value="shared">مشتركة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراءات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>حالة الدفع</TableHead>
                <TableHead>المسؤولية</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ المخالفة</TableHead>
                <TableHead>المركبة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>نوع المخالفة</TableHead>
                <TableHead>رقم المخالفة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredViolations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    لا توجد مخالفات
                  </TableCell>
                </TableRow>
              ) : (
                filteredViolations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(violation.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {violation.liability_determination === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickLiabilityDetermination(violation.id, 'customer')}
                                >
                                  <UserCheck className="w-4 h-4 ml-2" />
                                  مسؤولية العميل
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleQuickLiabilityDetermination(violation.id, 'company')}
                                >
                                  <UserCheck className="w-4 h-4 ml-2" />
                                  مسؤولية الشركة
                                </DropdownMenuItem>
                              </>
                            )}
                            {violation.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => onMarkAsNotified(violation.id)}
                              >
                                <Bell className="w-4 h-4 ml-2" />
                                تم الإشعار
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(violation.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(violation.payment_status)}</TableCell>
                    <TableCell>{getLiabilityBadge(violation.liability_determination)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(violation.total_amount)}</div>
                        {violation.paid_amount > 0 && (
                          <div className="text-sm text-success">
                            مدفوع: {formatCurrency(violation.paid_amount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(violation.violation_date), 'dd/MM/yyyy', { locale: ar })}
                      {violation.violation_time && (
                        <div className="text-sm text-muted-foreground">
                          {violation.violation_time}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{violation.vehicles?.license_plate}</div>
                        <div className="text-sm text-muted-foreground">
                          {violation.vehicles?.make} {violation.vehicles?.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{violation.customers?.name}</div>
                        <div className="text-sm text-muted-foreground">{violation.customers?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{violation.violation_types?.violation_name_ar}</div>
                        <div className="text-sm text-muted-foreground">
                          {getSeverityBadge(violation.violation_types?.severity_level || 'minor')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {violation.violation_number}
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