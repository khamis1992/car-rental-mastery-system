import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFixedAssets, useAssetMaintenance, useAssetMovements } from '@/hooks/useFixedAssets';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  Wrench, 
  Move3D,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import AddAssetDialog from './AddAssetDialog';
import AssetDetailsDialog from './AssetDetailsDialog';
import MaintenanceScheduleDialog from './MaintenanceScheduleDialog';
import AssetMovementDialog from './AssetMovementDialog';

const FixedAssetsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);

  const { assets, locations, categories, isLoading } = useFixedAssets();
  const { maintenanceRecords } = useAssetMaintenance();
  const { movements } = useAssetMovements();

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      disposed: { label: 'مستبعد', variant: 'destructive' as const },
      under_maintenance: { label: 'تحت الصيانة', variant: 'secondary' as const },
      retired: { label: 'متقاعد', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant}>{config?.label || status}</Badge>;
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      excellent: { label: 'ممتاز', variant: 'default' as const },
      good: { label: 'جيد', variant: 'secondary' as const },
      fair: { label: 'مقبول', variant: 'outline' as const },
      poor: { label: 'ضعيف', variant: 'destructive' as const },
      damaged: { label: 'تالف', variant: 'destructive' as const }
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig];
    return <Badge variant={config?.variant}>{config?.label || condition}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${amount?.toFixed(3)} د.ك`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-row-reverse">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">إدارة الأصول الثابتة</h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2 flex-row-reverse">
          <Plus className="h-4 w-4" />
          إضافة أصل جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                <p className="text-2xl font-bold">{assets?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">القيمة الإجمالية</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(assets?.reduce((sum, asset) => sum + (asset.current_book_value || 0), 0) || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تحت الصيانة</p>
                <p className="text-2xl font-bold">
                  {assets?.filter(asset => asset.status === 'under_maintenance').length || 0}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تحتاج صيانة</p>
                <p className="text-2xl font-bold text-red-600">
                  {maintenanceRecords?.filter(record => 
                    record.status === 'pending' && 
                    new Date(record.scheduled_date || '') <= new Date()
                  ).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الأصول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="under_maintenance">تحت الصيانة</SelectItem>
                <SelectItem value="disposed">مستبعد</SelectItem>
                <SelectItem value="retired">متقاعد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأصول الثابتة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رمز الأصل</TableHead>
                <TableHead className="text-right">اسم الأصل</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الحالة الفيزيائية</TableHead>
                <TableHead className="text-right">القيمة الحالية</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono">{asset.asset_code}</TableCell>
                  <TableCell className="font-medium">{asset.asset_name}</TableCell>
                  <TableCell>{asset.asset_category}</TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                  <TableCell>{formatCurrency(asset.current_book_value || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-row-reverse">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {asset.current_location || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-row-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowMaintenanceDialog(true);
                        }}
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowMovementDialog(true);
                        }}
                      >
                        <Move3D className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddAssetDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        categories={categories || []}
        locations={locations || []}
      />
      
      <AssetDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        asset={selectedAsset}
        categories={categories || []}
        locations={locations || []}
      />

      <MaintenanceScheduleDialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
        asset={selectedAsset}
      />

      <AssetMovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        asset={selectedAsset}
        locations={locations || []}
      />
    </div>
  );
};

export default FixedAssetsManagement;