import React, { useState, useEffect } from 'react';
import { Car, Plus, Wrench, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddVehicleForm } from '@/components/Fleet/AddVehicleForm';
import { VehicleCard } from '@/components/Fleet/VehicleCard';
import { Tables } from '@/integrations/supabase/types';

type Vehicle = Tables<'vehicles'>;

const Fleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل المركبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    needsMaintenance: vehicles.filter(v => 
      v.next_maintenance_due && new Date(v.next_maintenance_due) <= new Date()
    ).length,
  };

  const handleEdit = (vehicle: Vehicle) => {
    // TODO: Implement edit functionality
    toast({
      title: 'قريباً',
      description: 'سيتم إضافة خاصية التعديل قريباً',
    });
  };

  const handleView = (vehicle: Vehicle) => {
    // TODO: Implement view functionality  
    toast({
      title: 'قريباً',
      description: 'سيتم إضافة خاصية العرض التفصيلي قريباً',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأسطول</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع مركبات الأسطول</p>
        </div>
        
        <Button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4" />
          إضافة مركبة جديدة
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">متاحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-sm text-muted-foreground">تحت الصيانة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.needsMaintenance}</p>
                <p className="text-sm text-muted-foreground">تحتاج صيانة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المركبات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المركبات</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث في المركبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">جاري التحميل...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'لم يتم العثور على مركبات' : 'لا توجد مركبات'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? 'جرب تغيير مصطلح البحث' : 'ابدأ بإضافة مركبات للأسطول'}
              </p>
              {!searchTerm && (
                <Button 
                  className="btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة أول مركبة
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddVehicleForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={fetchVehicles}
      />
    </div>
  );
};

export default Fleet;