import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, Calculator, TrendingDown, Calendar, 
  Search, Filter, Download, Settings, RefreshCw,
  Car, Truck, Bus, FileText, DollarSign, AlertCircle
} from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { accountingReportsService, FixedAsset } from '@/services/accountingReportsService';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const FixedAssetsReport = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingDepreciation, setProcessingDepreciation] = useState(false);

  useEffect(() => {
    loadFixedAssets();
  }, [vehicleTypeFilter, statusFilter]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm]);

  const loadFixedAssets = async () => {
    try {
      setLoading(true);
      const data = await accountingReportsService.getFixedAssetsReport();
      setAssets(data);
    } catch (error) {
      console.error('Error loading fixed assets:', error);
      toast.error('حدث خطأ في تحميل بيانات الأصول الثابتة');
      
      // Mock data for demonstration
      const mockAssets: FixedAsset[] = [
        {
          id: '1',
          asset_code: 'VEH-001',
          vehicle_type: 'sedan',
          plate_number: 'ABC-123',
          model: 'كامري 2022',
          year: 2022,
          purchase_date: '2022-01-15',
          purchase_value: 25000,
          depreciation_rate: 15,
          monthly_depreciation: 312.5,
          accumulated_depreciation: 7500,
          book_value: 17500,
          status: 'active',
          last_depreciation_date: '2024-01-01'
        },
        {
          id: '2',
          asset_code: 'VEH-002',
          vehicle_type: 'suv',
          plate_number: 'XYZ-456',
          model: 'باثفايندر 2021',
          year: 2021,
          purchase_date: '2021-06-10',
          purchase_value: 35000,
          depreciation_rate: 12,
          monthly_depreciation: 350,
          accumulated_depreciation: 11200,
          book_value: 23800,
          status: 'active',
          last_depreciation_date: '2024-01-01'
        },
        {
          id: '3',
          asset_code: 'VEH-003',
          vehicle_type: 'bus',
          plate_number: 'BUS-789',
          model: 'كوستر 2020',
          year: 2020,
          purchase_date: '2020-03-20',
          purchase_value: 45000,
          depreciation_rate: 10,
          monthly_depreciation: 375,
          accumulated_depreciation: 18000,
          book_value: 27000,
          status: 'active',
          last_depreciation_date: '2024-01-01'
        },
        {
          id: '4',
          asset_code: 'VEH-004',
          vehicle_type: 'truck',
          plate_number: 'TRK-101',
          model: 'ايسوزو 2019',
          year: 2019,
          purchase_date: '2019-08-05',
          purchase_value: 28000,
          depreciation_rate: 18,
          monthly_depreciation: 420,
          book_value: 5600,
          accumulated_depreciation: 22400,
          status: 'maintenance',
          last_depreciation_date: '2024-01-01'
        },
        {
          id: '5',
          asset_code: 'VEH-005',
          vehicle_type: 'sedan',
          plate_number: 'DEF-987',
          model: 'اكورد 2023',
          year: 2023,
          purchase_date: '2023-05-12',
          purchase_value: 32000,
          depreciation_rate: 14,
          monthly_depreciation: 373.33,
          accumulated_depreciation: 2986.64,
          book_value: 29013.36,
          status: 'active',
          last_depreciation_date: '2024-01-01'
        }
      ];
      setAssets(mockAssets);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (vehicleTypeFilter !== 'all') {
      filtered = filtered.filter(asset => asset.vehicle_type === vehicleTypeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  };

  const handleExport = () => {
    toast.success('جاري تصدير تقرير الأصول الثابتة...');
  };

  const processMonthlyDepreciation = async () => {
    try {
      setProcessingDepreciation(true);
      await accountingReportsService.processMonthlyDepreciation();
      toast.success('تم تطبيق الإهلاك الشهري بنجاح');
      loadFixedAssets(); // Reload data
    } catch (error) {
      toast.error('حدث خطأ في تطبيق الإهلاك الشهري');
    } finally {
      setProcessingDepreciation(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'sedan':
        return <Car className="w-5 h-5" />;
      case 'suv':
        return <Car className="w-5 h-5" />;
      case 'bus':
        return <Bus className="w-5 h-5" />;
      case 'truck':
        return <Truck className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getVehicleTypeName = (type: string) => {
    switch (type) {
      case 'sedan':
        return 'سيارة صالون';
      case 'suv':
        return 'دفع رباعي';
      case 'bus':
        return 'باص';
      case 'truck':
        return 'شاحنة';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      case 'disposed':
        return <Badge className="bg-red-100 text-red-800">مُستبعد</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateSummary = () => {
    const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.purchase_value, 0);
    const totalBookValue = filteredAssets.reduce((sum, asset) => sum + asset.book_value, 0);
    const totalDepreciation = filteredAssets.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0);
    const monthlyDepreciation = filteredAssets.reduce((sum, asset) => sum + asset.monthly_depreciation, 0);
    const depreciationRate = totalValue > 0 ? (totalDepreciation / totalValue) * 100 : 0;

    return { 
      totalAssets: filteredAssets.length,
      totalValue, 
      totalBookValue, 
      totalDepreciation, 
      monthlyDepreciation,
      depreciationRate 
    };
  };

  const summary = calculateSummary();

  // Chart data
  const assetDistributionData = assets.reduce((acc: any[], asset) => {
    const typeName = getVehicleTypeName(asset.vehicle_type);
    const existing = acc.find(item => item.name === typeName);
    if (existing) {
      existing.value += 1;
      existing.totalValue += asset.purchase_value;
    } else {
      acc.push({ 
        name: typeName, 
        value: 1, 
        totalValue: asset.purchase_value,
        color: asset.vehicle_type === 'sedan' ? '#3b82f6' : 
               asset.vehicle_type === 'suv' ? '#8b5cf6' :
               asset.vehicle_type === 'bus' ? '#10b981' : '#f59e0b'
      });
    }
    return acc;
  }, []);

  const depreciationTrendData = [
    { month: 'يناير', depreciation: 4200, book_value: 185000 },
    { month: 'فبراير', depreciation: 4200, book_value: 180800 },
    { month: 'مارس', depreciation: 4200, book_value: 176600 },
    { month: 'أبريل', depreciation: 4200, book_value: 172400 },
    { month: 'مايو', depreciation: 4200, book_value: 168200 },
    { month: 'يونيو', depreciation: 4200, book_value: 164000 }
  ];

  const ageAnalysisData = assets.map(asset => ({
    name: asset.plate_number,
    age: differenceInMonths(new Date(), new Date(asset.purchase_date)),
    depreciation_rate: asset.depreciation_rate
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">تقرير الأصول الثابتة</h2>
          <p className="text-gray-600">إدارة ومتابعة الأصول والإهلاك الشهري</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={processMonthlyDepreciation}
            disabled={processingDepreciation}
            className="flex items-center gap-2"
          >
            {processingDepreciation ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            تطبيق الإهلاك الشهري
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عدد الأصول</p>
                <p className="text-xl font-bold text-blue-600">{summary.totalAssets}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القيمة الأصلية</p>
                <p className="text-xl font-bold text-green-600">
                  {summary.totalValue.toLocaleString()} د.ك
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القيمة الدفترية</p>
                <p className="text-xl font-bold text-purple-600">
                  {summary.totalBookValue.toLocaleString()} د.ك
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الإهلاك المجمع</p>
                <p className="text-xl font-bold text-red-600">
                  {summary.totalDepreciation.toLocaleString()} د.ك
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الإهلاك الشهري</p>
                <p className="text-xl font-bold text-orange-600">
                  {summary.monthlyDepreciation.toLocaleString()} د.ك
                </p>
              </div>
              <Calculator className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="رقم اللوحة، الموديل، أو كود الأصل"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع المركبة</label>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="sedan">سيارة صالون</SelectItem>
                  <SelectItem value="suv">دفع رباعي</SelectItem>
                  <SelectItem value="bus">باص</SelectItem>
                  <SelectItem value="truck">شاحنة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="disposed">مُستبعد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الأصول حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Depreciation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه الإهلاك والقيمة الدفترية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={depreciationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} د.ك`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="depreciation" 
                  stroke="#ef4444" 
                  name="الإهلاك الشهري"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="book_value" 
                  stroke="#3b82f6" 
                  name="القيمة الدفترية"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            قائمة الأصول الثابتة ({filteredAssets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد أصول مطابقة للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2">كود الأصل</th>
                    <th className="text-right py-3 px-2">النوع</th>
                    <th className="text-right py-3 px-2">رقم اللوحة</th>
                    <th className="text-right py-3 px-2">الموديل</th>
                    <th className="text-right py-3 px-2">تاريخ الشراء</th>
                    <th className="text-right py-3 px-2">القيمة الأصلية</th>
                    <th className="text-right py-3 px-2">معدل الإهلاك</th>
                    <th className="text-right py-3 px-2">الإهلاك الشهري</th>
                    <th className="text-right py-3 px-2">الإهلاك المجمع</th>
                    <th className="text-right py-3 px-2">القيمة الدفترية</th>
                    <th className="text-right py-3 px-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const depreciationPercentage = (asset.accumulated_depreciation / asset.purchase_value) * 100;
                    
                    return (
                      <tr key={asset.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{asset.asset_code}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getVehicleIcon(asset.vehicle_type)}
                            {getVehicleTypeName(asset.vehicle_type)}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-medium">{asset.plate_number}</td>
                        <td className="py-3 px-2">{asset.model}</td>
                        <td className="py-3 px-2 text-sm">
                          {format(new Date(asset.purchase_date), 'yyyy/MM/dd', { locale: ar })}
                        </td>
                        <td className="py-3 px-2 text-blue-600 font-medium">
                          {asset.purchase_value.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="outline">{asset.depreciation_rate}%</Badge>
                        </td>
                        <td className="py-3 px-2 text-orange-600 font-medium">
                          {asset.monthly_depreciation.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-red-600 font-medium">
                              {asset.accumulated_depreciation.toLocaleString()} د.ك
                            </p>
                            <Progress value={depreciationPercentage} className="h-1 mt-1" />
                            <p className="text-xs text-gray-500 mt-1">
                              {depreciationPercentage.toFixed(1)}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-green-600 font-medium">
                          {asset.book_value.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2">
                          {getStatusBadge(asset.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Depreciation Information */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                طريقة حساب الإهلاك
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• الإهلاك الشهري = (القيمة الأصلية × معدل الإهلاك السنوي) ÷ 12</p>
                <p>• الإهلاك المجمع = الإهلاك الشهري × عدد الأشهر منذ الشراء</p>
                <p>• القيمة الدفترية = القيمة الأصلية - الإهلاك المجمع</p>
                <p>• الحد الأقصى للإهلاك: 80% من القيمة الأصلية</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                القيود المحاسبية التلقائية
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">5130101</Badge>
                  <span>مدين: مصروف إهلاك السيارات والباصات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">1210101</Badge>
                  <span>دائن: مخصص إهلاك السيارات والباصات</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  يتم تطبيق القيود تلقائياً شهرياً عند الضغط على زر "تطبيق الإهلاك الشهري"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedAssetsReport; 