
import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Building,
  Car,
  Laptop,
  Wrench,
  TrendingDown,
  Calendar
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FixedAssets = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const assets = [
    {
      id: "FA-001",
      name: "تويوتا كامري 2023",
      category: "مركبات",
      purchaseDate: "2023-01-15",
      purchasePrice: "8,000.000",
      currentValue: "7,200.000",
      depreciationRate: "10%",
      status: "قيد الاستخدام",
      location: "فرع الكويت"
    },
    {
      id: "FA-002", 
      name: "هونداي إلنترا 2022",
      category: "مركبات",
      purchaseDate: "2022-06-20",
      purchasePrice: "7,500.000",
      currentValue: "6,000.000",
      depreciationRate: "20%",
      status: "قيد الاستخدام",
      location: "فرع الأحمدي"
    },
    {
      id: "FA-003",
      name: "مكتب إداري - الطابق الأول",
      category: "مباني ومنشآت",
      purchaseDate: "2020-03-10",
      purchasePrice: "50,000.000",
      currentValue: "42,500.000",
      depreciationRate: "5%",
      status: "قيد الاستخدام",
      location: "المقر الرئيسي"
    },
    {
      id: "FA-004",
      name: "أجهزة كمبيوتر مكتبية",
      category: "معدات مكتبية",
      purchaseDate: "2023-05-15",
      purchasePrice: "3,000.000",
      currentValue: "2,400.000",
      depreciationRate: "20%",
      status: "قيد الاستخدام",
      location: "المقر الرئيسي"
    }
  ];

  const assetStats = [
    {
      title: "إجمالي الأصول",
      value: "68,500 د.ك",
      description: "القيمة الحالية",
      icon: <Building className="w-5 h-5 text-blue-500" />
    },
    {
      title: "المركبات",
      value: "13",
      description: "مركبة نشطة",
      icon: <Car className="w-5 h-5 text-green-500" />
    },
    {
      title: "الإهلاك السنوي",
      value: "8,500 د.ك",
      description: "متوقع هذا العام",
      icon: <TrendingDown className="w-5 h-5 text-orange-500" />
    },
    {
      title: "أصول تحتاج صيانة",
      value: "3",
      description: "صيانة مجدولة",
      icon: <Wrench className="w-5 h-5 text-red-500" />
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'مركبات':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'مباني ومنشآت':
        return <Building className="w-4 h-4 text-green-500" />;
      case 'معدات مكتبية':
        return <Laptop className="w-4 h-4 text-purple-500" />;
      default:
        return <Building className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">الأصول الثابتة</h1>
            <p className="text-muted-foreground">إدارة وتتبع الأصول الثابتة والإهلاك</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button className="btn-primary rtl-flex">
              <Plus className="w-4 h-4" />
              أصل جديد
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Calendar className="w-4 h-4" />
              تقرير الإهلاك
            </Button>
          </div>
        </div>

        {/* Asset Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الأصول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Assets Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">قائمة الأصول الثابتة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الأصل</TableHead>
                  <TableHead className="text-right">اسم الأصل</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">تاريخ الشراء</TableHead>
                  <TableHead className="text-right">سعر الشراء</TableHead>
                  <TableHead className="text-right">القيمة الحالية</TableHead>
                  <TableHead className="text-right">نسبة الإهلاك</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {asset.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        {getCategoryIcon(asset.category)}
                        <span className="text-sm">{asset.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{asset.purchaseDate}</TableCell>
                    <TableCell className="font-mono">{asset.purchasePrice} د.ك</TableCell>
                    <TableCell className="font-mono font-semibold text-green-600">
                      {asset.currentValue} د.ك
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {asset.depreciationRate}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {asset.location}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FixedAssets;
