import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Edit, Trash2, Calendar, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QuotationFiltersComponent, QuotationFilters } from './QuotationFilters';
import { QuotationPreview } from './QuotationPreview';
import { ShareLinkDialog } from './ShareLinkDialog';
import { quotationService } from '@/services/quotationService';
import { useToast } from '@/hooks/use-toast';

interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_id: string;
  vehicle_info: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  final_amount: number;
  status: string;
  valid_until: string;
  created_at: string;
}

interface QuotationsListProps {
  quotations: Quotation[];
  customers: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; make: string; model: string }>;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onConvertToContract?: (id: string) => void;
  onGetQuotationDetails?: (id: string) => Promise<any>;
}

export const QuotationsList: React.FC<QuotationsListProps> = ({
  quotations,
  customers,
  vehicles,
  onView,
  onEdit,
  onDelete,
  onConvertToContract,
  onGetQuotationDetails,
}) => {
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareQuotation, setShareQuotation] = useState<any>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<QuotationFilters>({
    search: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    customer: 'all',
    vehicle: 'all',
  });

  // فلترة البيانات
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      // فلترة البحث النصي
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${quotation.quotation_number} ${quotation.customer_name} ${quotation.vehicle_info}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // فلترة الحالة
      if (filters.status && filters.status !== 'all' && quotation.status !== filters.status) {
        return false;
      }

      // فلترة العميل
      if (filters.customer && filters.customer !== 'all' && quotation.customer_id !== filters.customer) {
        return false;
      }

      // فلترة المركبة
      if (filters.vehicle && filters.vehicle !== 'all' && quotation.vehicle_id !== filters.vehicle) {
        return false;
      }

      // فلترة التاريخ
      const quotationDate = new Date(quotation.created_at);
      if (filters.dateFrom && quotationDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && quotationDate > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [quotations, filters]);

  const handlePreview = async (id: string) => {
    try {
      setLoadingStates(prev => ({...prev, [`preview_${id}`]: true}));
      if (onGetQuotationDetails) {
        const details = await onGetQuotationDetails(id);
        setSelectedQuotation(details);
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
    } finally {
      setLoadingStates(prev => ({...prev, [`preview_${id}`]: false}));
    }
  };

  const handleEdit = async (id: string) => {
    try {
      setLoadingStates(prev => ({...prev, [`edit_${id}`]: true}));
      await onEdit?.(id);
    } catch (error) {
      console.error('Error editing quotation:', error);
    } finally {
      setLoadingStates(prev => ({...prev, [`edit_${id}`]: false}));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoadingStates(prev => ({...prev, [`delete_${id}`]: true}));
      await onDelete?.(id);
    } catch (error) {
      console.error('Error deleting quotation:', error);
    } finally {
      setLoadingStates(prev => ({...prev, [`delete_${id}`]: false}));
    }
  };

  const handleConvert = async (id: string) => {
    try {
      setLoadingStates(prev => ({...prev, [`convert_${id}`]: true}));
      await onConvertToContract?.(id);
    } catch (error) {
      console.error('Error converting quotation:', error);
    } finally {
      setLoadingStates(prev => ({...prev, [`convert_${id}`]: false}));
    }
  };

  const handleShareLink = async (id: string) => {
    try {
      setLoadingStates(prev => ({...prev, [`share_${id}`]: true}));
      
      // التحقق من حالة العرض قبل إنشاء الرابط
      const quotation = quotations.find(q => q.id === id);
      if (!quotation) {
        throw new Error('عرض السعر غير موجود');
      }
      
      if (!['draft', 'sent'].includes(quotation.status)) {
        throw new Error('يمكن إنشاء روابط عامة فقط لعروض الأسعار في حالة مسودة أو مرسلة');
      }

      const token = await quotationService.generatePublicLink(id);
      const generatedUrl = `${window.location.origin}/public-quotation/${token}`;
      
      // تعيين بيانات المشاركة وفتح الحوار
      setPublicUrl(generatedUrl);
      setShareQuotation(quotation);
      setShareDialogOpen(true);
      
      toast({
        title: 'تم إنشاء الرابط بنجاح',
        description: 'يمكنك الآن مشاركة عرض السعر',
      });
    } catch (error: any) {
      console.error('Error generating public link:', error);
      toast({
        title: 'خطأ في إنشاء الرابط العام',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({...prev, [`share_${id}`]: false}));
    }
  };


  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      sent: { label: 'مرسل', variant: 'default' as const },
      accepted: { label: 'مقبول', variant: 'default' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const },
      expired: { label: 'منتهي الصلاحية', variant: 'outline' as const },
      converted: { label: 'تم التحويل لعقد', variant: 'default' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد عروض أسعار</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء أول عرض سعر</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* مكون الفلترة */}
      <QuotationFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        customers={customers}
        vehicles={vehicles}
      />

      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          عروض الأسعار ({filteredQuotations.length} من {quotations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم العرض</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المركبة</TableHead>
                <TableHead className="text-right">فترة الإيجار</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">صالح حتى</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => {
                const expired = isExpired(quotation.valid_until);
                return (
                  <TableRow key={quotation.id} className={expired ? 'opacity-75' : ''}>
                    <TableCell className="font-medium">
                      {quotation.quotation_number}
                    </TableCell>
                    <TableCell>{quotation.customer_name}</TableCell>
                    <TableCell>{quotation.vehicle_info}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(quotation.start_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                        <div className="text-muted-foreground">
                          إلى {format(new Date(quotation.end_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({quotation.rental_days} أيام)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{quotation.final_amount.toFixed(3)} د.ك</div>
                    </TableCell>
                    <TableCell>
                      {expired && quotation.status !== 'converted' ? 
                        getStatusBadge('expired') : 
                        getStatusBadge(quotation.status)
                      }
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${expired ? 'text-destructive' : ''}`}>
                        {format(new Date(quotation.valid_until), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </TableCell>
                     <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(quotation.id)}
                        disabled={loadingStates[`preview_${quotation.id}`]}
                        title="معاينة"
                      >
                        {loadingStates[`preview_${quotation.id}`] ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>

                      {['draft', 'sent'].includes(quotation.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareLink(quotation.id)}
                          disabled={loadingStates[`share_${quotation.id}`]}
                          title="مشاركة عرض السعر"
                        >
                          {loadingStates[`share_${quotation.id}`] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                        
                        {quotation.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(quotation.id)}
                            disabled={loadingStates[`edit_${quotation.id}`]}
                            title="تعديل"
                          >
                            {loadingStates[`edit_${quotation.id}`] ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Edit className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {quotation.status === 'accepted' && !expired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvert(quotation.id)}
                            disabled={loadingStates[`convert_${quotation.id}`]}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="تحويل لعقد"
                          >
                            {loadingStates[`convert_${quotation.id}`] ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'تحويل لعقد'
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quotation.id)}
                          disabled={loadingStates[`delete_${quotation.id}`]}
                          className="text-destructive"
                          title="حذف"
                        >
                          {loadingStates[`delete_${quotation.id}`] ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      </Card>

      {/* معاينة العرض */}
      <QuotationPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        quotation={selectedQuotation}
      />

      {/* حوار مشاركة الرابط */}
      {shareQuotation && (
        <ShareLinkDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          publicUrl={publicUrl}
          quotationNumber={shareQuotation.quotation_number}
          customerName={shareQuotation.customer_name}
        />
      )}
    </div>
  );
};