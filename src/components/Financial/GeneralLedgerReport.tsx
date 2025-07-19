
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  FileText, 
  Search, 
  Filter,
  ArrowLeft,
  Building,
  CreditCard,
  BarChart3,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  current_balance: number;
  allow_posting: boolean;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_type?: string;
  reference_id?: string;
}

interface GeneralLedgerReportProps {
  selectedAccount?: Account | null;
}

const accountTypeConfig = {
  asset: { label: 'أصل', icon: Building, color: 'text-blue-600' },
  liability: { label: 'خصم', icon: CreditCard, color: 'text-red-600' },
  equity: { label: 'حقوق ملكية', icon: BarChart3, color: 'text-purple-600' },
  revenue: { label: 'إيراد', icon: TrendingUp, color: 'text-green-600' },
  expense: { label: 'مصروف', icon: DollarSign, color: 'text-orange-600' }
};

export const GeneralLedgerReport: React.FC<GeneralLedgerReportProps> = ({ 
  selectedAccount 
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    selectedAccount?.id || ''
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Update selectedAccountId when selectedAccount prop changes
  React.useEffect(() => {
    if (selectedAccount?.id) {
      setSelectedAccountId(selectedAccount.id);
    }
  }, [selectedAccount]);

  // Fetch all accounts for the dropdown
  const { data: accounts } = useQuery({
    queryKey: ['chart-of-accounts-posting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, current_balance, allow_posting')
        .eq('allow_posting', true)
        .eq('is_active', true)
        .order('account_code');
      
      if (error) throw error;
      return data as Account[];
    }
  });

  // Fetch journal entries for the selected account
  const { data: journalEntries, isLoading } = useQuery({
    queryKey: ['general-ledger', selectedAccountId, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedAccountId) return [];

      let query = supabase
        .from('journal_entry_lines')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          journal_entries (
            id,
            entry_number,
            entry_date,
            description,
            reference_type,
            reference_id
          )
        `)
        .eq('account_id', selectedAccountId)
        .order('created_at', { ascending: true });

      if (dateFrom) {
        query = query.gte('journal_entries.entry_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('journal_entries.entry_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate running balance
      let runningBalance = 0;
      return data.map((entry: any) => {
        const debitAmount = entry.debit_amount || 0;
        const creditAmount = entry.credit_amount || 0;
        runningBalance += debitAmount - creditAmount;

        return {
          id: entry.id,
          entry_number: entry.journal_entries.entry_number,
          entry_date: entry.journal_entries.entry_date,
          description: entry.description || entry.journal_entries.description,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          running_balance: runningBalance,
          reference_type: entry.journal_entries.reference_type,
          reference_id: entry.journal_entries.reference_id
        } as JournalEntry;
      });
    },
    enabled: !!selectedAccountId
  });

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!journalEntries) return [];
    if (!searchTerm) return journalEntries;

    return journalEntries.filter(entry =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entry_number.includes(searchTerm)
    );
  }, [journalEntries, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredEntries) return { totalDebit: 0, totalCredit: 0, balance: 0 };

    const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const balance = totalDebit - totalCredit;

    return { totalDebit, totalCredit, balance };
  }, [filteredEntries]);

  const currentAccount = selectedAccount || accounts?.find(acc => acc.id === selectedAccountId);
  const AccountIcon = currentAccount ? accountTypeConfig[currentAccount.account_type].icon : FileText;

  return (
    <div className="space-y-6">
      {/* Selected Account Info */}
      {currentAccount && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <AccountIcon className={`h-6 w-6 ${accountTypeConfig[currentAccount.account_type].color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentAccount.account_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {currentAccount.account_code}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {accountTypeConfig[currentAccount.account_type].label}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrencyKWD(currentAccount.current_balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <FileText className="h-5 w-5" />
            دفتر الأستاذ العام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">اختيار الحساب</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">اختر حساباً</option>
                {accounts?.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {currentAccount && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrencyKWD(totals.totalDebit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrencyKWD(totals.totalCredit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">الرصيد</p>
                <p className={`text-lg font-semibold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyKWD(Math.abs(totals.balance))}
                  {totals.balance < 0 && ' (دائن)'}
                </p>
              </div>
            </div>
          )}

          {/* Entries Table */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : !selectedAccountId ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اختر حساباً لعرض دفتر الأستاذ</p>
            </div>
          ) : filteredEntries?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قيود محاسبية لهذا الحساب</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right p-3 font-medium">التاريخ</th>
                      <th className="text-right p-3 font-medium">رقم القيد</th>
                      <th className="text-right p-3 font-medium">الوصف</th>
                      <th className="text-right p-3 font-medium">مدين</th>
                      <th className="text-right p-3 font-medium">دائن</th>
                      <th className="text-right p-3 font-medium">الرصيد الجاري</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries?.map((entry, index) => (
                      <tr 
                        key={entry.id} 
                        className={`border-t hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        <td className="p-3 text-sm">
                          {format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: ar })}
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {entry.entry_number}
                        </td>
                        <td className="p-3 text-sm">
                          {entry.description}
                        </td>
                        <td className="p-3 text-sm text-green-600 font-medium">
                          {entry.debit_amount > 0 ? formatCurrencyKWD(entry.debit_amount) : '-'}
                        </td>
                        <td className="p-3 text-sm text-red-600 font-medium">
                          {entry.credit_amount > 0 ? formatCurrencyKWD(entry.credit_amount) : '-'}
                        </td>
                        <td className={`p-3 text-sm font-medium ${
                          entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrencyKWD(Math.abs(entry.running_balance))}
                          {entry.running_balance < 0 && ' (د)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
