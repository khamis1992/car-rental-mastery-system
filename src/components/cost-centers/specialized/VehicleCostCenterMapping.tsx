import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Car, 
  Building2, 
  Edit, 
  Trash2,
  Search,
  RefreshCw,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleCostCenterMapping {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  cost_center_id: string;
  mapping_type: 'automatic' | 'manual';
  allocation_percentage: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  created_by: string;
  vehicles?: {
    id: string;
    license_plate: string;
    make: string;
    model: string;
    vehicle_type: string;
  };
  cost_centers?: {
    id: string;
    cost_center_code: string;
    cost_center_name: string;
    cost_center_type: string;
  };
}

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_type: string;
}

interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type: string;
  is_active: boolean;
}

export const VehicleCostCenterMapping: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [newMapping, setNewMapping] = useState({
    vehicle_id: '',
    cost_center_id: '',
    allocation_percentage: 100,
    effective_from: new Date().toISOString().split('T')[0],
    mapping_type: 'manual' as const
  });

  const queryClient = useQueryClient();

  // Mock data for mappings
  const mockMappings: VehicleCostCenterMapping[] = [
    {
      id: '1',
      tenant_id: 'tenant1',
      vehicle_id: 'vehicle1',
      cost_center_id: 'cc1',
      mapping_type: 'automatic',
      allocation_percentage: 100,
      effective_from: '2024-01-01',
      effective_to: null,
      created_at: new Date().toISOString(),
      created_by: 'user1',
      vehicles: {
        id: 'vehicle1',
        license_plate: 'أ ب ج 1234',
        make: 'تويوتا',
        model: 'كامري',
        vehicle_type: 'sedan'
      },
      cost_centers: {
        id: 'cc1',
        cost_center_code: 'VT-001',
        cost_center_name: 'سيارات صغيرة',
        cost_center_type: 'vehicle_type'
      }
    },
    {
      id: '2',
      tenant_id: 'tenant1',
      vehicle_id: 'vehicle2',
      cost_center_id: 'cc2',
      mapping_type: 'manual',
      allocation_percentage: 100,
      effective_from: '2024-01-01',
      effective_to: null,
      created_at: new Date().toISOString(),
      created_by: 'user1',
      vehicles: {
        id: 'vehicle2',
        license_plate: 'ج د ه 5678',
        make: 'لكزس',
        model: 'ES',
        vehicle_type: 'luxury'
      },
      cost_centers: {
        id: 'cc2',
        cost_center_code: 'VT-004',
        cost_center_name: 'سيارات فاخرة',
        cost_center_type: 'vehicle_type'
      }
    }
  ];

  // Fetch mappings with mock data
  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['vehicle-cost-center-mappings'],
    queryFn: async (): Promise<VehicleCostCenterMapping[]> => {
      // Return mock data for now
      return mockMappings;
    }
  });

  // Fetch vehicles from existing vehicles table
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-mapping'],
    queryFn: async (): Promise<Vehicle[]> => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, license_plate, make, model, vehicle_type')
          .eq('status', 'available')
          .order('license_plate');
        
        if (error) throw error;
        return data as Vehicle[];
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        return [];
      }
    }
  });

  // Fetch cost centers
  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers-for-mapping'],
    queryFn: async (): Promise<CostCenter[]> => {
      try {
        const { data, error } = await supabase
          .from('cost_centers')
          .select('id, cost_center_code, cost_center_name, cost_center_type, is_active')
          .eq('is_active', true)
          .order('cost_center_code');
        
        if (error) throw error;
        return data as CostCenter[];
      } catch (error) {
        console.error('Error fetching cost centers:', error);
        return [];
      }
    }
  });

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: async (mappingData: any) => {
      // For now, return mock success
      return { success: true };
    },
    onSuccess: () => {
      toast.success('تم إنشاء الربط بنجاح');
      queryClient.invalidateQueries({ queryKey: ['vehicle-cost-center-mappings'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('خطأ في إنشاء الربط');
      console.error('Error creating mapping:', error);
    }
  });

  // Auto link vehicles mutation
  const autoLinkMutation = useMutation({
    mutationFn: async () => {
      // For now, return mock success
      return 5;
    },
    onSuccess: (linkedCount) => {
      toast.success(`تم ربط ${linkedCount} مركبة تلقائياً`);
      queryClient.invalidateQueries({ queryKey: ['vehicle-cost-center-mappings'] });
    },
    onError: (error) => {
      toast.error('خطأ في الربط التلقائي');
      console.error('Error auto linking:', error);
    }
  });

  const resetForm = () => {
    setNewMapping({
      vehicle_id: '',
      cost_center_id: '',
      allocation_percentage: 100,
      effective_from: new Date().toISOString().split('T')[0],
      mapping_type: 'manual'
    });
  };

  const handleCreateMapping = () => {
    if (!newMapping.vehicle_id || !newMapping.cost_center_id) {
      toast.error('يرجى اختيار المركبة ومركز التكلفة');
      return;
    }

    createMappingMutation.mutate(newMapping);
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = 
      mapping.vehicles?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.vehicles?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.cost_centers?.cost_center_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || mapping.mapping_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getMappingTypeBadge = (type: string) => {
    return type === 'automatic' ? (
      <Badge variant="default">تلقائي</Badge>
    ) : (
      <Badge variant="secondary">يدوي</Badge>
    );
  };

  const getCostCenterTypeBadge = (type: string) => {
    const typeLabels = {
      branch: 'فرع',
      vehicle_type: 'نوع مركبة',
      contract_type: 'نوع عقد',
      driver_type: 'نوع سائق'
    };
    
    return (
      <Badge variant="outline">
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ربط المركبات بمراكز التكلفة</h2>
          <p className="text-muted-foreground">
            إدارة ربط المركبات بمراكز التكلفة المختلفة
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => autoLinkMutation.mutate()}
            disabled={autoLinkMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            ربط تلقائي
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                ربط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>ربط مركبة بمركز تكلفة</DialogTitle>
                <DialogDescription>
                  اختر المركبة ومركز التكلفة المناسب
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">المركبة</Label>
                  <Select 
                    value={newMapping.vehicle_id} 
                    onValueChange={(value) => setNewMapping(prev => ({ ...prev, vehicle_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_center_id">مركز التكلفة</Label>
                  <Select 
                    value={newMapping.cost_center_id} 
                    onValueChange={(value) => setNewMapping(prev => ({ ...prev, cost_center_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مركز التكلفة" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((costCenter) => (
                        <SelectItem key={costCenter.id} value={costCenter.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {costCenter.cost_center_code} - {costCenter.cost_center_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allocation_percentage">نسبة التخصيص (%)</Label>
                  <Input
                    id="allocation_percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={newMapping.allocation_percentage}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, allocation_percentage: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_from">تاريخ البداية</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={newMapping.effective_from}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, effective_from: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleCreateMapping}
                  disabled={createMappingMutation.isPending}
                >
                  إنشاء الربط
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المركبات أو مراكز التكلفة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="automatic">ربط تلقائي</SelectItem>
                <SelectItem value="manual">ربط يدوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            ربط المركبات ({filteredMappings.length})
          </CardTitle>
          <CardDescription>
            قائمة بجميع المركبات المربوطة بمراكز التكلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المركبة</TableHead>
                  <TableHead className="text-right">مركز التكلفة</TableHead>
                  <TableHead className="text-right">نوع الربط</TableHead>
                  <TableHead className="text-right">نسبة التخصيص</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{mapping.vehicles?.license_plate}</p>
                          <p className="text-sm text-muted-foreground">
                            {mapping.vehicles?.make} {mapping.vehicles?.model}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{mapping.cost_centers?.cost_center_name}</p>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {mapping.cost_centers?.cost_center_code}
                          </Badge>
                          {getCostCenterTypeBadge(mapping.cost_centers?.cost_center_type || '')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMappingTypeBadge(mapping.mapping_type)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{mapping.allocation_percentage}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(mapping.effective_from).toLocaleDateString('ar')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};