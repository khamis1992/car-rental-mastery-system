import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Building2,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { TreasuryTransactionForm } from "@/components/Treasury/TreasuryTransactionForm";
import { BankAccountsTab } from "@/components/Treasury/BankAccountsTab";
import BankReconciliation from "@/components/BankReconciliation/BankReconciliation";
import { useToast } from "@/hooks/use-toast";

const Treasury = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // بيانات وهمية للعرض
  const treasuryOverview = {
    totalCash: 125000.750,
    totalBankBalances: 458000.250,
    todayReceipts: 25000.000,
    todayPayments: 18500.500,
    pendingTransactions: 12,
    bankAccounts: 4
  };

  const recentTransactions = [
    {
      id: "CSH000001",
      type: "receipt",
      amount: 5000.000,
      description: "استلام دفعة من العقد رقم CON-2024-001",
      date: "2024-01-15",
      status: "posted",
      reference: "CON-2024-001"
    },
    {
      id: "CSH000002", 
      type: "payment",
      amount: 2500.500,
      description: "دفع فاتورة مورد",
      date: "2024-01-15",
      status: "approved",
      reference: "SUP-2024-001"
    },
    {
      id: "CSH000003",
      type: "transfer",
      amount: 10000.000,
      description: "تحويل بين الحسابات",
      date: "2024-01-14", 
      status: "posted",
      reference: "TRF-001"
    }
  ];

  const bankAccounts = [
    {
      id: "1",
      name: "الحساب الجاري - البنك الأهلي",
      accountNumber: "123456789",
      currentBalance: 125000.750,
      currency: "KWD",
      status: "active",
      lastUpdate: "2024-01-15 14:30"
    },
    {
      id: "2", 
      name: "حساب التوفير - بنك الكويت الوطني",
      accountNumber: "987654321",
      currentBalance: 250000.000,
      currency: "KWD", 
      status: "active",
      lastUpdate: "2024-01-15 09:15"
    },
    {
      id: "3",
      name: "صندوق الشركة الرئيسي",
      accountNumber: "CASH-001",
      currentBalance: 15000.500,
      currency: "KWD",
      status: "active", 
      lastUpdate: "2024-01-15 16:45"
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "receipt":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "payment":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "معلق", icon: Clock },
      approved: { variant: "default" as const, label: "معتمد", icon: CheckCircle },
      posted: { variant: "default" as const, label: "مرحّل", icon: CheckCircle },
      cancelled: { variant: "destructive" as const, label: "ملغي", icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="rtl-flex">
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  // معالج إنشاء معاملة جديدة
  const handleCreateTransaction = async (data: any) => {
    setIsSubmitting(true);
    try {
      // هنا ستكون منطق إرسال البيانات للخادم
      console.log("إنشاء معاملة جديدة:", data);
      
      // محاكاة انتظار API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم إنشاء المعاملة بنجاح",
        description: `تم إضافة ${data.transaction_type === "deposit" ? "إيداع" : data.transaction_type === "withdrawal" ? "سحب" : "معاملة"} بمبلغ ${data.amount} د.ك`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء المعاملة",
        description: "حدث خطأ أثناء إنشاء المعاملة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="rtl-flex justify-between items-center">
        <div>
          <h1 className="rtl-title">نظام الخزينة والبنوك</h1>
          <p className="text-muted-foreground mt-2">
            إدارة المعاملات النقدية والحسابات البنكية والتسويات
          </p>
        </div>
        <div className="rtl-flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button size="sm" onClick={() => setShowTransactionForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            معاملة جديدة
          </Button>
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي النقدية</p>
                <p className="text-2xl font-bold text-green-600">
                  {treasuryOverview.totalCash.toLocaleString()} د.ك
                </p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">أرصدة البنوك</p>
                <p className="text-2xl font-bold text-blue-600">
                  {treasuryOverview.totalBankBalances.toLocaleString()} د.ك
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مقبوضات اليوم</p>
                <p className="text-2xl font-bold text-green-600">
                  {treasuryOverview.todayReceipts.toLocaleString()} د.ك
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مدفوعات اليوم</p>
                <p className="text-2xl font-bold text-red-600">
                  {treasuryOverview.todayPayments.toLocaleString()} د.ك
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="rtl-flex">
            <DollarSign className="h-4 w-4 ml-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rtl-flex">
            <FileText className="h-4 w-4 ml-2" />
            المعاملات
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rtl-flex">
            <Building2 className="h-4 w-4 ml-2" />
            الحسابات البنكية
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="rtl-flex">
            <CheckCircle className="h-4 w-4 ml-2" />
            التسويات
          </TabsTrigger>
          <TabsTrigger value="reports" className="rtl-flex">
            <FileText className="h-4 w-4 ml-2" />
            التقارير
          </TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* المعاملات الأخيرة */}
            <Card>
              <CardHeader className="rtl-flex justify-between items-center">
                <CardTitle className="rtl-title">المعاملات الأخيرة</CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 ml-2" />
                  عرض الكل
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="rtl-flex items-center justify-between p-3 border rounded-lg">
                      <div className="rtl-flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.id} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${
                          transaction.type === "receipt" ? "text-green-600" : 
                          transaction.type === "payment" ? "text-red-600" : "text-blue-600"
                        }`}>
                          {transaction.type === "payment" ? "-" : "+"}
                          {transaction.amount.toLocaleString()} د.ك
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الحسابات البنكية */}
            <Card>
              <CardHeader className="rtl-flex justify-between items-center">
                <CardTitle className="rtl-title">الحسابات البنكية</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  حساب جديد
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="p-3 border rounded-lg">
                      <div className="rtl-flex items-center justify-between mb-2">
                        <h4 className="font-medium">{account.name}</h4>
                        <Badge variant="outline">{account.currency}</Badge>
                      </div>
                      <div className="rtl-flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            رقم الحساب: {account.accountNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            آخر تحديث: {account.lastUpdate}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {account.currentBalance.toLocaleString()} د.ك
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب المعاملات */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="rtl-flex justify-between items-center">
                <CardTitle className="rtl-title">سجل المعاملات النقدية</CardTitle>
                <Button onClick={() => setShowTransactionForm(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  معاملة جديدة
                </Button>
              </div>
              
              {/* أدوات البحث والتصفية */}
              <div className="rtl-flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="البحث في المعاملات..." className="pr-10" />
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="نوع المعاملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المعاملات</SelectItem>
                    <SelectItem value="receipt">مقبوضات</SelectItem>
                    <SelectItem value="payment">مدفوعات</SelectItem>
                    <SelectItem value="transfer">تحويلات</SelectItem>
                  </SelectContent>
                </Select>
                <DatePickerWithRange 
                  date={selectedDateRange}
                  onDateChange={setSelectedDateRange}
                />
                <Button variant="outline">
                  <Filter className="h-4 w-4 ml-2" />
                  تصفية
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* جدول المعاملات */}
              <div className="border rounded-lg">
                <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 font-medium text-sm border-b">
                  <div>رقم المعاملة</div>
                  <div>النوع</div>
                  <div>المبلغ</div>
                  <div>الوصف</div>
                  <div>التاريخ</div>
                  <div>الحالة</div>
                  <div>الإجراءات</div>
                </div>
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/25">
                    <div className="font-medium">{transaction.id}</div>
                    <div className="rtl-flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      {transaction.type === "receipt" ? "مقبوضات" : 
                       transaction.type === "payment" ? "مدفوعات" : "تحويل"}
                    </div>
                    <div className={`font-medium ${
                      transaction.type === "receipt" ? "text-green-600" : 
                      transaction.type === "payment" ? "text-red-600" : "text-blue-600"
                    }`}>
                      {transaction.type === "payment" ? "-" : "+"}
                      {transaction.amount.toLocaleString()} د.ك
                    </div>
                    <div className="text-sm">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    <div>{getStatusBadge(transaction.status)}</div>
                    <div className="rtl-flex gap-2">
                      <Button variant="outline" size="sm">عرض</Button>
                      <Button variant="outline" size="sm">تعديل</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الحسابات البنكية */}
        <TabsContent value="accounts">
          <BankAccountsTab />
        </TabsContent>

        {/* تبويب التسويات البنكية */}
        <TabsContent value="reconciliation">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">تقارير الخزينة</h3>
              <p className="text-muted-foreground">قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج المعاملة الجديدة */}
      <TreasuryTransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        onSubmit={handleCreateTransaction}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Treasury;