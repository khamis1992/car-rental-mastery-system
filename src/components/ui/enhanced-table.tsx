
import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  RefreshCw, 
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: any) => boolean;
  separator?: boolean;
}

interface EnhancedTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  emptyMessage?: string;
  maxHeight?: string;
  stickyHeader?: boolean;
}

export const EnhancedTable: React.FC<EnhancedTableProps> = ({
  data,
  columns,
  actions = [],
  searchable = false,
  searchPlaceholder = "البحث...",
  onRefresh,
  emptyMessage = "لا توجد بيانات",
  maxHeight,
  stickyHeader = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [refreshing, setRefreshing] = useState(false);

  console.log('🔄 EnhancedTable rendered:', { 
    dataCount: data?.length || 0, 
    columnsCount: columns?.length || 0,
    actionsCount: actions?.length || 0,
    searchQuery 
  });

  // تصفية البيانات مع معالجة الأخطاء
  const filteredData = useMemo(() => {
    try {
      if (!searchQuery || !data) return data || [];
      
      return data.filter(row => {
        if (!row) return false;
        return columns.some(column => {
          const value = row[column.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    } catch (error) {
      console.error('❌ Error filtering data:', error);
      return data || [];
    }
  }, [data, searchQuery, columns]);

  // ترتيب البيانات مع معالجة الأخطاء
  const sortedData = useMemo(() => {
    try {
      if (!sortField || !filteredData) return filteredData || [];
      
      return [...filteredData].sort((a, b) => {
        if (!a || !b) return 0;
        
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        const comparison = String(aValue).localeCompare(String(bValue), 'ar');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } catch (error) {
      console.error('❌ Error sorting data:', error);
      return filteredData || [];
    }
  }, [filteredData, sortField, sortDirection]);

  const handleSort = (columnKey: string) => {
    try {
      console.log('📊 Sort requested:', columnKey);
      if (sortField === columnKey) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(columnKey);
        setSortDirection('asc');
      }
    } catch (error) {
      console.error('❌ Error in handleSort:', error);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    console.log('🔄 Refresh requested');
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderActions = (row: any) => {
    if (!actions || actions.length === 0 || !row) return null;

    console.log('⚙️ Rendering actions for row:', row.id);

    try {
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {actions.map((action, index) => {
                if (!action) return null;
                
                const isDisabled = action.disabled?.(row) || false;
                
                return (
                  <div key={`action-${index}-${row.id || index}`}>
                    {action.separator && index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          if (!isDisabled && action.onClick) {
                            console.log(`🎯 Action "${action.label}" clicked for row:`, row.id);
                            action.onClick(row);
                          }
                        } catch (error) {
                          console.error('❌ Error executing action:', error);
                        }
                      }}
                      disabled={isDisabled}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.icon && (
                        <span className="ml-2">
                          {action.icon}
                        </span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } catch (error) {
      console.error('❌ Error rendering actions:', error);
      return null;
    }
  };

  // التحقق من البيانات الأساسية
  if (!data || !columns) {
    console.warn('⚠️ EnhancedTable: Missing required props', { data: !!data, columns: !!columns });
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          خطأ في تحميل البيانات
        </CardContent>
      </Card>
    );
  }

  try {
    return (
      <Card>
        {(searchable || onRefresh) && (
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              {searchable && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              )}
            </div>
          </CardHeader>
        )}
        
        <CardContent className="p-0">
          <div 
            className="overflow-auto"
            style={{ maxHeight: maxHeight || 'none' }}
          >
            <Table>
              <TableHeader className={stickyHeader ? 'sticky top-0 bg-background z-10' : ''}>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`text-${column.align || 'right'}`}
                    >
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-medium hover:bg-transparent"
                        >
                          {column.title}
                          {sortField === column.key && (
                            <span className="mr-1">
                              {sortDirection === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </Button>
                      ) : (
                        column.title
                      )}
                    </TableHead>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableHead className="text-center w-16">الإجراءات</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, index) => {
                    if (!row) return null;
                    
                    return (
                      <TableRow key={row.id || `row-${index}`}>
                        {columns.map((column) => (
                          <TableCell
                            key={`${row.id || index}-${column.key}`}
                            className={`text-${column.align || 'right'}`}
                          >
                            {column.render
                              ? column.render(row[column.key], row)
                              : row[column.key]
                            }
                          </TableCell>
                        ))}
                        {actions && actions.length > 0 && (
                          <TableCell className="text-center">
                            {renderActions(row)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('❌ Critical error in EnhancedTable render:', error);
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          حدث خطأ في عرض الجدول
        </CardContent>
      </Card>
    );
  }
};
