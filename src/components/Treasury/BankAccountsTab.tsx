import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Activity,
  Banknote,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BankAccountFormData {
  bank_name: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  opening_balance: number;
}

export const BankAccountsTab: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [formData, setFormData] = useState<BankAccountFormData>({
    bank_name: "",
    account_number: "",
    account_name: "",
    account_type: "checking",
    currency: "KWD",
    opening_balance: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "خطأ في تحميل الحسابات",
        description: "حدث خطأ أثناء تحميل الحسابات البنكية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          ...formData,
          current_balance: formData.opening_balance,
          tenant_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setBankAccounts(prev => [data, ...prev]);
      setShowNewAccountDialog(false);
      setFormData({
        bank_name: "",
        account_number: "",
        account_name: "",
        account_type: "checking",
        currency: "KWD",
        opening_balance: 0,
      });
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إضافة الحساب ${formData.account_name}`,
      });
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast({
        title: "خطأ في إنشاء الحساب",
        description: "حدث خطأ أثناء إنشاء الحساب البنكي",
        variant: "destructive",
      });
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      checking: "جاري",
      savings: "توفير",
      credit: "ائتماني",
      investment: "استثماري"
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "نشط" : "معطل"}
      </Badge>
    );
  };

  const filteredAccounts = bankAccounts.filter(account => {
    const matchesSearch = 
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_number.includes(searchTerm);
    
    const matchesType = selectedType === "all" || account.account_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.current_balance, 0);
  const activeAccounts = bankAccounts.filter(account => account.is_active).length;

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold text-primary">
                  {totalBalance.toLocaleString()} د.ك
                </p>
              </div>
              <Banknote className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الحسابات النشطة</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeAccounts}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="rtl-flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الحسابات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bankAccounts.length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <div className="rtl-flex justify-between items-center">
            <CardTitle className="rtl-title">الحسابات البنكية</CardTitle>
            <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  حساب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="rtl-title">إضافة حساب بنكي جديد</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل الحساب البنكي الجديد
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name" className="rtl-label">اسم البنك</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      placeholder="مثال: البنك الأهلي الكويتي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name" className="rtl-label">اسم الحساب</Label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      placeholder="مثال: الحساب الجاري الرئيسي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number" className="rtl-label">رقم الحساب</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                      placeholder="رقم الحساب"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_type" className="rtl-label">نوع الحساب</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({...formData, account_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">جاري</SelectItem>
                        <SelectItem value="savings">توفير</SelectItem>
                        <SelectItem value="credit">ائتماني</SelectItem>
                        <SelectItem value="investment">استثماري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opening_balance" className="rtl-label">الرصيد الافتتاحي</Label>
                    <Input
                      id="opening_balance"
                      type="number"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                      placeholder="0.000"
                      step="0.001"
                    />
                  </div>
                </div>
                <DialogFooter className="rtl-flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateAccount}>
                    إنشاء الحساب
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* أدوات البحث والتصفية */}
          <div className="rtl-flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="البحث في الحسابات..." 
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="checking">جاري</SelectItem>
                <SelectItem value="savings">توفير</SelectItem>
                <SelectItem value="credit">ائتماني</SelectItem>
                <SelectItem value="investment">استثماري</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadBankAccounts}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">جاري تحميل الحسابات...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الحساب</TableHead>
                  <TableHead className="text-right">البنك</TableHead>
                  <TableHead className="text-right">رقم الحساب</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الرصيد الحالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_name}</TableCell>
                    <TableCell>{account.bank_name}</TableCell>
                    <TableCell className="font-mono">{account.account_number}</TableCell>
                    <TableCell>{getAccountTypeLabel(account.account_type)}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {account.current_balance.toLocaleString()} {account.currency}
                    </TableCell>
                    <TableCell>{getStatusBadge(account.is_active)}</TableCell>
                    <TableCell>
                      <div className="rtl-flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && filteredAccounts.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">لا توجد حسابات</h3>
              <p className="text-muted-foreground">لم يتم العثور على حسابات بنكية</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};