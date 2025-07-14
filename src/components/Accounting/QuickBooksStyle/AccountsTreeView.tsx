import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { accountingService } from '@/services/accountingService';
import { ChartOfAccount } from '@/types/accounting';

interface AccountNode extends ChartOfAccount {
  children: AccountNode[];
  isExpanded: boolean;
}

export const AccountsTreeView = () => {
  const [accountTree, setAccountTree] = useState<AccountNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTree, setFilteredTree] = useState<AccountNode[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accountTree, searchTerm, selectedType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await accountingService.getChartOfAccounts();
      const tree = buildAccountTree(accounts);
      setAccountTree(tree);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل دليل الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildAccountTree = (accounts: ChartOfAccount[]): AccountNode[] => {
    const accountMap = new Map<string, AccountNode>();
    const rootAccounts: AccountNode[] = [];

    // تحويل جميع الحسابات إلى عقد
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: [],
        isExpanded: account.level <= 2 // توسيع المستويات الأولى بشكل افتراضي
      });
    });

    // بناء الشجرة
    accounts.forEach(account => {
      const node = accountMap.get(account.id)!;
      if (account.parent_account_id && accountMap.has(account.parent_account_id)) {
        const parent = accountMap.get(account.parent_account_id)!;
        parent.children.push(node);
      } else {
        rootAccounts.push(node);
      }
    });

    // ترتيب الحسابات حسب الكود
    const sortByCode = (a: AccountNode, b: AccountNode) => {
      return a.account_code.localeCompare(b.account_code, undefined, { numeric: true });
    };

    rootAccounts.sort(sortByCode);
    accountMap.forEach(node => {
      node.children.sort(sortByCode);
    });

    return rootAccounts;
  };

  const filterAccounts = () => {
    if (!searchTerm && selectedType === 'all') {
      setFilteredTree(accountTree);
      return;
    }

    const filterNode = (node: AccountNode): AccountNode | null => {
      const matchesSearch = !searchTerm || 
        node.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.account_code.includes(searchTerm);
      
      const matchesType = selectedType === 'all' || node.account_type === selectedType;

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter(child => child !== null) as AccountNode[];

      if (matchesSearch && matchesType) {
        return {
          ...node,
          children: filteredChildren,
          isExpanded: true // توسيع العقد المطابقة
        };
      } else if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          isExpanded: true
        };
      }

      return null;
    };

    const filtered = accountTree
      .map(node => filterNode(node))
      .filter(node => node !== null) as AccountNode[];

    setFilteredTree(filtered);
  };

  const toggleExpansion = (nodeId: string) => {
    const toggleNode = (nodes: AccountNode[]): AccountNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return { ...node, children: toggleNode(node.children) };
      });
    };

    setAccountTree(toggleNode(accountTree));
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(Math.abs(amount));
  };

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

  const getIndentStyle = (level: number) => {
    return { paddingRight: `${level * 24}px` };
  };

  const renderAccountNode = (node: AccountNode) => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        {/* العقدة الرئيسية */}
        <div 
          className={`
            flex items-center justify-between py-2 px-4 border-b border-border/30 hover:bg-muted/20 transition-colors
            ${node.level === 1 ? 'bg-muted/40 font-bold' : ''}
            ${node.level === 2 ? 'bg-muted/20 font-semibold' : ''}
          `}
          style={getIndentStyle(node.level - 1)}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* مؤشر التوسيع */}
            <div className="w-6 flex justify-center">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpansion(node.id)}
                  className="w-4 h-4 p-0"
                >
                  {node.isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>

            {/* معلومات الحساب */}
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1 font-mono text-sm">
                {node.account_code}
              </div>
              <div className="col-span-4 font-medium">
                {node.account_name}
              </div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">
                  {getAccountTypeLabel(node.account_type)}
                </Badge>
              </div>
              <div className="col-span-2 text-right">
                <span className={`font-medium ${
                  node.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {node.current_balance !== 0 ? formatAmount(node.current_balance) : '-'}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <div className="flex items-center gap-1">
                  {node.is_active ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="text-xs">
                    {node.is_active ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* العقد الفرعية */}
        {hasChildren && node.isExpanded && (
          <div>
            {node.children.map(child => renderAccountNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>جاري تحميل دليل الحسابات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-background">
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                حساب جديد
              </Button>
            </div>
            <CardTitle className="text-xl font-bold">دليل الحسابات - عرض شجري</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* شريط البحث والفلاتر */}
          <div className="p-4 border-b bg-muted/10">
            <div className="flex gap-4">
              <Input
                placeholder="البحث في الحسابات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm text-right"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">جميع الأنواع</option>
                <option value="asset">أصول</option>
                <option value="liability">خصوم</option>
                <option value="equity">حقوق ملكية</option>
                <option value="revenue">إيرادات</option>
                <option value="expense">مصروفات</option>
              </select>
            </div>
          </div>

          {/* رؤوس الأعمدة */}
          <div className="bg-muted/50 border-b">
            <div className="flex items-center py-3 px-4 font-semibold text-sm">
              <div className="w-6"></div>
              <div className="flex-1 grid grid-cols-12 gap-4">
                <div className="col-span-1 text-right">رقم الحساب</div>
                <div className="col-span-4 text-right">اسم الحساب</div>
                <div className="col-span-2 text-right">النوع</div>
                <div className="col-span-2 text-right">الرصيد الحالي</div>
                <div className="col-span-2 text-center">الحالة</div>
                <div className="col-span-1 text-center">إجراءات</div>
              </div>
            </div>
          </div>

          {/* الشجرة */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredTree.length > 0 ? (
              filteredTree.map(node => renderAccountNode(node))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حسابات مطابقة لبحثك
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};