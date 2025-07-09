import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-start justify-end">
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <h3 className="text-lg font-medium">إدارة مواقع المكاتب</h3>
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            إدارة المواقع المسموحة لتسجيل الحضور
          </p>
          <Button onClick={handleAddLocation} className="btn-primary mt-3">
            <Plus className="w-4 h-4 ml-2" />
            إضافة موقع جديد
          </Button>
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
        <div className="grid gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-medium">{location.name}</h4>
                      <Badge variant={location.is_active ? "default" : "secondary"}>
                        {location.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                    
                    {location.address && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {location.address}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الإحداثيات: </span>
                        <span className="font-mono">
                          {formatCoordinates(location.latitude, location.longitude)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">النطاق: </span>
                        <span>{location.radius} متر</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* التفعيل/الإلغاء */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={location.is_active}
                        onCheckedChange={() => handleToggleActive(location)}
                      />
                    </div>
                    
                    {/* فتح في الخريطة */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInMap(location)}
                      title="فتح في خرائط جوجل"
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                    
                    {/* تعديل */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {/* حذف */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLocation(location)}
                      disabled={deletingId === location.id}
                    >
                      {deletingId === location.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
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
  );
};

export default OfficeLocationManager;