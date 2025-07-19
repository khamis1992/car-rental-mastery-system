import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChartOfAccountNode, AccountTreeViewConfig, AccountSearchFilters } from '@/types/chartOfAccounts';
import { chartOfAccountsService } from '@/services/chartOfAccountsService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedChartOfAccountsTreeProps {
  onAccountSelect?: (account: ChartOfAccountNode) => void;
  onAccountEdit?: (account: ChartOfAccountNode) => void;
  onAccountCreate?: (parentAccount?: ChartOfAccountNode) => void;
  selectedAccountId?: string;
  readonly?: boolean;
}

export const EnhancedChartOfAccountsTree: React.FC<EnhancedChartOfAccountsTreeProps> = ({
  onAccountSelect,
  onAccountEdit,
  onAccountCreate,
  selectedAccountId,
  readonly = false
}) => {
  const [accounts, setAccounts] = useState<ChartOfAccountNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewConfig, setViewConfig] = useState<AccountTreeViewConfig>({
    show_balances: true,
    show_codes: true,
    show_inactive: false,
    expand_all: false,
    group_by_type: true,
    color_code_by_type: true,
    show_level_indicators: true,
    highlight_posting_accounts: true
  });
  const [filters, setFilters] = useState<AccountSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, [viewConfig, filters]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await chartOfAccountsService.getAccountsTree(viewConfig);
      setAccounts(data);
      
      // توسيع العقد المطلوبة
      if (viewConfig.expand_all) {
        const allNodeIds = new Set<string>();
        const collectNodeIds = (nodes: ChartOfAccountNode[]) => {
          nodes.forEach(node => {
            if (node.hasChildren) {
              allNodeIds.add(node.id);
            }
            if (node.children) {
              collectNodeIds(node.children);
            }
          });
        };
        collectNodeIds(data);
        setExpandedNodes(allNodeIds);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل دليل الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800 border-blue-200',
      liability: 'bg-red-100 text-red-800 border-red-200',
      equity: 'bg-purple-100 text-purple-800 border-purple-200',
      revenue: 'bg-green-100 text-green-800 border-green-200',
      expense: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatBalance = (amount: number) => {
    if (amount === 0) return '0.000';
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(3)}`;
  };

  const filteredAccounts = useMemo(() => {
    if (!searchTerm && !filters.account_type && !filters.account_category) {
      return accounts;
    }

    const filterTree = (nodes: ChartOfAccountNode[]): ChartOfAccountNode[] => {
      return nodes.filter(node => {
        let matches = true;

        if (searchTerm) {
          matches = matches && (
            node.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.account_code.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (filters.account_type) {
          matches = matches && node.account_type === filters.account_type;
        }

        if (filters.account_category) {
          matches = matches && node.account_category === filters.account_category;
        }

        // إذا كان العقدة تحتوي على أطفال مطابقين، أظهرها
        if (node.children && node.children.length > 0) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
        }

        return matches;
      }).map(node => ({
        ...node,
        children: node.children ? filterTree(node.children) : undefined
      }));
    };

    return filterTree(accounts);
  }, [accounts, searchTerm, filters]);

  const renderAccountNode = (account: ChartOfAccountNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(account.id);
    const isSelected = selectedAccountId === account.id;
    const hasChildren = account.hasChildren;
    
    return (
      <div key={account.id} className="w-full">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
            hover:bg-muted/50
            ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}
            ${viewConfig.highlight_posting_accounts && account.allow_posting ? 'border-l-4 border-l-green-500' : ''}
          `}
          style={{ paddingRight: `${depth * 24 + 8}px` }}
          onClick={() => onAccountSelect?.(account)}
        >
          {/* أيقونة التوسع */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(account.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>

          {/* مؤشر المستوى */}
          {viewConfig.show_level_indicators && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {account.level}
            </div>
          )}

          {/* رقم الحساب */}
          {viewConfig.show_codes && (
            <Badge variant="outline" className="font-mono text-xs">
              {account.account_code}
            </Badge>
          )}

          {/* نوع الحساب */}
          {viewConfig.color_code_by_type && (
            <Badge 
              variant="outline" 
              className={`text-xs ${getAccountTypeColor(account.account_type)}`}
            >
              {getAccountTypeLabel(account.account_type)}
            </Badge>
          )}

          {/* اسم الحساب */}
          <span className={`flex-1 font-medium ${!account.is_active ? 'text-muted-foreground line-through' : ''}`}>
            {account.account_name}
          </span>

          {/* الرصيد */}
          {viewConfig.show_balances && (
            <div className={`text-sm font-medium ${
              account.current_balance > 0 ? 'text-green-600' : 
              account.current_balance < 0 ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {formatBalance(account.current_balance)} د.ك
            </div>
          )}

          {/* حالة الترحيل */}
          {account.allow_posting && (
            <Badge variant="secondary" className="text-xs">
              قابل للترحيل
            </Badge>
          )}

          {/* قائمة الإجراءات */}
          {!readonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAccountEdit?.(account)}>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAccountCreate?.(account)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة حساب فرعي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {/* منطق عرض التفاصيل */}}
                  className="text-blue-600"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                {!account.is_active && (
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* العقد الفرعية */}
        {hasChildren && isExpanded && account.children && (
          <div className="mt-1">
            {account.children.map(child => renderAccountNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleExportAccounts = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      const blob = await chartOfAccountsService.exportAccounts(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-of-accounts.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'تم بنجاح',
        description: 'تم تصدير دليل الحسابات بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير دليل الحسابات',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          جاري تحميل دليل الحسابات...
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">دليل الحسابات المحسن</CardTitle>
          <div className="flex items-center gap-2">
            {!readonly && (
              <Button
                onClick={() => onAccountCreate?.()}
                size="sm"
              >
                <Plus className="w-4 h-4 ml-2" />
                حساب جديد
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportAccounts('excel')}>
                  تصدير إلى Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAccounts('csv')}>
                  تصدير إلى CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAccounts('pdf')}>
                  تصدير إلى PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 ml-2" />
              فلاتر
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAccounts}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث في دليل الحسابات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* الفلاتر المتقدمة */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <Select
              value={filters.account_type || ''}
              onValueChange={(value) => setFilters({...filters, account_type: value || undefined})}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الأنواع</SelectItem>
                <SelectItem value="asset">أصول</SelectItem>
                <SelectItem value="liability">خصوم</SelectItem>
                <SelectItem value="equity">حقوق ملكية</SelectItem>
                <SelectItem value="revenue">إيرادات</SelectItem>
                <SelectItem value="expense">مصروفات</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="show-inactive"
                checked={viewConfig.show_inactive}
                onCheckedChange={(checked) => 
                  setViewConfig({...viewConfig, show_inactive: !!checked})
                }
              />
              <label htmlFor="show-inactive" className="text-sm">عرض الحسابات غير النشطة</label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="show-balances"
                checked={viewConfig.show_balances}
                onCheckedChange={(checked) => 
                  setViewConfig({...viewConfig, show_balances: !!checked})
                }
              />
              <label htmlFor="show-balances" className="text-sm">عرض الأرصدة</label>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4">
          <div className="space-y-1 pb-4">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map(account => renderAccountNode(account))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="w-8 h-8 mb-2" />
                <p>لا توجد حسابات مطابقة للبحث</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};