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
          name: 'تويوتا كامري 2022',
          asset_code: 'VEH-001',
          category: 'مركبات',
          acquisition_date: '2022-01-15',
          acquisition_cost: 25000,
          accumulated_depreciation: 7500,
          book_value: 17500,
          depreciation_rate: 15,
          useful_life: 5,
          status: 'نشط',
          location: 'الفرع الرئيسي'
        },
        {
          id: '2',
          name: 'نيسان باثفايندر 2021',
          asset_code: 'VEH-002',
          category: 'مركبات',
          acquisition_date: '2021-06-10',
          acquisition_cost: 35000,
          accumulated_depreciation: 11200,
          book_value: 23800,
          depreciation_rate: 12,
          useful_life: 5,
          status: 'نشط',
          location: 'الفرع الرئيسي'
        },
        {
          id: '3',
          name: 'تويوتا كوستر 2020',
          asset_code: 'VEH-003',
          category: 'مركبات',
          acquisition_date: '2020-03-20',
          acquisition_cost: 45000,
          accumulated_depreciation: 18000,
          book_value: 27000,
          depreciation_rate: 10,
          useful_life: 10,
          status: 'نشط',
          location: 'الفرع الرئيسي'
        },
        {
          id: '4',
          name: 'ايسوزو شاحنة 2019',
          asset_code: 'VEH-004',
          category: 'مركبات',
          acquisition_date: '2019-08-05',
          acquisition_cost: 28000,
          accumulated_depreciation: 22400,
          book_value: 5600,
          depreciation_rate: 18,
          useful_life: 8,
          status: 'صيانة',
          location: 'الفرع الرئيسي'
        },
        {
          id: '5',
          name: 'هوندا أكورد 2023',
          asset_code: 'VEH-005',
          category: 'مركبات',
          acquisition_date: '2023-05-12',
          acquisition_cost: 32000,
          accumulated_depreciation: 2986,
          book_value: 29014,
          depreciation_rate: 14,
          useful_life: 5,
          status: 'نشط',
          location: 'الفرع الرئيسي'
        }
      ];
      setAssets(mockAssets);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'نشط':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'صيانة':
        return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      case 'مُستبعد':
        return <Badge className="bg-red-100 text-red-800">مُستبعد</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateSummary = () => {
    const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.acquisition_cost, 0);
    const totalBookValue = filteredAssets.reduce((sum, asset) => sum + asset.book_value, 0);
    const totalDepreciation = filteredAssets.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0);
    const monthlyDepreciation = filteredAssets.reduce((sum, asset) => sum + (asset.acquisition_cost * asset.depreciation_rate / 100 / 12), 0);

    return { 
      totalAssets: filteredAssets.length,
      totalValue, 
      totalBookValue, 
      totalDepreciation, 
      monthlyDepreciation
    };
  };

  const summary = calculateSummary();

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
                    <th className="text-right py-3 px-2">اسم الأصل</th>
                    <th className="text-right py-3 px-2">كود الأصل</th>
                    <th className="text-right py-3 px-2">الفئة</th>
                    <th className="text-right py-3 px-2">تاريخ الشراء</th>
                    <th className="text-right py-3 px-2">القيمة الأصلية</th>
                    <th className="text-right py-3 px-2">الإهلاك المجمع</th>
                    <th className="text-right py-3 px-2">القيمة الدفترية</th>
                    <th className="text-right py-3 px-2">معدل الإهلاك</th>
                    <th className="text-right py-3 px-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const depreciationPercentage = (asset.accumulated_depreciation / asset.acquisition_cost) * 100;
                    
                    return (
                      <tr key={asset.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{asset.name}</td>
                        <td className="py-3 px-2">{asset.asset_code}</td>
                        <td className="py-3 px-2">{asset.category}</td>
                        <td className="py-3 px-2 text-sm">
                          {format(new Date(asset.acquisition_date), 'yyyy/MM/dd', { locale: ar })}
                        </td>
                        <td className="py-3 px-2 text-blue-600 font-medium">
                          {asset.acquisition_cost.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2 text-red-600 font-medium">
                          {asset.accumulated_depreciation.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2 text-green-600 font-medium">
                          {asset.book_value.toLocaleString()} د.ك
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="outline">{asset.depreciation_rate}%</Badge>
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
    </div>
  );
};

export default FixedAssetsReport;