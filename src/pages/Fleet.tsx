import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddVehicleForm } from '@/components/Fleet/AddVehicleForm';
import { CSVImportDialog } from '@/components/Fleet/CSVImportDialog';
import { FleetStats } from '@/components/Fleet/FleetStats';
import { VehicleList } from '@/components/Fleet/VehicleList';
import { VehicleDetailsDialog } from '@/components/Fleet/VehicleDetailsDialog';
import { EditVehicleForm } from '@/components/Fleet/EditVehicleForm';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

const Fleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();
  const vehicleService = serviceContainer.getVehicleBusinessService();

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getAllVehicles();
      setVehicles(data);
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

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditDialog(true);
  };

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأسطول</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع مركبات الأسطول</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={() => setShowCSVImport(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Upload className="w-4 h-4" />
            استيراد CSV
          </Button>
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" />
            إضافة مركبة جديدة
          </Button>
        </div>
      </div>

      <FleetStats vehicles={vehicles} />

      <VehicleList
        vehicles={vehicles}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        onAddVehicle={() => setShowAddForm(true)}
        onEditVehicle={handleEdit}
        onViewVehicle={handleView}
      />

      <AddVehicleForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={fetchVehicles}
      />

      <CSVImportDialog
        open={showCSVImport}
        onOpenChange={setShowCSVImport}
        onSuccess={fetchVehicles}
      />

      <VehicleDetailsDialog
        vehicle={selectedVehicle}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <EditVehicleForm
        vehicle={selectedVehicle}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchVehicles}
      />
    </div>
  );
};

export default Fleet;