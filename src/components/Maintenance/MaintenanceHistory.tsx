import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Download, Filter, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date: string;
  service_provider: string;
  status: string;
  cost: number;
  mileage_at_service: number;
  invoice_number: string;
  created_at: string;
}

export const MaintenanceHistory = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchMaintenanceHistory = async () => {
    try {
      // جلب المركبات للفلتر
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // جلب تاريخ الصيانة
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .order('created_at', { ascending: false });

      if (maintenanceError) throw maintenanceError;

      const formattedRecords = maintenanceData?.map(record => ({
        id: record.id,
        vehicle_id: record.vehicle_id,
        vehicle_number: record.vehicles?.vehicle_number || '',
        vehicle_make: record.vehicles?.make || '',
        vehicle_model: record.vehicles?.model || '',
        maintenance_type: record.maintenance_type,
        description: record.description,
        scheduled_date: record.scheduled_date || '',
        completed_date: record.completed_date || '',
        service_provider: record.service_provider || '',
        status: record.status || '',
        cost: record.cost || 0,
        mileage_at_service: record.mileage_at_service || 0,
        invoice_number: record.invoice_number || '',
        created_at: record.created_at,
      })) || [];

      setMaintenanceRecords(formattedRecords);
      setFilteredRecords(formattedRecords);

    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل تاريخ الصيانة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceHistory();
  }, []);

  useEffect(() => {
    let filtered = maintenanceRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vehicle_make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.maintenance_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.service_provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(record => record.vehicle_id === vehicleFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, vehicleFilter, maintenanceRecords]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">مجدولة</Badge>;
      case 'in_progress':
        return <Badge variant="default">جاري التنفيذ</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">مكتملة</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateTotalCost = () => {
    return filteredRecords
      .filter(record => record.status === 'completed')
      .reduce((total, record) => total + record.cost, 0);
  };

  const exportToCSV = () => {
    const headers = [
      'رقم المركبة',
      'الماركة',
      'الموديل',
      'نوع الصيانة',
      'الوصف',
      'التاريخ المجدول',
      'تاريخ الانتهاء',
      'مقدم الخدمة',
      'الحالة',
      'التكلفة',
      'المسافة المقطوعة',
      'رقم الفاتورة'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.vehicle_number,
        record.vehicle_make,
        record.vehicle_model,
        record.maintenance_type,
        `"${record.description}"`,
        record.scheduled_date,
        record.completed_date,
        record.service_provider,
        record.status,
        record.cost,
        record.mileage_at_service,
        record.invoice_number
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: 'تم التصدير',
      description: 'تم تصدير تاريخ الصيانة بنجاح',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* أدوات التحكم والإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredRecords.length}</div>
                <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredRecords.filter(r => r.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">صيانة مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <DollarSign className="h-6 w-6 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{calculateTotalCost().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي التكلفة (د.ك)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Filter className="h-6 w-6 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(filteredRecords.map(r => r.vehicle_id)).size}
                </div>
                <p className="text-xs text-muted-foreground">مركبات مختلفة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تاريخ الصيانة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في تاريخ الصيانة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب المركبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المركبات</SelectItem>
                {vehicles.filter(vehicle => vehicle.id && vehicle.id.trim() !== '').map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="in_progress">جاري التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير CSV
            </Button>
          </div>

          {/* قائمة السجلات */}
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد سجلات صيانة</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col items-start space-y-2">
                      {getStatusBadge(record.status)}
                      {record.cost > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          {record.cost.toFixed(2)} د.ك
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-right flex-1 mr-4">
                      <div className="font-medium">
                        {record.vehicle_number} - {record.vehicle_make} {record.vehicle_model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.maintenance_type}
                      </div>
                      <div className="text-sm">
                        {record.description}
                      </div>
                      {record.service_provider && (
                        <div className="text-sm text-muted-foreground">
                          مقدم الخدمة: {record.service_provider}
                        </div>
                      )}
                      {record.invoice_number && (
                        <div className="text-sm text-muted-foreground">
                          رقم الفاتورة: {record.invoice_number}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <div className="space-x-4 space-x-reverse">
                      {record.scheduled_date && (
                        <span>مجدولة: {format(new Date(record.scheduled_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      )}
                      {record.completed_date && (
                        <span>مكتملة: {format(new Date(record.completed_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      )}
                    </div>
                    <div className="space-x-4 space-x-reverse">
                      {record.mileage_at_service > 0 && (
                        <span>المسافة: {record.mileage_at_service.toLocaleString()} كم</span>
                      )}
                      <span>تم الإنشاء: {format(new Date(record.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};