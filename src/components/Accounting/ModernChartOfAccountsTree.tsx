
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Plus,
  Edit,
  BarChart3,
  DollarSign,
  Building,
  CreditCard,
  TrendingUp,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  current_balance: number;
  level: number;
  parent_account_id?: string;
  allow_posting: boolean;
  is_active: boolean;
  children?: Account[];
}

interface ModernChartOfAccountsTreeProps {
  accounts: Account[];
  loading?: boolean;
  onAddAccount?: (parentId?: string) => void;
  onEditAccount?: (account: Account) => void;
  onViewLedger?: (account: Account) => void;
}

const accountTypeConfig = {
  asset: {
    label: 'الأصول',
    icon: Building,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  liability: {
    label: 'الخصوم',
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  equity: {
    label: 'حقوق الملكية',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  revenue: {
    label: 'الإيرادات',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  expense: {
    label: 'المصروفات',
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

export const ModernChartOfAccountsTree: React.FC<ModernChartOfAccountsTreeProps> = ({
  accounts,
  loading = false,
  onAddAccount,
  onEditAccount,
  onViewLedger
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string>('all');

  // Build tree structure
  const accountTree = useMemo(() => {
    if (!accounts) return [];
    
    const accountMap = new Map();
    const rootAccounts: Account[] = [];

    // First pass: create map
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Second pass: build tree
    accounts.forEach(account => {
      const accountNode = accountMap.get(account.id);
      if (account.parent_account_id) {
        const parent = accountMap.get(account.parent_account_id);
        if (parent) {
          parent.children.push(accountNode);
        }
      } else {
        rootAccounts.push(accountNode);
      }
    });

    return rootAccounts;
  }, [accounts]);

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    if (!searchTerm && selectedType === 'all') return accountTree;
    
    const filterAccount = (account: Account): Account | null => {
      const matchesSearch = !searchTerm || 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code.includes(searchTerm);
      
      const matchesType = selectedType === 'all' || account.account_type === selectedType;
      
      const filteredChildren = account.children?.map(filterAccount).filter(Boolean) || [];
      
      if (matchesSearch && matchesType) {
        return { ...account, children: filteredChildren };
      } else if (filteredChildren.length > 0) {
        return { ...account, children: filteredChildren };
      }
      
      return null;
    };

    return accountTree.map(filterAccount).filter(Boolean) as Account[];
  }, [accountTree, searchTerm, selectedType]);

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  const AccountNode: React.FC<{ account: Account; depth: number }> = ({ account, depth }) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    const config = accountTypeConfig[account.account_type];
    const IconComponent = config.icon;

    return (
      <div className="select-none">
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${config.borderColor} ${config.bgColor} mb-2`}
          style={{ marginRight: `${depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => hasChildren && toggleNode(account.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          {/* Account Icon */}
          <div className={`p-1.5 rounded ${config.bgColor}`}>
            <IconComponent className={`h-4 w-4 ${config.color}`} />
          </div>

          {/* Account Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">
                {account.account_code}
              </span>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              {!account.is_active && (
                <Badge variant="secondary" className="text-xs">
                  غير نشط
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {account.account_name}
            </p>
          </div>

          {/* Balance */}
          <div className="text-left">
            <p className="text-sm font-medium">
              {formatCurrencyKWD(account.current_balance)}
            </p>
            {account.allow_posting && (
              <Badge variant="outline" className="text-xs mt-1">
                قابل للترحيل
              </Badge>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewLedger?.(account)}>
                <Eye className="h-4 w-4 ml-2" />
                عرض دفتر الأستاذ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditAccount?.(account)}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل الحساب
              </DropdownMenuItem>
              {hasChildren && (
                <DropdownMenuItem onClick={() => onAddAccount?.(account.id)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة حساب فرعي
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {account.children?.map(child => (
              <AccountNode key={child.id} account={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title">دليل الحسابات</CardTitle>
          <Button onClick={() => onAddAccount?.()}>
            <Plus className="h-4 w-4 ml-2" />
            حساب جديد
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الحسابات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">جميع الأنواع</option>
            {Object.entries(accountTypeConfig).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map(account => (
              <AccountNode key={account.id} account={account} depth={0} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد حسابات تطابق البحث</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
