import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Navigation, 
  Users, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { officeLocationService, OfficeLocation } from '@/services/officeLocationService';
import OfficeLocationForm from './OfficeLocationForm';

const OfficeLocationManager: React.FC = () => {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OfficeLocation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLocations = async () => {
    setLoading(true);
    try {
      const result = await officeLocationService.getAll();
      if (result.error) {
        throw result.error;
      }
      setLocations(result.data || []);
    } catch (error) {
      console.error('خطأ في جلب مواقع المكاتب:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب مواقع المكاتب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowForm(true);
  };

  const handleEditLocation = (location: OfficeLocation) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleDeleteLocation = async (location: OfficeLocation) => {
    if (!confirm(`هل أنت متأكد من حذف موقع "${location.name}"؟`)) {
      return;
    }

    setDeletingId(location.id);
    try {
      const result = await officeLocationService.delete(location.id);
      if (result.error) {
        throw result.error;
      }

      toast({
        title: "نجح",
        description: "تم حذف موقع المكتب بنجاح"
      });

      loadLocations();
    } catch (error) {
      console.error('خطأ في حذف موقع المكتب:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف موقع المكتب",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (location: OfficeLocation) => {
    try {
      const result = await officeLocationService.toggleActive(location.id, !location.is_active);
      if (result.error) {
        throw result.error;
      }

      toast({
        title: "نجح",
        description: `تم ${!location.is_active ? 'تفعيل' : 'إلغاء تفعيل'} موقع المكتب`
      });

      loadLocations();
    } catch (error) {
      console.error('خطأ في تغيير حالة موقع المكتب:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير حالة موقع المكتب",
        variant: "destructive"
      });
    }
  };

  const openInMap = (location: OfficeLocation) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="mr-2">جاري تحميل مواقع المكاتب...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="bg-white dark:bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-6" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
        <div className="flex items-center justify-between">
          {/* زر الإضافة على اليسار */}
          <Button onClick={handleAddLocation} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة موقع جديد
          </Button>
          
          {/* العنوان والوصف على اليمين */}
          <div className="text-right">
            {/* العنوان الرئيسي */}
            <div className="flex items-center gap-3 justify-end mb-2">
              <h1 className="text-2xl font-bold text-foreground">إدارة مواقع المكاتب</h1>
              <div className="text-2xl">🏢</div>
            </div>
            
            {/* السطر الفرعي */}
            <div className="flex items-center gap-2 justify-end">
              <p className="text-muted-foreground text-base">إدارة المواقع المسموحة لتسجيل الحضور</p>
              <div className="text-lg">📍</div>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">المواقع المعطلة</p>
                <p className="text-xl font-bold text-orange-600">
                  {locations.filter(l => !l.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">المواقع النشطة</p>
                <p className="text-xl font-bold text-green-600">
                  {locations.filter(l => l.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المواقع</p>
                <p className="text-xl font-bold">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المواقع */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مواقع مكاتب</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة موقع المكتب الأول لتمكين نظام الحضور
            </p>
            <Button onClick={handleAddLocation} className="btn-primary">
              <Plus className="w-4 h-4 ml-2" />
              إضافة موقع جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-card rounded-xl border border-border/50" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              <CardContent className="p-6">
                {/* رأس البطاقة - الاسم والحالة */}
                <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={location.is_active ? "default" : "secondary"} className="px-3 py-1 text-sm font-medium">
                      {location.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                  <h4 className="text-xl font-semibold text-right">{location.name}</h4>
                </div>
                
                {/* تفاصيل الموقع */}
                <div className="space-y-3 text-right mb-6">
                  {location.address && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground text-sm">{location.address}</span>
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-mono text-sm">{formatCoordinates(location.latitude, location.longitude)}</span>
                    <span className="text-muted-foreground text-sm">الإحداثيات:</span>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm">{location.radius} متر</span>
                    <span className="text-muted-foreground text-sm">النطاق:</span>
                  </div>
                </div>
                
                {/* شريط الأزرار */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                  {/* الأزرار على اليسار */}
                  <div className="flex items-center gap-2">
                    {/* حذف */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLocation(location)}
                          disabled={deletingId === location.id}
                          className="p-2 h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                        >
                          {deletingId === location.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>حذف الموقع</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* تعديل */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLocation(location)}
                          className="p-2 h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>تعديل الموقع</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* فتح في الخريطة */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInMap(location)}
                          className="p-2 h-9 w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                        >
                          <Navigation className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>فتح في خرائط جوجل</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* مفتاح التفعيل على اليمين */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {location.is_active ? 'مفعل' : 'معطل'}
                    </span>
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => handleToggleActive(location)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* تنبيه */}
      <Alert className="text-right">
        <div className="flex items-start gap-2 justify-end">
          <AlertDescription className="text-right">
            تأكد من دقة إحداثيات المواقع ونطاقاتها لضمان عمل نظام الحضور بشكل صحيح. 
            يمكن للموظفين تسجيل الحضور فقط من المواقع النشطة.
          </AlertDescription>
          <AlertCircle className="h-4 w-4" />
        </div>
      </Alert>

      {/* نموذج إضافة/تعديل موقع */}
      <OfficeLocationForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingLocation(null);
        }}
        onSuccess={loadLocations}
        editingLocation={editingLocation}
      />
      </div>
    </TooltipProvider>
  );
};

export default OfficeLocationManager;