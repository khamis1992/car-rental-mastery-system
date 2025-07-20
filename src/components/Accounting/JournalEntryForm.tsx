import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyKWD } from '@/lib/currency';

interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  costCenter?: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent?: string;
}

export const JournalEntryForm: React.FC = () => {
  const { toast } = useToast();
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { id: '1', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', accountName: '', description: '', debit: 0, credit: 0 }
  ]);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entryData, setEntryData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    attachment: null as File | null
  });
  
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({
    isValid: true,
    errors: [] as string[]
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    validateEntry();
  }, [entryLines, entryData]);

  const loadAccounts = async () => {
    // Mock data - في التطبيق الحقيقي سيتم جلب البيانات من الـ API
    setAccounts([
      { id: '1', code: '1100', name: 'النقدية في الصندوق', type: 'asset' },
      { id: '2', code: '1110', name: 'النقدية في البنك', type: 'asset' },
      { id: '3', code: '1200', name: 'العملاء', type: 'asset' },
      { id: '4', code: '1300', name: 'المخزون', type: 'asset' },
      { id: '5', code: '2100', name: 'الموردون', type: 'liability' },
      { id: '6', code: '2200', name: 'الرواتب المستحقة', type: 'liability' },
      { id: '7', code: '3000', name: 'رأس المال', type: 'equity' },
      { id: '8', code: '4100', name: 'إيرادات التأجير', type: 'revenue' },
      { id: '9', code: '5100', name: 'مصروفات التشغيل', type: 'expense' },
      { id: '10', code: '5200', name: 'مصروفات الصيانة', type: 'expense' }
    ]);
  };

  const validateEntry = () => {
    const errors: string[] = [];
    
    // التحقق من وجود حد أدنى من السطور
    const validLines = entryLines.filter(line => 
      line.accountId && (line.debit > 0 || line.credit > 0)
    );
    
    if (validLines.length < 2) {
      errors.push('يجب أن يحتوي القيد على سطرين على الأقل');
    }
    
    // التحقق من التوازن
    const totalDebit = entryLines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = entryLines.reduce((sum, line) => sum + (line.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push('إجمالي المدين يجب أن يساوي إجمالي الدائن');
    }
    
    // التحقق من البيانات الأساسية
    if (!entryData.date) {
      errors.push('تاريخ القيد مطلوب');
    }
    
    if (!entryData.description.trim()) {
      errors.push('وصف القيد مطلوب');
    }
    
    // التحقق من عدم تكرار الحسابات في نفس القيد
    const accountIds = validLines.map(line => line.accountId);
    const uniqueAccountIds = new Set(accountIds);
    if (accountIds.length !== uniqueAccountIds.size) {
      errors.push('لا يمكن استخدام نفس الحساب أكثر من مرة في القيد الواحد');
    }

    setValidation({
      isValid: errors.length === 0,
      errors
    });
  };

  const addLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      accountId: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0
    };
    setEntryLines([...entryLines, newLine]);
  };

  const removeLine = (lineId: string) => {
    if (entryLines.length > 2) {
      setEntryLines(entryLines.filter(line => line.id !== lineId));
    }
  };

  const updateLine = (lineId: string, field: keyof JournalEntryLine, value: any) => {
    setEntryLines(entryLines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        
        // إذا تم تغيير الحساب، احصل على اسم الحساب
        if (field === 'accountId') {
          const account = accounts.find(acc => acc.id === value);
          updatedLine.accountName = account ? `${account.code} - ${account.name}` : '';
        }
        
        // التأكد من عدم وجود قيم في المدين والدائن معاً
        if (field === 'debit' && value > 0) {
          updatedLine.credit = 0;
        } else if (field === 'credit' && value > 0) {
          updatedLine.debit = 0;
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const totalDebit = entryLines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = entryLines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى تصحيح الأخطاء قبل الحفظ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // محاكاة حفظ البيانات
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ القيد المحاسبي بنجاح',
      });
      
      // إعادة تعيين النموذج
      setEntryLines([
        { id: '1', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', accountName: '', description: '', debit: 0, credit: 0 }
      ]);
      setEntryData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        attachment: null
      });
      
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ القيد المحاسبي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      {/* معلومات القيد الأساسية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <FileText className="w-5 h-5" />
            إنشاء قيد محاسبي جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">تاريخ القيد</Label>
              <Input
                id="date"
                type="date"
                value={entryData.date}
                onChange={(e) => setEntryData({...entryData, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="reference">رقم المرجع</Label>
              <Input
                id="reference"
                placeholder="رقم المرجع (اختياري)"
                value={entryData.reference}
                onChange={(e) => setEntryData({...entryData, reference: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="attachment">مرفق</Label>
              <Input
                id="attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setEntryData({...entryData, attachment: e.target.files?.[0] || null})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="description">وصف القيد</Label>
            <Textarea
              id="description"
              placeholder="اكتب وصفاً مفصلاً للقيد المحاسبي..."
              value={entryData.description}
              onChange={(e) => setEntryData({...entryData, description: e.target.value})}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* خطوط القيد */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              onClick={addLine}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة سطر
            </Button>
            <CardTitle className="flex items-center gap-2 rtl-flex">
              <Calculator className="w-5 h-5" />
              تفاصيل القيد
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">إجراء</TableHead>
                <TableHead className="text-right">دائن</TableHead>
                <TableHead className="text-right">مدين</TableHead>
                <TableHead className="text-right">البيان</TableHead>
                <TableHead className="text-right">الحساب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entryLines.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell className="text-right">
                    {entryLines.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLine(line.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      placeholder="بيان السطر..."
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={line.accountId}
                      onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحساب..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {/* سطر الإجماليات */}
              <TableRow className="font-bold bg-muted/50">
                <TableCell></TableCell>
                <TableCell className="text-right">
                  <div className={`${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyKWD(totalCredit)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyKWD(totalDebit)}
                  </div>
                </TableCell>
                <TableCell className="text-right">الإجمالي</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* حالة التوازن والأخطاء */}
      <div className="space-y-4">
        {/* مؤشر التوازن */}
        <Card className={`border-2 ${isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <h4 className="font-medium">
                  {isBalanced ? 'القيد متوازن' : 'القيد غير متوازن'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  المدين: {formatCurrencyKWD(totalDebit)} • الدائن: {formatCurrencyKWD(totalCredit)}
                  {!isBalanced && (
                    <span className="text-red-600 font-medium">
                      {' '}• الفرق: {formatCurrencyKWD(Math.abs(totalDebit - totalCredit))}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رسائل الخطأ */}
        {validation.errors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={validation.isValid ? 'default' : 'destructive'}>
            {validation.isValid ? 'جاهز للحفظ' : 'يحتاج مراجعة'}
          </Badge>
          {entryData.attachment && (
            <Badge variant="outline">
              مرفق: {entryData.attachment.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            إلغاء
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!validation.isValid || loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
          </Button>
        </div>
      </div>
    </div>
  );
};