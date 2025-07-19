import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  Building, 
  Phone, 
  Mail,
  MapPin,
  FileText,
  Star,
  TrendingUp
} from 'lucide-react';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Mock data للعملاء
  const customers = [
    {
      id: 1,
      name: "شركة الكويت التجارية",
      type: "company",
      email: "info@kuwait-trade.com",
      phone: "+965 2245 6789",
      address: "حولي، الكويت",
      totalContracts: 12,
      totalRevenue: "15,500 د.ك",
      status: "نشط",
      rating: 5,
      lastContract: "2024-01-10"
    },
    {
      id: 2,
      name: "محمد أحمد السالم",
      type: "individual",
      email: "m.salem@gmail.com",
      phone: "+965 9876 5432",
      address: "السالمية، الكويت",
      totalContracts: 3,
      totalRevenue: "2,400 د.ك",
      status: "نشط",
      rating: 4,
      lastContract: "2024-01-05"
    }
  ];

  const customerStats = [
    {
      title: "إجمالي العملاء",
      value: "125",
      change: "+8",
      icon: <Users className="w-5 h-5" />,
      description: "عميل جديد هذا الشهر"
    },
    {
      title: "الشركات",
      value: "45",
      change: "+3",
      icon: <Building className="w-5 h-5" />,
      description: "شركة جديدة"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة العملاء</h1>
            <p className="text-muted-foreground mt-1">إدارة قاعدة بيانات العملاء والمتابعة</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إضافة عميل جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {customerStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.title}</div>
                    <div className="text-xs text-green-600">{stat.change} {stat.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          customer.type === "company" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        }`}>
                          {customer.type === "company" ? <Building className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{customer.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(customer.rating)}
                          </div>
                          <Badge variant={customer.status === "نشط" ? "default" : "secondary"} className="mt-2">
                            {customer.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{customer.totalRevenue}</div>
                        <div className="text-sm text-muted-foreground">{customer.totalContracts} عقد</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Customers;