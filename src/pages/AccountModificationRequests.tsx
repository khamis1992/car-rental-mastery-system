
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, MessageSquare } from 'lucide-react';
import { accountModificationService } from '@/services/accountModificationService';
import { AccountModificationRequest } from '@/types/accountModification';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AccountModificationRequests() {
  const [requests, setRequests] = useState<AccountModificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccountModificationRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: 'approve' | 'reject' | null; request: AccountModificationRequest | null }>({ type: null, request: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await accountModificationService.getModificationRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('حدث خطأ في تحميل طلبات التعديل');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: AccountModificationRequest) => {
    try {
      setProcessing(true);
      await accountModificationService.approveModificationRequest(request.id);
      toast.success('تم الموافقة على طلب التعديل بنجاح');
      setActionDialog({ type: null, request: null });
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('حدث خطأ أثناء الموافقة على الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: AccountModificationRequest) => {
    if (!rejectionReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }

    try {
      setProcessing(true);
      await accountModificationService.rejectModificationRequest(request.id, rejectionReason);
      toast.success('تم رفض طلب التعديل');
      setActionDialog({ type: null, request: null });
      setRejectionReason('');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('حدث خطأ أثناء رفض الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="rtl-flex"><Clock className="h-3 w-3 ml-1" />في الانتظار</Badge>;
      case 'approved':
        return <Badge variant="default" className="rtl-flex bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="rtl-flex"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">عالي</Badge>;
      case 'normal':
        return <Badge variant="outline">عادي</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-gray-500">منخفض</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'update_code': return 'تعديل رقم الحساب';
      case 'update_name': return 'تعديل اسم الحساب';
      case 'update_type': return 'تعديل نوع الحساب';
      case 'update_category': return 'تعديل فئة الحساب';
      case 'deactivate': return 'إلغاء تفعيل الحساب';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  const filterRequestsByStatus = (status: string) => {
    return requests.filter(req => req.status === status);
  };

  const RequestCard = ({ request }: { request: AccountModificationRequest }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg rtl-title">
              {getRequestTypeLabel(request.request_type)}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>رقم الطلب: {request.id.slice(0, 8)}</span>
              <span>•</span>
              <span>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(request.priority)}
            {getStatusBadge(request.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">القيم الحالية:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                {JSON.stringify(request.current_values, null, 2)}
              </div>
            </div>
            <div>
              <span className="font-medium">القيم المقترحة:</span>
              <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
                {JSON.stringify(request.proposed_values, null, 2)}
              </div>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-sm">التبرير:</span>
            <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-2 rounded">
              {request.justification}
            </p>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => setActionDialog({ type: 'approve', request })}
                className="rtl-flex bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                موافقة
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setActionDialog({ type: 'reject', request })}
                className="rtl-flex"
              >
                <XCircle className="h-4 w-4 ml-1" />
                رفض
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedRequest(request)}
                className="rtl-flex"
              >
                <Eye className="h-4 w-4 ml-1" />
                تفاصيل
              </Button>
            </div>
          )}

          {request.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h5 className="font-medium text-red-800 mb-1 rtl-flex">
                <XCircle className="h-4 w-4 ml-1" />
                سبب الرفض
              </h5>
              <p className="text-sm text-red-700">{request.rejection_reason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل طلبات التعديل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold rtl-title">طلبات تعديل الحسابات</h1>
        <p className="text-muted-foreground mt-2">
          إدارة ومراجعة طلبات تعديل الحسابات المقفلة
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="rtl-flex">
            <Clock className="h-4 w-4 ml-1" />
            في الانتظار ({filterRequestsByStatus('pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rtl-flex">
            <CheckCircle className="h-4 w-4 ml-1" />
            موافق عليها ({filterRequestsByStatus('approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rtl-flex">
            <XCircle className="h-4 w-4 ml-1" />
            مرفوضة ({filterRequestsByStatus('rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rtl-flex">
            <AlertTriangle className="h-4 w-4 ml-1" />
            جميع الطلبات ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {filterRequestsByStatus('pending').length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد طلبات في الانتظار</h3>
                <p className="text-muted-foreground">جميع الطلبات تم مراجعتها</p>
              </CardContent>
            </Card>
          ) : (
            filterRequestsByStatus('pending').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {filterRequestsByStatus('approved').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {filterRequestsByStatus('rejected').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog 
        open={actionDialog.type !== null} 
        onOpenChange={() => setActionDialog({ type: null, request: null })}
      >
        <DialogContent className="rtl">
          <DialogHeader>
            <DialogTitle className="rtl-title">
              {actionDialog.type === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
            </DialogTitle>
          </DialogHeader>
          
          {actionDialog.type === 'approve' ? (
            <div className="space-y-4">
              <p>هل أنت متأكد من الموافقة على هذا الطلب؟</p>
              <p className="text-sm text-muted-foreground">
                سيتم تطبيق التعديلات على الحساب فوراً بعد الموافقة.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => actionDialog.request && handleApprove(actionDialog.request)}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'جاري المعالجة...' : 'تأكيد الموافقة'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActionDialog({ type: null, request: null })}
                  disabled={processing}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>يرجى كتابة سبب رفض هذا الطلب:</p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب الرفض..."
                rows={3}
              />
              <div className="flex gap-3">
                <Button 
                  variant="destructive"
                  onClick={() => actionDialog.request && handleReject(actionDialog.request)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1"
                >
                  {processing ? 'جاري المعالجة...' : 'تأكيد الرفض'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setActionDialog({ type: null, request: null });
                    setRejectionReason('');
                  }}
                  disabled={processing}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
