import React, { forwardRef } from 'react';
import { ChevronDown, MoreHorizontal, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  minWidth?: string;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  variant?: 'default' | 'destructive' | 'warning';
  separator?: boolean;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filterable?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  maxHeight?: string;
  stickyHeader?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  selection?: {
    selectedIds: (string | number)[];
    onSelect: (ids: (string | number)[]) => void;
    idField: keyof T;
  };
}

export function EnhancedTable<T>({
  data,
  columns,
  actions,
  loading = false,
  error,
  emptyMessage = 'لا توجد بيانات للعرض',
  searchable = false,
  searchPlaceholder = 'البحث...',
  onSearch,
  filterable = false,
  onRefresh,
  onExport,
  className,
  rowClassName,
  maxHeight = '600px',
  stickyHeader = true,
  pagination,
  selection,
}: EnhancedTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;
    
    const columnKey = String(column.key);
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderCell = (column: TableColumn<T>, row: T, index: number) => {
    const value = typeof column.key === 'string' 
      ? (row as any)[column.key] 
      : column.key;
      
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return value;
  };

  const renderActions = (row: T) => {
    if (!actions || actions.length === 0) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-muted rounded-full"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">فتح القائمة</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" dir="rtl">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.separator && index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => action.onClick(row)}
                disabled={action.disabled?.(row)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  action.variant === 'destructive' && 'text-destructive focus:text-destructive',
                  action.variant === 'warning' && 'text-orange-600 focus:text-orange-700'
                )}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* أدوات التحكم */}
      {(searchable || filterable || onRefresh || onExport) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              {searchable && (
                <div className="relative max-w-sm">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pr-10"
                    dir="rtl"
                  />
                </div>
              )}
              {filterable && (
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  فلترة
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  تصدير
                </Button>
              )}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  تحديث
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="relative">
          <ScrollArea style={{ maxHeight }} className="w-full">
            <Table>
              <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-background z-10')}>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={String(column.key)}
                      className={cn(
                        'text-right font-semibold',
                        column.align === 'center' && 'text-center',
                        column.align === 'left' && 'text-left',
                        column.sortable && 'cursor-pointer hover:bg-muted/50',
                        column.className
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth || '120px'
                      }}
                      onClick={() => column.sortable && handleSort(column)}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        {column.title}
                        {column.sortable && (
                          <ChevronDown 
                            className={cn(
                              'h-4 w-4 transition-transform',
                              sortColumn === String(column.key) && sortDirection === 'desc' && 'rotate-180'
                            )}
                          />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableHead className="w-12 text-center">الإجراءات</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + (actions ? 1 : 0)} 
                      className="text-center py-8"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جاري التحميل...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + (actions ? 1 : 0)} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={cn(
                        'hover:bg-muted/50 transition-colors',
                        rowClassName?.(row, rowIndex)
                      )}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={String(column.key)}
                          className={cn(
                            'text-right',
                            column.align === 'center' && 'text-center',
                            column.align === 'left' && 'text-left',
                            column.className
                          )}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth || '120px'
                          }}
                        >
                          {renderCell(column, row, rowIndex)}
                        </TableCell>
                      ))}
                      {actions && actions.length > 0 && (
                        <TableCell className="text-center">
                          {renderActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            صفحة {pagination.current} من {Math.ceil(pagination.total / pagination.pageSize)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onPageChange(pagination.current - 1)}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onPageChange(pagination.current + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// مكون مساعد لعرض الحالات
export const StatusBadge: React.FC<{
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  children: React.ReactNode;
}> = ({ status, variant = 'default', children }) => (
  <Badge variant={variant} className="whitespace-nowrap">
    {children}
  </Badge>
);

// مكون مساعد للإجراءات السريعة
export const QuickActions: React.FC<{
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}> = ({ actions }) => (
  <div className="flex items-center gap-1">
    {actions.map((action, index) => (
      <Button
        key={index}
        size="sm"
        variant={action.variant || 'ghost'}
        onClick={action.onClick}
        className="h-8 w-8 p-0"
        title={action.label}
      >
        {action.icon}
      </Button>
    ))}
  </div>
); 