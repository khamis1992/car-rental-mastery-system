import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Search, Filter, Edit, Trash2, CheckCircle, Car, Wrench, Clock, MapPin, DollarSign, FileText, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  status: string;
}

interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  service_provider: string;
  status: string;
  cost: number;
  created_at: string;
}

const maintenanceTypes = [
  'صيانة دورية',
  'تغيير زيت',
  'فحص شامل',
  'صيانة الفرامل',
  'صيانة الإطارات',
  'صيانة التكييف',
  'صيانة المحرك',
  'صيانة ناقل الحركة',
  'إصلاح عطل',
  'أخرى'
];

export const MaintenanceScheduler = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // نموذج البيانات
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: '',
    description: '',
    scheduled_date: new Date(),
    scheduled_time: '09:00',
    service_provider: '',
    cost: '',
    status: 'scheduled'
  });
  
  // حالة التحقق من صحة الحقول
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);

  const fetchData = async () => {
    try {
      // جلب المركبات
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // جلب جدول الصيانة
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (
            vehicle_number,
            make,
            model
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (schedulesError) throw schedulesError;

      const formattedSchedules = schedulesData?.map(schedule => ({
        id: schedule.id,
        vehicle_id: schedule.vehicle_id,
        vehicle_number: schedule.vehicles?.vehicle_number || '',
        vehicle_make: schedule.vehicles?.make || '',
        vehicle_model: schedule.vehicles?.model || '',
        maintenance_type: schedule.maintenance_type,
        description: schedule.description,
        scheduled_date: schedule.scheduled_date || '',
        service_provider: schedule.service_provider || '',
        status: schedule.status || 'scheduled',
        cost: schedule.cost || 0,
        created_at: schedule.created_at,
      })) || [];

      setMaintenanceSchedules(formattedSchedules);
      setFilteredSchedules(formattedSchedules);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = maintenanceSchedules;

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.vehicle_make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.maintenance_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    setFilteredSchedules(filtered);
  }, [searchTerm, statusFilter, maintenanceSchedules]);

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      maintenance_type: '',
      description: '',
      scheduled_date: new Date(),
      scheduled_time: '09:00',
      service_provider: '',
      cost: '',
      status: 'scheduled'
    });
    setFieldErrors({});
    setShowSummary(false);
    setEditingSchedule(null);
  };

  // التحقق من صحة النموذج
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.vehicle_id) {
      errors.vehicle_id = 'يرجى اختيار المركبة';
    }
    if (!formData.maintenance_type) {
      errors.maintenance_type = 'يرجى اختيار نوع الصيانة';
    }
    if (!formData.description.trim()) {
      errors.description = 'يرجى إدخال وصف الصيانة';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const scheduleData = {
        vehicle_id: formData.vehicle_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
        service_provider: formData.service_provider || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        status: formData.status,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('vehicle_maintenance')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({
          title: 'تم التحديث',
          description: 'تم تحديث جدولة الصيانة بنجاح',
        });
      } else {
        const { error } = await supabase
          .from('vehicle_maintenance')
          .insert([scheduleData]);

        if (error) throw error;

        toast({
          title: 'تم الإضافة',
          description: 'تم جدولة الصيانة بنجاح',
        });
      }

      setShowAddDialog(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error('Error saving maintenance schedule:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ جدولة الصيانة',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      vehicle_id: schedule.vehicle_id,
      maintenance_type: schedule.maintenance_type,
      description: schedule.description,
      scheduled_date: new Date(schedule.scheduled_date),
      scheduled_time: '09:00',
      service_provider: schedule.service_provider,
      cost: schedule.cost.toString(),
      status: schedule.status
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجدولة؟')) return;

    try {
      const { error } = await supabase
        .from('vehicle_maintenance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف جدولة الصيانة بنجاح',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting maintenance schedule:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف جدولة الصيانة',
        variant: 'destructive',
      });
    }
  };

  const handleMarkCompleted = async (schedule: MaintenanceSchedule) => {
    try {
      const { error } = await supabase
        .from('vehicle_maintenance')
        .update({
          status: 'completed',
          completed_date: format(new Date(), 'yyyy-MM-dd')
        })
        .eq('id', schedule.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديد الصيانة كمكتملة',
      });

      fetchData();
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث حالة الصيانة',
        variant: 'destructive',
      });
    }
  };

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

  const isOverdue = (scheduledDate: string, status: string) => {
    return status === 'scheduled' && new Date(scheduledDate) < new Date();
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
      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle>جدولة الصيانة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن مركبة أو نوع الصيانة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
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
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 ml-2" />
                  جدولة صيانة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl text-right">
                    {editingSchedule ? 'تعديل جدولة الصيانة' : 'جدولة صيانة جديدة'}
                  </DialogTitle>
                </DialogHeader>
                
                {/* النموذج مع خلفية مريحة */}
                <div className="bg-gray-50 rounded-xl p-6" dir="rtl">
                  <form onSubmit={handleSubmit} className="space-y-6" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
                    
                    {/* شبكة عمودين */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* العمود الأيمن */}
                      <div className="space-y-4">
                        
                        {/* اختيار المركبة */}
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_id" className="text-sm font-medium flex items-center gap-2">
                            <Car className="w-4 h-4 text-blue-600" />
                            المركبة *
                          </Label>
                          <Select 
                            value={formData.vehicle_id} 
                            onValueChange={(value) => {
                              setFormData({ ...formData, vehicle_id: value });
                              setFieldErrors({ ...fieldErrors, vehicle_id: '' });
                            }}
                          >
                            <SelectTrigger 
                              className={cn(
                                "text-base h-11",
                                fieldErrors.vehicle_id && "border-red-500 focus:border-red-500"
                              )}
                            >
                              <SelectValue placeholder="🚗 اختر المركبة" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldErrors.vehicle_id && (
                            <p className="text-red-500 text-xs">{fieldErrors.vehicle_id}</p>
                          )}
                        </div>

                        {/* نوع الصيانة */}
                        <div className="space-y-2">
                          <Label htmlFor="maintenance_type" className="text-sm font-medium flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-orange-600" />
                            نوع الصيانة *
                          </Label>
                          <Select 
                            value={formData.maintenance_type} 
                            onValueChange={(value) => {
                              setFormData({ ...formData, maintenance_type: value });
                              setFieldErrors({ ...fieldErrors, maintenance_type: '' });
                            }}
                          >
                            <SelectTrigger 
                              className={cn(
                                "text-base h-11",
                                fieldErrors.maintenance_type && "border-red-500 focus:border-red-500"
                              )}
                            >
                              <SelectValue placeholder="🔧 اختر نوع الصيانة" />
                            </SelectTrigger>
                            <SelectContent>
                              {maintenanceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldErrors.maintenance_type && (
                            <p className="text-red-500 text-xs">{fieldErrors.maintenance_type}</p>
                          )}
                        </div>

                        {/* التاريخ والوقت */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-green-600" />
                              التاريخ *
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-right font-normal text-base h-11",
                                    !formData.scheduled_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="ml-2 h-4 w-4" />
                                  {formData.scheduled_date ? (
                                    format(formData.scheduled_date, "dd/MM/yyyy", { locale: ar })
                                  ) : (
                                    <span>📅 اختر التاريخ</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={formData.scheduled_date}
                                  onSelect={(date) => date && setFormData({ ...formData, scheduled_date: date })}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scheduled_time" className="text-sm font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-600" />
                              الوقت
                            </Label>
                            <Input
                              id="scheduled_time"
                              type="time"
                              value={formData.scheduled_time}
                              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                              className="text-base h-11"
                            />
                          </div>
                        </div>

                        {/* مقدم الخدمة */}
                        <div className="space-y-2">
                          <Label htmlFor="service_provider" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            مقدم الخدمة
                          </Label>
                          <Input
                            id="service_provider"
                            value={formData.service_provider}
                            onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                            placeholder="🏪 اسم المركز أو الورشة"
                            className="text-base h-11"
                          />
                        </div>
                      </div>

                      {/* العمود الأيسر */}
                      <div className="space-y-4">
                        
                        {/* الوصف */}
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            وصف الصيانة *
                          </Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => {
                              setFormData({ ...formData, description: e.target.value });
                              setFieldErrors({ ...fieldErrors, description: '' });
                            }}
                            placeholder="📝 وصف تفصيلي للصيانة المطلوبة..."
                            rows={5}
                            className={cn(
                              "text-base",
                              fieldErrors.description && "border-red-500 focus:border-red-500"
                            )}
                          />
                          {fieldErrors.description && (
                            <p className="text-red-500 text-xs">{fieldErrors.description}</p>
                          )}
                        </div>

                        {/* التكلفة والحالة */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="cost" className="text-sm font-medium flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              التكلفة (د.ك)
                            </Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              value={formData.cost}
                              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                              placeholder="💰 0.00"
                              className="text-base h-11"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium">الحالة</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="text-base h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">مجدولة</SelectItem>
                                <SelectItem value="in_progress">جاري التنفيذ</SelectItem>
                                <SelectItem value="completed">مكتملة</SelectItem>
                                <SelectItem value="cancelled">ملغية</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* ملخص البيانات */}
                        {(formData.vehicle_id || formData.maintenance_type || formData.description) && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-medium text-sm mb-3 text-gray-700">📋 ملخص الصيانة:</h4>
                            <div className="space-y-2 text-sm">
                              {formData.vehicle_id && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">المركبة:</span>
                                  <span className="font-medium">
                                    {vehicles.find(v => v.id === formData.vehicle_id)?.vehicle_number} - 
                                    {vehicles.find(v => v.id === formData.vehicle_id)?.make} {vehicles.find(v => v.id === formData.vehicle_id)?.model}
                                  </span>
                                </div>
                              )}
                              {formData.maintenance_type && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">النوع:</span>
                                  <span className="font-medium">{formData.maintenance_type}</span>
                                </div>
                              )}
                              {formData.scheduled_date && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">التاريخ:</span>
                                  <span className="font-medium">
                                    {format(formData.scheduled_date, "dd/MM/yyyy", { locale: ar })} - {formData.scheduled_time}
                                  </span>
                                </div>
                              )}
                              {formData.cost && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">التكلفة:</span>
                                  <span className="font-medium">{formData.cost} د.ك</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <Button 
                        type="submit" 
                        className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        ✅ {editingSchedule ? 'تحديث الصيانة' : 'حفظ الصيانة'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetForm}
                        className="px-6 h-12 text-base text-gray-600 hover:bg-gray-100"
                      >
                        <RotateCcw className="w-4 h-4 ml-2" />
                        تفريغ النموذج
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddDialog(false)} 
                        className="px-6 h-12 text-base"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* قائمة الجدولة */}
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد جدولة صيانة</p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={cn(
                    "p-4 border rounded-lg space-y-3",
                    isOverdue(schedule.scheduled_date, schedule.status) && "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {schedule.vehicle_number} - {schedule.vehicle_make} {schedule.vehicle_model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.maintenance_type}
                      </div>
                      <div className="text-sm">
                        {schedule.description}
                      </div>
                      {schedule.service_provider && (
                        <div className="text-sm text-muted-foreground">
                          مقدم الخدمة: {schedule.service_provider}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(schedule.status)}
                      {isOverdue(schedule.scheduled_date, schedule.status) && (
                        <Badge variant="destructive" className="text-xs">متأخرة</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span>مجدولة: {format(new Date(schedule.scheduled_date), 'dd/MM/yyyy', { locale: ar })}</span>
                      {schedule.cost > 0 && (
                        <span className="mr-4">التكلفة: {schedule.cost.toFixed(2)} د.ك</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {schedule.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCompleted(schedule)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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