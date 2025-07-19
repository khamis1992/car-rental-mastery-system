import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Car, 
  Calculator, 
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Wrench,
  Calendar,
  Users,
  MapPin,
  Settings,
  FileBarChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetFormDialog } from "@/components/FixedAssets/AssetFormDialog";
import { AssetMaintenanceDialog } from "@/components/FixedAssets/AssetMaintenanceDialog";
import { DepreciationReportsTab } from "@/components/FixedAssets/DepreciationReportsTab";

interface FixedAsset {
  id: string;
  asset_name: string;
  asset_code: string;
  asset_category: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  book_value: number;
  purchase_date: string;
  useful_life_years: number;
  depreciation_method: string;
  status: string;
  assigned_employee_id?: string;
  location_description?: string;
  condition_status: string;
  warranty_end_date?: string;
  insurance_expiry_date?: string;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  barcode?: string;
  qr_code?: string;
  photos?: string[];
  tags?: string[];
  assigned_employee?: {
    full_name: string;
  };
}

const FixedAssets = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  // Fetch fixed assets data with employee assignments
  const { data: assets, isLoading } = useQuery({
    queryKey: ['fixed-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .select(`
          *,
          assigned_employee:employees!assigned_employee_id(first_name, last_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(asset => ({
        ...asset,
        assigned_employee: asset.assigned_employee ? {
          full_name: `${asset.assigned_employee.first_name} ${asset.assigned_employee.last_name}`
        } : null
      })) as FixedAsset[];
    }
  });

  // Calculate summary metrics
  const totalAssetValue = assets?.reduce((sum, asset) => sum + asset.purchase_cost, 0) || 0;
  const totalDepreciation = assets?.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0) || 0;
  const totalBookValue = assets?.reduce((sum, asset) => sum + asset.book_value, 0) || 0;
  const activeAssetsCount = assets?.filter(asset => asset.status === 'active').length || 0;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vehicles': return Car;
      case 'buildings': return Building2;
      case 'equipment': return Wrench;
      case 'furniture': return Settings;
      case 'computer_hardware': return Calculator;
      default: return Building2;
    }
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      case 'needs_repair': return 'destructive';
      default: return 'outline';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels = {
      excellent: "ممتازة",
      good: "جيدة", 
      fair: "مقبولة",
      poor: "ضعيفة",
      needs_repair: "تحتاج إصلاح"
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-right">الأصول الثابتة</h1>
          <p className="text-muted-foreground text-right mt-2">
            إدارة ومتابعة الأصول الثابتة والإهلاك
          </p>
        </div>
        <AssetFormDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي قيمة الأصول</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalAssetValue)}</div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {activeAssetsCount} أصل نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الإهلاك</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalDepreciation)}</div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              تراكمي منذ الشراء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">القيمة الدفترية</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalBookValue)}</div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              القيمة الحالية للأصول
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">معدل الإهلاك</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {totalAssetValue > 0 ? ((totalDepreciation / totalAssetValue) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              من إجمالي القيمة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="depreciation">تقارير الإهلاك</TabsTrigger>
          <TabsTrigger value="assignments">التعيينات</TabsTrigger>
          <TabsTrigger value="assets">قائمة الأصول</TabsTrigger>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الأصول حسب الفئة</CardTitle>
                <CardDescription className="text-right">
                  توزيع الأصول الثابتة حسب الفئات المختلفة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['vehicles', 'buildings', 'equipment', 'furniture', 'computer_hardware'].map((category) => {
                    const categoryAssets = assets?.filter(asset => 
                      asset.asset_category.toLowerCase() === category
                    ) || [];
                    const categoryValue = categoryAssets.reduce((sum, asset) => sum + asset.purchase_cost, 0);
                    const IconComponent = getCategoryIcon(category);
                    
                    return (
                      <div key={category} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                        <div className="flex flex-row-reverse items-center gap-3">
                          <IconComponent className="h-8 w-8 text-primary" />
                          <div className="text-right">
                            <p className="font-medium">
                              {category === 'vehicles' ? 'المركبات' : 
                               category === 'buildings' ? 'المباني' : 
                               category === 'equipment' ? 'المعدات' :
                               category === 'furniture' ? 'الأثاث' :
                               category === 'computer_hardware' ? 'الأجهزة الحاسوبية' : category}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {categoryAssets.length} أصل
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(categoryValue)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الأصول المضافة مؤخراً</CardTitle>
                <CardDescription className="text-right">
                  آخر الأصول المضافة للنظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assets?.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex flex-row-reverse items-center justify-between p-3 border rounded-lg">
                      <div className="text-right">
                        <p className="font-medium">{asset.asset_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(asset.purchase_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                        {asset.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">قائمة الأصول الثابتة</CardTitle>
              <CardDescription className="text-right">
                جميع الأصول الثابتة المسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  {assets?.map((asset) => (
                    <div key={asset.id} className="flex flex-row-reverse items-center justify-between p-4 border rounded-lg">
                      <div className="flex flex-row-reverse items-center gap-4">
                        <div className="text-right space-y-1">
                          <h3 className="font-semibold">{asset.asset_name}</h3>
                          <p className="text-sm text-muted-foreground">{asset.asset_code}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getConditionBadgeVariant(asset.condition_status)} className="text-xs">
                              {getConditionLabel(asset.condition_status)}
                            </Badge>
                            {asset.location_description && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {asset.location_description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>تاريخ الشراء: {new Date(asset.purchase_date).toLocaleDateString('ar-SA')}</span>
                            {asset.assigned_employee && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {asset.assigned_employee.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className="text-sm">التكلفة: {formatCurrency(asset.purchase_cost)}</p>
                        <p className="text-sm">الإهلاك: {formatCurrency(asset.accumulated_depreciation)}</p>
                        <p className="text-sm font-medium">القيمة الدفترية: {formatCurrency(asset.book_value)}</p>
                        {asset.next_maintenance_due && (
                          <p className="text-xs text-orange-600">
                            صيانة مستحقة: {new Date(asset.next_maintenance_due).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                          {asset.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <AssetMaintenanceDialog 
                          assetId={asset.id} 
                          assetName={asset.asset_name}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Wrench className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AssetFormDialog 
                          asset={asset}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Users className="h-5 w-5" />
                تعيينات الأصول
              </CardTitle>
              <CardDescription className="text-right">
                إدارة تعيين الأصول للموظفين ومتابعة المواقع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets?.filter(asset => asset.assigned_employee).map((asset) => (
                  <div key={asset.id} className="flex flex-row-reverse items-center justify-between p-4 border rounded-lg">
                    <div className="flex flex-row-reverse items-center gap-4">
                      <div className="text-right">
                        <h3 className="font-semibold">{asset.asset_name}</h3>
                        <p className="text-sm text-muted-foreground">{asset.asset_code}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3" />
                          <span>{asset.assigned_employee?.full_name}</span>
                          {asset.location_description && (
                            <>
                              <MapPin className="h-3 w-3 mr-2" />
                              <span>{asset.location_description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getConditionBadgeVariant(asset.condition_status)}>
                        {getConditionLabel(asset.condition_status)}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {!assets?.some(asset => asset.assigned_employee) && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد أصول معينة</h3>
                    <p className="text-muted-foreground mb-4">
                      لم يتم تعيين أي أصول للموظفين بعد
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation" className="space-y-6">
          <DepreciationReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FixedAssets;