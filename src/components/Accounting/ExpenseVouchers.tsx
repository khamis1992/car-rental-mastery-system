
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Search, FileText, Check, X, Eye, Edit } from 'lucide-react';
import { expenseVoucherService, type ExpenseVoucher } from '@/services/expenseVoucherService';
import { CreateExpenseVoucherDialog } from './CreateExpenseVoucherDialog';
import { ExpenseVoucherDetails } from './ExpenseVoucherDetails';
import { toast } from 'sonner';

export const ExpenseVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    beneficiary_name: ''
  });
  const [selectedVoucher, setSelectedVoucher] = useState<ExpenseVoucher | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadExpenseVouchers();
  }, []);

  const loadExpenseVouchers = async () => {
    try {
      setLoading(true);
      const data = await expenseVoucherService.getExpenseVouchers(filters);
      setVouchers(data);
    } catch (error) {
      console.error('خطأ في تحميل سندات الصرف:', error);
      toast.error('فشل في تحميل سندات الصرف');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExpenseVouchers();
  };

  const handleApprove = async (voucherId: string) => {
    try {
      await expenseVoucherService.updateExpenseVoucherStatus(voucherId, 'approved');
      toast.success('تم اعتماد السند بنجاح');
      loadExpenseVouchers();
    } catch (error) {
      console.error('خطأ في اعتماد السند:', error);
      toast.error('فشل في اعتماد السند');
    }
  };

  const handleReject = async (voucherId: string) => {
    try {
      await expenseVoucherService.updateExpenseVoucherStatus(voucherId, 'rejected');
      toast.success('تم رفض السند');
      loadExpenseVouchers();
    } catch (error) {
      console.error('خطأ في رفض السند:', error);
      toast.error('فشل في رفض السند');
    }
  };

  const handleGenerateJournalEntry = async (voucherId: string) => {
    try {
      const journalEntryId = await expenseVoucherService.generateJournalEntry(voucherId);
      toast.success('تم إنشاء القيد المحاسبي بنجاح');
      loadExpenseVouchers();
    } catch (error) {
      console.error('خطأ في إنشاء القيد المحاسبي:', error);
      toast.error('فشل في إنشاء القيد المحاسبي');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'pending_approval':
        return 'في انتظار الموافقة';
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      case 'paid':
        return 'مدفوع';
      case 'cancelled':
        return 'ملغى';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold rtl-title">سندات الصرف</h2>
          <p className="text-muted-foreground">إدارة ومتابعة سندات الصرف والمصروفات</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="rtl-flex"
        >
          <PlusCircle className="w-4 h-4" />
          إنشاء سند صرف جديد
        </Button>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardHeader>
          <CardTitle>فلتر البحث</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الحالة</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending_approval">في انتظار الموافقة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">من تاريخ</label>
              <Input 
                type="date" 
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
              <Input 
                type="date" 
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المستفيد</label>
              <Input 
                placeholder="البحث بالاسم..."
                value={filters.beneficiary_name}
                onChange={(e) => setFilters({...filters, beneficiary_name: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSearch} className="rtl-flex">
              <Search className="w-4 h-4" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول السندات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة سندات الصرف</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم السند</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                    <TableCell>{new Date(voucher.voucher_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{voucher.beneficiary_name}</TableCell>
                    <TableCell>{voucher.net_amount.toFixed(3)} د.ك</TableCell>
                    <TableCell>
                      {voucher.payment_method === 'cash' ? 'نقداً' : 
                       voucher.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(voucher.status)}>
                        {getStatusLabel(voucher.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVoucher(voucher);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {voucher.status === 'pending_approval' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(voucher.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(voucher.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {voucher.status === 'approved' && !voucher.journal_entry_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateJournalEntry(voucher.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء سند جديد */}
      <CreateExpenseVoucherDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          loadExpenseVouchers();
        }}
      />

      {/* نافذة تفاصيل السند */}
      {selectedVoucher && (
        <ExpenseVoucherDetails
          voucher={selectedVoucher}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
};
