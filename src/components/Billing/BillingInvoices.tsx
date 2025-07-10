import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText,
  Download,
  Send,
  Eye,
  Search,
  Calendar,
  Filter
} from "lucide-react";

const BillingInvoices: React.FC = () => {
  const invoices = [
    {
      id: "INV-2024-001",
      tenant: "شركة البشائر الخليجية",
      plan: "خطة المؤسسة",
      amount: "500.000 د.ك",
      issueDate: "2024-01-01",
      dueDate: "2024-01-15",
      status: "مدفوع",
      statusColor: "bg-success",
      paidDate: "2024-01-10"
    },
    {
      id: "INV-2024-002",
      tenant: "مؤسسة النقل الحديث",
      plan: "خطة المتقدمة",
      amount: "300.000 د.ك",
      issueDate: "2024-01-05",
      dueDate: "2024-01-20",
      status: "معلق",
      statusColor: "bg-warning",
      paidDate: null
    },
    {
      id: "INV-2024-003",
      tenant: "شركة التوصيل السريع",
      plan: "خطة الأساسية",
      amount: "150.000 د.ك",
      issueDate: "2024-01-10",
      dueDate: "2024-01-25",
      status: "مرسل",
      statusColor: "bg-primary",
      paidDate: null
    },
    {
      id: "INV-2024-004",
      tenant: "شركة الخدمات اللوجستية",
      plan: "خطة المتقدمة",
      amount: "300.000 د.ك",
      issueDate: "2023-12-15",
      dueDate: "2023-12-30",
      status: "متأخر",
      statusColor: "bg-destructive",
      paidDate: null
    }
  ];

  const summaryStats = [
    {
      title: "إجمالي الفواتير",
      value: "24",
      subtitle: "هذا الشهر"
    },
    {
      title: "المبلغ الإجمالي",
      value: "15,750 د.ك",
      subtitle: "جميع الفواتير"
    },
    {
      title: "الفواتير المدفوعة",
      value: "20",
      subtitle: "83% من الإجمالي"
    },
    {
      title: "الفواتير المتأخرة",
      value: "2",
      subtitle: "تحتاج متابعة"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="border-primary/20">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="البحث في الفواتير..." 
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              تصفية
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              التاريخ
            </Button>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              إنشاء فاتورة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary p-3 rounded-xl">
                        <FileText className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{invoice.id}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.tenant}</p>
                        <p className="text-xs text-muted-foreground">{invoice.plan}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">المبلغ</p>
                        <p className="font-semibold">{invoice.amount}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                        <p className="font-medium">{invoice.issueDate}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">تاريخ الاستحقاق</p>
                        <p className="font-medium">{invoice.dueDate}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">الحالة</p>
                        <Badge className={`text-white ${invoice.statusColor}`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status === "معلق" && (
                          <Button variant="outline" size="sm">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Templates */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>قوالب الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-muted cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">القالب الافتراضي</h3>
                <p className="text-sm text-muted-foreground">قالب بسيط ومناسب لمعظم الفواتير</p>
              </CardContent>
            </Card>
            
            <Card className="border-muted cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">قالب تفصيلي</h3>
                <p className="text-sm text-muted-foreground">قالب مفصل مع تفاصيل الخدمات</p>
              </CardContent>
            </Card>
            
            <Card className="border-muted cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">قالب مخصص</h3>
                <p className="text-sm text-muted-foreground">قالب مخصص حسب احتياجاتك</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingInvoices;