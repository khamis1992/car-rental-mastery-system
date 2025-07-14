import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BankReconciliationService } from '@/services/bankReconciliationService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportTransactionsTabProps {
  onImportComplete: () => void;
  onBankAccountChange: (accountId: string) => void;
}

export const ImportTransactionsTab: React.FC<ImportTransactionsTabProps> = ({
  onImportComplete,
  onBankAccountChange
}) => {
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // تحميل الحسابات البنكية
  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الحسابات البنكية",
        variant: "destructive",
      });
    }
  };

  // تحميل سجلات الاستيراد
  const loadImports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_reconciliation_imports')
        .select(`
          *,
          bank_accounts!inner(account_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error('Error loading imports:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الاستيراد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankAccounts();
    loadImports();
  }, []);

  // معالجة اختيار الحساب البنكي
  const handleBankAccountChange = (accountId: string) => {
    setSelectedBankAccount(accountId);
    onBankAccountChange(accountId);
  };

  // معالجة رفع الملف
  const handleFileUpload = async () => {
    if (!selectedBankAccount || !selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الحساب البنكي والملف",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      
      // تحليل ملف CSV
      const fileData = await BankReconciliationService.parseCSVFile(selectedFile);
      
      // استيراد المعاملات
      await BankReconciliationService.importBankTransactions(
        selectedBankAccount,
        fileData,
        selectedFile.name,
        selectedFile.size
      );

      toast({
        title: "نجح الاستيراد",
        description: `تم استيراد ${fileData.transactions.length} معاملة بنجاح`,
      });

      // إعادة تحميل البيانات
      loadImports();
      onImportComplete();
      
      // إعادة تعيين النموذج
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Error importing transactions:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "فشل في استيراد المعاملات",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // الحصول على تسمية الحالة
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'failed': return 'فشل';
      case 'processing': return 'جاري المعالجة';
      case 'pending': return 'في الانتظار';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* نموذج الاستيراد */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <Upload className="w-5 h-5" />
            استيراد المعاملات البنكية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-account">الحساب البنكي</Label>
              <Select value={selectedBankAccount} onValueChange={handleBankAccountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file-upload">ملف CSV</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse">
            <Button 
              onClick={handleFileUpload}
              disabled={!selectedBankAccount || !selectedFile || importing}
              className="rtl-flex"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'جاري الاستيراد...' : 'استيراد المعاملات'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadImports}
              disabled={loading}
              className="rtl-flex"
            >
              <FileText className="w-4 h-4" />
              تحديث القائمة
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>تنسيق ملف CSV المطلوب:</strong><br />
              التاريخ, الوصف, المرجع, المدين, الدائن, الرصيد<br />
              مثال: 2024-01-15, "دفع راتب", "REF001", 1000.00, 0.00, 5000.00
            </p>
          </div>
        </CardContent>
      </Card>

      {/* سجلات الاستيراد السابقة */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">سجلات الاستيراد السابقة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الحساب البنكي</TableHead>
                <TableHead className="text-right">اسم الملف</TableHead>
                <TableHead className="text-right">المعاملات</TableHead>
                <TableHead className="text-right">المطابقة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell>
                    {new Date(importRecord.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>{importRecord.bank_accounts?.account_name}</TableCell>
                  <TableCell className="flex items-center gap-2 flex-row-reverse">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {importRecord.file_name}
                  </TableCell>
                  <TableCell>{importRecord.total_transactions}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-success">{importRecord.matched_transactions} مطابقة</span>
                      {' | '}
                      <span className="text-destructive">{importRecord.unmatched_transactions} غير مطابقة</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rtl-flex">
                      {getStatusIcon(importRecord.import_status)}
                      {getStatusLabel(importRecord.import_status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {imports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد سجلات استيراد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};