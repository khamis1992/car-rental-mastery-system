import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, TrendingUp, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QuotationForm } from '@/components/Contracts/QuotationForm';
import { QuotationsList } from '@/components/Contracts/QuotationsList';
import { QuotationEditDialog } from '@/components/Contracts/QuotationEditDialog';
import { quotationService } from '@/services/quotationService';

const Quotations = () => {
  const [quotationFormOpen, setQuotationFormOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [quotationStats, setQuotationStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalValue: 0,
    avgValue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadQuotations(),
        loadCustomers(),
        loadVehicles(),
        loadStats(),
      ]);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuotations = async () => {
    const data = await quotationService.getQuotationsWithDetails();
    setQuotations(data);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, customer_number, rating, total_contracts')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    setCustomers(data || []);
  };

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, vehicle_number, daily_rate, weekly_rate, monthly_rate, status')
      .order('vehicle_number');
    
    if (error) throw error;
    setVehicles(data || []);
  };

  const loadStats = async () => {
    const quotationStatsData = await quotationService.getQuotationStats();
    
    // حساب معدل التحويل
    const { count: convertedCount } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted');

    const conversionRate = quotationStatsData.total > 0 
      ? ((convertedCount || 0) / quotationStatsData.total) * 100 
      : 0;

    const avgValue = quotationStatsData.total > 0 
      ? quotationStatsData.totalValue / quotationStatsData.total 
      : 0;
    
    setQuotationStats({
      ...quotationStatsData,
      avgValue,
      conversionRate,
    });
  };

  const handleFormSuccess = () => {
    loadData();
  };

  const handleView = (id: string) => {
    console.log('View quotation:', id);
    // يمكن إضافة معاينة أو فتح صفحة تفاصيل
  };

  const handleEdit = (id: string) => {
    console.log('Edit quotation:', id);
    setSelectedQuotationId(id);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('Delete quotation:', id);
    try {
      const confirmed = window.confirm('هل أنت متأكد من حذف عرض السعر؟');
      if (!confirmed) return;

      await quotationService.deleteQuotation(id);
      toast({
        title: 'تم حذف العرض',
        description: 'تم حذف عرض السعر بنجاح',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleConvertToContract = (id: string) => {
    console.log('Convert to contract:', id);
    // استخدام React Router بدلاً من window.location.href
    navigate(`/contracts?quotation=${id}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة عروض الأسعار</h1>
          <p className="text-muted-foreground">إنشاء وإدارة عروض أسعار تأجير المركبات</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="rtl-flex"
            onClick={() => setQuotationFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            عرض سعر جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات شاملة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{quotationStats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي العروض</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotationStats.active}</p>
                <p className="text-sm text-muted-foreground">عروض نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{quotationStats.expired}</p>
                <p className="text-sm text-muted-foreground">منتهية الصلاحية</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{quotationStats.totalValue.toFixed(3)} د.ك</p>
                <p className="text-sm text-muted-foreground">إجمالي قيمة العروض</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{quotationStats.avgValue.toFixed(3)} د.ك</p>
                <p className="text-sm text-muted-foreground">متوسط قيمة العرض</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{quotationStats.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">معدل التحويل لعقود</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة عروض الأسعار */}
      <QuotationsList
        quotations={quotations}
        customers={customers}
        vehicles={vehicles}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConvertToContract={handleConvertToContract}
        onGetQuotationDetails={quotationService.getQuotationById}
      />

      {/* نموذج إنشاء عرض سعر */}
      <QuotationForm
        open={quotationFormOpen}
        onOpenChange={setQuotationFormOpen}
        customers={customers}
        vehicles={vehicles}
        onSuccess={handleFormSuccess}
      />

      {/* نموذج تعديل عرض السعر */}
      <QuotationEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        quotationId={selectedQuotationId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Quotations;