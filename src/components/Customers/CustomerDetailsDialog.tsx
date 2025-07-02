import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  customer_number: string;
  customer_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  address?: string;
  city?: string;
  country?: string;
  company_contact_person?: string;
  company_registration_number?: string;
  tax_number?: string;
  
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_contracts: number;
  total_revenue: number;
  last_contract_date?: string;
  created_at: string;
}

interface CustomerHistory {
  id: string;
  action_type: string;
  description: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

interface CustomerDetailsDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetailsDialog: React.FC<CustomerDetailsDialogProps> = ({
  customer,
  open,
  onOpenChange
}) => {
  const [history, setHistory] = useState<CustomerHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      fetchCustomerHistory();
    }
  }, [open, customer]);

  const fetchCustomerHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب تاريخ العميل:', error);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('خطأ في جلب تاريخ العميل:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', color: 'bg-green-500' },
      inactive: { label: 'غير نشط', color: 'bg-gray-500' },
      blocked: { label: 'محظور', color: 'bg-red-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`text-white ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'individual' ? (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="w-3 h-3" />
        فرد
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <Building className="w-3 h-3" />
        شركة
      </Badge>
    );
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer.customer_type === 'individual' ? (
              <User className="w-5 h-5" />
            ) : (
              <Building className="w-5 h-5" />
            )}
            تفاصيل العميل - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">التاريخ والإحصائيات</TabsTrigger>
            <TabsTrigger value="details">البيانات الأساسية</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{customer.total_contracts}</p>
                    <p className="text-sm text-muted-foreground">إجمالي العقود</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(customer.total_revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {customer.last_contract_date ? formatDate(customer.last_contract_date) : 'لا توجد'}
                    </p>
                    <p className="text-sm text-muted-foreground">آخر عقد</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* تاريخ العميل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  تاريخ العميل
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-4">جاري التحميل...</p>
                ) : history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">لا يوجد تاريخ للعميل</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(customer.customer_type)}
                    {getStatusBadge(customer.status)}
                  </div>
                  <span>المعلومات الأساسية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label className="text-sm font-medium text-muted-foreground">رقم العميل</label>
                    <span className="text-muted-foreground">:</span>
                    <p className="font-mono text-lg">{customer.customer_number}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label className="text-sm font-medium text-muted-foreground">
                      {customer.customer_type === 'company' ? 'اسم الشركة' : 'الاسم الكامل'}
                    </label>
                    <span className="text-muted-foreground">:</span>
                    <p className="text-lg font-medium">{customer.name}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                    <span className="text-muted-foreground">:</span>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p>{customer.phone}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                      <span className="text-muted-foreground">:</span>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p>{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.national_id && (
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <label className="text-sm font-medium text-muted-foreground">
                        {customer.customer_type === 'company' ? 'رقم السجل التجاري' : 'رقم الهوية'}
                      </label>
                      <span className="text-muted-foreground">:</span>
                      <p className="font-mono">{customer.national_id}</p>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* بيانات الشركة */}
            {customer.customer_type === 'company' && (
              <Card>
                <CardHeader>
                  <CardTitle>بيانات الشركة</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.company_contact_person && (
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <label className="text-sm font-medium text-muted-foreground">الشخص المسؤول</label>
                        <span className="text-muted-foreground">:</span>
                        <p>{customer.company_contact_person}</p>
                      </div>
                    )}

                    {customer.company_registration_number && (
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <label className="text-sm font-medium text-muted-foreground">رقم السجل التجاري</label>
                        <span className="text-muted-foreground">:</span>
                        <p className="font-mono">{customer.company_registration_number}</p>
                      </div>
                    )}

                    {customer.tax_number && (
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <label className="text-sm font-medium text-muted-foreground">الرقم الضريبي</label>
                        <span className="text-muted-foreground">:</span>
                        <p className="font-mono">{customer.tax_number}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* العنوان */}
            {(customer.address || customer.city || customer.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    العنوان
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {customer.address && <p>{customer.address}</p>}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {customer.city && <span>{customer.city}</span>}
                      {customer.city && customer.country && <span>-</span>}
                      {customer.country && <span>{customer.country}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الملاحظات */}
            {customer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    الملاحظات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{customer.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsDialog;