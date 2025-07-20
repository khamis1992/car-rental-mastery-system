
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { accountingService } from '@/services/accountingService';
import { ChartOfAccount } from '@/types/accounting';
import { Skeleton } from '@/components/ui/skeleton';

interface SimpleChartOfAccountsTableProps {
  onAccountSelect?: (account: ChartOfAccount) => void;
}

export const SimpleChartOfAccountsTable: React.FC<SimpleChartOfAccountsTableProps> = ({
  onAccountSelect
}) => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getChartOfAccounts();
      console.log('📊 Loaded accounts:', data.length);
      
      if (Array.isArray(data)) {
        setAccounts(data);
      } else {
        console.error('Invalid accounts data:', data);
        setAccounts([]);
        toast({
          title: "خطأ في البيانات",
          description: "تنسيق بيانات الحسابات غير صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل دليل الحسابات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      account.account_name?.toLowerCase().includes(searchLower) ||
      account.account_code?.toLowerCase().includes(searchLower) ||
      account.account_type?.toLowerCase().includes(searchLower)
    );
  });

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      revenue: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">دليل الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center justify-between">
          <span>دليل الحسابات</span>
          <Badge variant="secondary">{filteredAccounts.length} حساب</Badge>
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الحسابات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
          <Button className="rtl-flex">
            <Plus className="w-4 h-4" />
            إضافة حساب
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'لا توجد حسابات مطابقة لبحثك' : 'لا توجد حسابات في دليل الحسابات'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onAccountSelect?.(account)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-right flex-1">
                    <div className="font-medium text-sm">
                      {account.account_code} - {account.account_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      المستوى: {account.level} | 
                      يسمح بالترحيل: {account.allow_posting ? 'نعم' : 'لا'}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(account.current_balance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      الرصيد الحالي
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={getAccountTypeColor(account.account_type)}
                  >
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                  
                  <Badge 
                    variant={account.is_active ? "default" : "secondary"}
                  >
                    {account.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
