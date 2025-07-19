import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Mock data للفواتير
  const invoices = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      customerName: "شركة الكويت التجارية",
      contractNumber: "CT-2024-001",
      issueDate: "2024-01-15",
      dueDate: "2024-01-25",
      totalAmount: "1,500 د.ك",
      paidAmount: "1,500 د.ك",
      remainingAmount: "0 د.ك",
      status: "مدفوعة",
      paymentDate: "2024-01-20",
      description: "إيجار شهري - تويوتا كامری",
      taxAmount: "75 د.ك",
      subTotal: "1,425 د.ك",
      paymentMethod: "تحويل بنكي"
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      customerName: "محمد أحمد السالم",
      contractNumber: "CT-2024-002",
      issueDate: "2024-01-10",
      dueDate: "2024-01-20",
      totalAmount: "200 د.ك",
      paidAmount: "100 د.ك",
      remainingAmount: "100 د.ك",
      status: "جزئية",
      paymentDate: "2024-01-12",
      description: "إيجار أسبوعي - نيسان التيما",
      taxAmount: "10 د.ك",
      subTotal: "190 د.ك",
      paymentMethod: "نقدي"
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      customerName: "فاطمة العلي",
      contractNumber: "CT-2024-003",
      issueDate: "2024-01-18",
      dueDate: "2024-01-28",
      totalAmount: "80 د.ك",
      paidAmount: "0 د.ك",
      remainingAmount: "80 د.ك",
      status: "معلقة",
      paymentDate: null,
      description: "إيجار يومي - هيونداي إلنترا",
      taxAmount: "4 د.ك",
      subTotal: "76 د.ك",
      paymentMethod: null
    },
    {
      id: 4,
      invoiceNumber: "INV-2024-004",
      customerName: "شركة الخليج للنقل",
      contractNumber: "CT-2024-004",
      issueDate: "2024-01-05",
      dueDate: "2024-01-15",
      totalAmount: "800 د.ك",
      paidAmount: "800 د.ك",
      remainingAmount: "0 د.ك",
      status: "مدفوعة",
      paymentDate: "2024-01-14",
      description: "إيجار أسبوعي - فورد إكسبلورر",
      taxAmount: "40 د.ك",
      subTotal: "760 د.ك",
      paymentMethod: "شيك"
    },
    {
      id: 5,
      invoiceNumber: "INV-2024-005",
      customerName: "أحمد الخالد",
      contractNumber: "CT-2024-005",
      issueDate: "2024-01-12",
      dueDate: "2024-01-02",
      totalAmount: "150 د.ك",
      paidAmount: "0 د.ك",
      remainingAmount: "150 د.ك",
      status: "متأخرة",
      paymentDate: null,
      description: "إيجار يومي - كيا سيراتو",
      taxAmount: "7.5 د.ك",
      subTotal: "142.5 د.ك",
      paymentMethod: null
    }
  ];

  const invoiceStats = [
    {
      title: "إجمالي الفواتير",
      value: "245",
      change: "+18",
      icon: <Receipt className="w-5 h-5" />,
      description: "فاتورة هذا الشهر"
    },
    {
      title: "الفواتير المدفوعة",
      value: "189",
      change: "+15",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "فاتورة مدفوعة"
    },
    {
      title: "إجمالي الإيرادات",
      value: "45,680 د.ك",
      change: "+22%",
      icon: <DollarSign className="w-5 h-5" />,
      description: "هذا الشهر"
    },
    {
      title: "المتأخرات",
      value: "8,250 د.ك",
      change: "-5%",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "مبلغ متأخر"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "مدفوعة":
        return <Badge className="bg-green-100 text-green-800">مدفوعة</Badge>;
      case "معلقة":
        return <Badge className="bg-yellow-100 text-yellow-800">معلقة</Badge>;
      case "جزئية":
        return <Badge className="bg-blue-100 text-blue-800">جزئية</Badge>;
      case "متأخرة":
        return <Badge className="bg-red-100 text-red-800">متأخرة</Badge>;
      case "ملغية":
        return <Badge className="bg-gray-100 text-gray-800">ملغية</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "مدفوعة":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "معلقة":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "جزئية":
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case "متأخرة":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === "all" || 
                      (selectedTab === "paid" && invoice.status === "مدفوعة") ||
                      (selectedTab === "pending" && invoice.status === "معلقة") ||
                      (selectedTab === "partial" && invoice.status === "جزئية") ||
                      (selectedTab === "overdue" && invoice.status === "متأخرة");
    return matchesSearch && matchesTab;
  });

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الفواتير</h1>
            <p className="text-muted-foreground mt-1">إصدار ومتابعة الفواتير والمدفوعات</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء فاتورة جديدة
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {invoiceStats.map((stat, index) => (
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

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                قائمة الفواتير
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="البحث في الفواتير..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 ml-2" />
                  تصفية
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">الكل ({invoices.length})</TabsTrigger>
                <TabsTrigger value="paid">المدفوعة ({invoices.filter(i => i.status === "مدفوعة").length})</TabsTrigger>
                <TabsTrigger value="pending">المعلقة ({invoices.filter(i => i.status === "معلقة").length})</TabsTrigger>
                <TabsTrigger value="partial">الجزئية ({invoices.filter(i => i.status === "جزئية").length})</TabsTrigger>
                <TabsTrigger value="overdue">المتأخرة ({invoices.filter(i => i.status === "متأخرة").length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={selectedTab} className="mt-6">
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          {/* Invoice Info */}
                          <div className="lg:col-span-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{invoice.customerName}</span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  عقد: {invoice.contractNumber}
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                  {getStatusIcon(invoice.status)}
                                  {getStatusBadge(invoice.status)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dates & Description */}
                          <div className="lg:col-span-4 space-y-3">
                            <div>
                              <div className="text-sm font-medium">{invoice.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">تاريخ الإصدار: {invoice.issueDate}</div>
                                <div className="text-sm text-muted-foreground">تاريخ الاستحقاق: {invoice.dueDate}</div>
                              </div>
                            </div>
                            {invoice.paymentDate && (
                              <div className="text-sm text-green-600">
                                تاريخ الدفع: {invoice.paymentDate}
                              </div>
                            )}
                            {invoice.paymentMethod && (
                              <div className="text-sm text-muted-foreground">
                                طريقة الدفع: {invoice.paymentMethod}
                              </div>
                            )}
                          </div>

                          {/* Financial & Actions */}
                          <div className="lg:col-span-4">
                            <div className="grid grid-cols-1 gap-3 mb-4">
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-muted-foreground">المجموع الفرعي</span>
                                <span className="font-medium">{invoice.subTotal}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-muted-foreground">الضريبة</span>
                                <span className="font-medium">{invoice.taxAmount}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm text-muted-foreground">إجمالي المبلغ</span>
                                <span className="font-bold text-blue-600">{invoice.totalAmount}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-sm text-muted-foreground">المبلغ المدفوع</span>
                                <span className="font-bold text-green-600">{invoice.paidAmount}</span>
                              </div>
                              {invoice.remainingAmount !== "0 د.ك" && (
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                  <span className="text-sm text-muted-foreground">المبلغ المتبقي</span>
                                  <span className="font-bold text-red-600">{invoice.remainingAmount}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 ml-2" />
                                عرض
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 ml-2" />
                                تحميل
                              </Button>
                              <Button variant="outline" size="sm">
                                <Send className="w-4 h-4 ml-2" />
                                إرسال
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Invoices;