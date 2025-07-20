
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, SortAsc, SortDesc } from 'lucide-react';
import { EnhancedJournalEntryRow } from './EnhancedJournalEntryRow';
import { JournalEntryDetailsDialog } from './JournalEntryDetailsDialog';
import type { GeneralLedgerEntry } from '@/services/accountingService';

interface EnhancedGeneralLedgerTableProps {
  entries: GeneralLedgerEntry[];
  loading?: boolean;
}

export const EnhancedGeneralLedgerTable: React.FC<EnhancedGeneralLedgerTableProps> = ({
  entries,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('entry_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Enhanced filtering
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || entry.reference_type === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Enhanced sorting
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue: any = a[sortField as keyof GeneralLedgerEntry];
    let bValue: any = b[sortField as keyof GeneralLedgerEntry];

    if (sortField === 'entry_date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = async (entryId: string) => {
    // In a real implementation, you would fetch the detailed entry data here
    // For now, we'll create a mock detailed entry
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      const detailedEntry = {
        ...entry,
        total_debit: entry.debit_amount,
        total_credit: entry.credit_amount,
        status: 'posted',
        created_at: new Date().toISOString(),
        lines: [
          {
            id: '1',
            account_code: '11101',
            account_name: 'النقدية في الصندوق',
            description: entry.description,
            debit_amount: entry.debit_amount,
            credit_amount: 0,
            cost_center_name: 'مركز التكلفة الرئيسي'
          },
          {
            id: '2',
            account_code: '41101',
            account_name: 'إيرادات التشغيل',
            description: entry.description,
            debit_amount: 0,
            credit_amount: entry.credit_amount
          }
        ]
      };
      setSelectedEntry(detailedEntry);
      setShowDetailsDialog(true);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الوصف أو رقم القيد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="حالة القيد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="posted">مرحل</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="reversed">معكوس</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="مصدر القيد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المصادر</SelectItem>
            <SelectItem value="manual">يدوي</SelectItem>
            <SelectItem value="contract">عقد</SelectItem>
            <SelectItem value="invoice">فاتورة</SelectItem>
            <SelectItem value="payment">دفعة</SelectItem>
            <SelectItem value="asset">أصل</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="rtl-flex">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </div>

      {/* Enhanced Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('entry_number')}
              >
                <div className="flex items-center gap-1">
                  رقم القيد
                  {getSortIcon('entry_number')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('entry_date')}
              >
                <div className="flex items-center gap-1">
                  التاريخ
                  {getSortIcon('entry_date')}
                </div>
              </TableHead>
              
              <TableHead>الوصف</TableHead>
              <TableHead className="text-right">مدين</TableHead>
              <TableHead className="text-right">دائن</TableHead>
              <TableHead className="text-right">الرصيد</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </td>
              </TableRow>
            ) : sortedEntries.length === 0 ? (
              <TableRow>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد قيود محاسبية في الفترة المحددة
                </td>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => (
                <EnhancedJournalEntryRow
                  key={entry.id}
                  entry={entry}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary */}
      {!loading && sortedEntries.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground p-2">
          <span>
            عرض {sortedEntries.length} من أصل {entries.length} قيد
          </span>
          <span>
            إجمالي المدين: {new Intl.NumberFormat('ar-KW', { style: 'currency', currency: 'KWD' })
              .format(sortedEntries.reduce((sum, entry) => sum + entry.debit_amount, 0))}
          </span>
        </div>
      )}

      {/* Details Dialog */}
      <JournalEntryDetailsDialog
        isOpen={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        entry={selectedEntry}
      />
    </div>
  );
};
