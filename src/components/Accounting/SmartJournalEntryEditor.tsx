
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  PlusCircle, 
  Trash2, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Wand2,
  History,
  FileText,
  Calculator
} from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { automatedEntryRulesService } from '@/services/automatedEntryRulesService';
import { toast } from 'sonner';

interface JournalEntryLine {
  id: string;
  account_id: string;
  account_name: string;
  account_code: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_id?: string;
  project_code?: string;
  reference_id?: string;
  reference_type?: string;
}

interface SmartSuggestion {
  id: string;
  type: 'template' | 'auto_rule' | 'similar_entry';
  title: string;
  description: string;
  confidence: number;
  entry_data: {
    description: string;
    lines: Omit<JournalEntryLine, 'id'>[];
  };
}

interface SmartJournalEntryEditorProps {
  onSave: (entry: any) => void;
  onCancel: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export const SmartJournalEntryEditor: React.FC<SmartJournalEntryEditorProps> = ({
  onSave,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [autoBalance, setAutoBalance] = useState(true);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'manual',
    description: '',
    reference_id: '',
    reference_type: 'manual',
    notes: ''
  });
  const [lines, setLines] = useState<JournalEntryLine[]>([]);
  const [balanceCheck, setBalanceCheck] = useState({
    total_debit: 0,
    total_credit: 0,
    is_balanced: false,
    difference: 0
  });

  useEffect(() => {
    loadInitialData();
    if (initialData) {
      loadEntryData(initialData);
    } else {
      addNewLine();
      addNewLine();
    }
  }, [initialData]);

  useEffect(() => {
    calculateBalance();
  }, [lines]);

  useEffect(() => {
    if (formData.description.length > 5) {
      generateSmartSuggestions();
    }
  }, [formData.description]);

  const loadInitialData = async () => {
    try {
      const [accountsData, costCentersData] = await Promise.all([
        accountingService.getChartOfAccounts(),
        accountingService.getCostCenters()
      ]);
      
      setAccounts(accountsData.filter(acc => acc.allow_posting && acc.is_active));
      setCostCenters(costCentersData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('فشل في تحميل البيانات');
    }
  };

  const loadEntryData = (data: any) => {
    setFormData({
      entry_date: data.entry_date || new Date().toISOString().split('T')[0],
      entry_type: data.entry_type || 'manual',
      description: data.description || '',
      reference_id: data.reference_id || '',
      reference_type: data.reference_type || 'manual',
      notes: data.notes || ''
    });

    if (data.lines) {
      setLines(data.lines.map((line: any, index: number) => ({
        id: line.id || `line_${index}`,
        account_id: line.account_id || '',
        account_name: line.account_name || '',
        account_code: line.account_code || '',
        description: line.description || '',
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        cost_center_id: line.cost_center_id || '',
        project_code: line.project_code || '',
        reference_id: line.reference_id || '',
        reference_type: line.reference_type || ''
      })));
    }
  };

  const addNewLine = () => {
    const newLine: JournalEntryLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      account_id: '',
      account_name: '',
      account_code: '',
      description: '',
      debit_amount: 0,
      credit_amount: 0,
      cost_center_id: '',
      project_code: '',
      reference_id: '',
      reference_type: ''
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string, field: keyof JournalEntryLine, value: any) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        
        // إذا تم تحديث الحساب، جلب معلومات الحساب
        if (field === 'account_id' && value) {
          const account = accounts.find(acc => acc.id === value);
          if (account) {
            updatedLine.account_name = account.account_name;
            updatedLine.account_code = account.account_code;
          }
        }
        
        // التوازن التلقائي
        if (autoBalance && (field === 'debit_amount' || field === 'credit_amount')) {
          const otherField = field === 'debit_amount' ? 'credit_amount' : 'debit_amount';
          updatedLine[otherField] = 0;
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const calculateBalance = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01;

    setBalanceCheck({
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: isBalanced,
      difference: difference
    });
  };

  const generateSmartSuggestions = async () => {
    try {
      // استخدام الذكاء الاصطناعي لتوليد اقتراحات
      const suggestions: SmartSuggestion[] = [];
      
      // اقتراحات القوالب
      const templateSuggestions = generateTemplateSuggestions();
      suggestions.push(...templateSuggestions);
      
      // اقتراحات القيود المشابهة
      const similarSuggestions = await generateSimilarEntrySuggestions();
      suggestions.push(...similarSuggestions);
      
      // ترتيب الاقتراحات حسب الثقة
      suggestions.sort((a, b) => b.confidence - a.confidence);
      
      setSuggestions(suggestions.slice(0, 5));
    } catch (error) {
      console.error('خطأ في توليد الاقتراحات:', error);
    }
  };

  const generateTemplateSuggestions = (): SmartSuggestion[] => {
    const templates: SmartSuggestion[] = [];
    
    // قوالب شائعة بناءً على الوصف
    if (formData.description.includes('مبيعات') || formData.description.includes('إيراد')) {
      templates.push({
        id: 'template_sales',
        type: 'template',
        title: 'قيد مبيعات',
        description: 'قيد نموذجي للمبيعات والإيرادات',
        confidence: 85,
        entry_data: {
          description: 'قيد مبيعات - ' + formData.description,
          lines: [
            {
              account_id: '',
              account_name: 'النقدية',
              account_code: '111',
              description: 'استلام نقدية من المبيعات',
              debit_amount: 0,
              credit_amount: 0
            },
            {
              account_id: '',
              account_name: 'المبيعات',
              account_code: '411',
              description: 'إيراد المبيعات',
              debit_amount: 0,
              credit_amount: 0
            }
          ]
        }
      });
    }

    if (formData.description.includes('شراء') || formData.description.includes('مصروف')) {
      templates.push({
        id: 'template_expense',
        type: 'template',
        title: 'قيد مصروف',
        description: 'قيد نموذجي للمصروفات والمشتريات',
        confidence: 80,
        entry_data: {
          description: 'قيد مصروف - ' + formData.description,
          lines: [
            {
              account_id: '',
              account_name: 'المصروفات',
              account_code: '51',
              description: 'مصروف',
              debit_amount: 0,
              credit_amount: 0
            },
            {
              account_id: '',
              account_name: 'النقدية',
              account_code: '111',
              description: 'دفع نقدي',
              debit_amount: 0,
              credit_amount: 0
            }
          ]
        }
      });
    }

    return templates;
  };

  const generateSimilarEntrySuggestions = async (): Promise<SmartSuggestion[]> => {
    try {
      // جلب قيود مشابهة من قاعدة البيانات
      const { data, error } = await accountingService.searchSimilarEntries(formData.description);
      
      if (error || !data) return [];
      
      return data.slice(0, 3).map((entry: any, index: number) => ({
        id: `similar_${index}`,
        type: 'similar_entry' as const,
        title: 'قيد مشابه',
        description: entry.description,
        confidence: 70 - (index * 10),
        entry_data: {
          description: entry.description,
          lines: entry.lines || []
        }
      }));
    } catch (error) {
      console.error('خطأ في جلب القيود المشابهة:', error);
      return [];
    }
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    setFormData(prev => ({
      ...prev,
      description: suggestion.entry_data.description
    }));
    
    const newLines = suggestion.entry_data.lines.map((line, index) => ({
      id: `suggested_${index}_${Date.now()}`,
      account_id: line.account_id || '',
      account_name: line.account_name || '',
      account_code: line.account_code || '',
      description: line.description || '',
      debit_amount: line.debit_amount || 0,
      credit_amount: line.credit_amount || 0,
      cost_center_id: line.cost_center_id || '',
      project_code: line.project_code || '',
      reference_id: line.reference_id || '',
      reference_type: line.reference_type || ''
    }));
    
    setLines(newLines);
    toast.success('تم تطبيق الاقتراح بنجاح');
  };

  const autoBalanceEntries = () => {
    if (lines.length < 2) return;
    
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    const difference = totalDebit - totalCredit;
    
    if (Math.abs(difference) > 0.01) {
      // البحث عن خط فارغ أو إضافة خط جديد للتوازن
      const emptyLine = lines.find(line => line.debit_amount === 0 && line.credit_amount === 0);
      
      if (emptyLine) {
        if (difference > 0) {
          updateLine(emptyLine.id, 'credit_amount', difference);
        } else {
          updateLine(emptyLine.id, 'debit_amount', Math.abs(difference));
        }
      } else {
        // إضافة خط جديد للتوازن
        const balanceLine: JournalEntryLine = {
          id: `balance_${Date.now()}`,
          account_id: '',
          account_name: '',
          account_code: '',
          description: 'توازن تلقائي',
          debit_amount: difference < 0 ? Math.abs(difference) : 0,
          credit_amount: difference > 0 ? difference : 0,
          cost_center_id: '',
          project_code: '',
          reference_id: '',
          reference_type: ''
        };
        setLines([...lines, balanceLine]);
      }
    }
  };

  const handleSave = async () => {
    // التحقق من التوازن
    if (!balanceCheck.is_balanced) {
      toast.error('القيد غير متوازن. يرجى التأكد من توازن المبالغ المدينة والدائنة');
      return;
    }

    // التحقق من وجود حسابات
    if (lines.some(line => !line.account_id)) {
      toast.error('يرجى اختيار حساب لجميع خطوط القيد');
      return;
    }

    // التحقق من وجود مبالغ
    if (lines.every(line => line.debit_amount === 0 && line.credit_amount === 0)) {
      toast.error('يرجى إدخال مبالغ للقيد');
      return;
    }

    try {
      setLoading(true);
      
      const entryData = {
        ...formData,
        total_debit: balanceCheck.total_debit,
        total_credit: balanceCheck.total_credit,
        status: 'draft',
        lines: lines
      };

      await onSave(entryData);
      toast.success('تم حفظ القيد بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ القيد:', error);
      toast.error('فشل في حفظ القيد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات القيد الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {mode === 'create' ? 'إنشاء قيد جديد' : 'تعديل القيد'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entry_date">تاريخ القيد</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="entry_type">نوع القيد</Label>
              <Select value={formData.entry_type} onValueChange={(value) => setFormData({...formData, entry_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="automated">تلقائي</SelectItem>
                  <SelectItem value="adjustment">تسوية</SelectItem>
                  <SelectItem value="closing">إقفال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reference_id">رقم المرجع</Label>
              <Input
                id="reference_id"
                value={formData.reference_id}
                onChange={(e) => setFormData({...formData, reference_id: e.target.value})}
                placeholder="رقم المرجع..."
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">وصف القيد</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="وصف القيد..."
              rows={2}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show_suggestions"
                checked={showSuggestions}
                onCheckedChange={setShowSuggestions}
              />
              <Label htmlFor="show_suggestions">عرض الاقتراحات الذكية</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_balance"
                checked={autoBalance}
                onCheckedChange={setAutoBalance}
              />
              <Label htmlFor="auto_balance">التوازن التلقائي</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الاقتراحات الذكية */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              الاقتراحات الذكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{suggestion.title}</h4>
                    <Badge variant="outline">{suggestion.confidence}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{suggestion.type}</Badge>
                    <Button size="sm" variant="outline">
                      تطبيق
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* خطوط القيد */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              خطوط القيد
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={autoBalanceEntries}>
                <Zap className="w-4 h-4 ml-2" />
                توازن تلقائي
              </Button>
              <Button size="sm" onClick={addNewLine}>
                <PlusCircle className="w-4 h-4 ml-2" />
                إضافة خط
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>مدين</TableHead>
                  <TableHead>دائن</TableHead>
                  <TableHead>مركز التكلفة</TableHead>
                  <TableHead>رمز المشروع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Select value={line.account_id} onValueChange={(value) => updateLine(line.id, 'account_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder="وصف الخط..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.debit_amount}
                        onChange={(e) => updateLine(line.id, 'debit_amount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.001"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.credit_amount}
                        onChange={(e) => updateLine(line.id, 'credit_amount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.001"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={line.cost_center_id} onValueChange={(value) => updateLine(line.id, 'cost_center_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختياري" />
                        </SelectTrigger>
                        <SelectContent>
                          {costCenters.map(cc => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.center_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.project_code}
                        onChange={(e) => updateLine(line.id, 'project_code', e.target.value)}
                        placeholder="رمز المشروع..."
                      />
                    </TableCell>
                    <TableCell>
                      {lines.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLine(line.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* معلومات التوازن */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {balanceCheck.is_balanced ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            معلومات التوازن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{balanceCheck.total_debit.toFixed(3)}</div>
              <div className="text-sm text-muted-foreground">إجمالي المدين</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{balanceCheck.total_credit.toFixed(3)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الدائن</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${balanceCheck.is_balanced ? 'text-green-600' : 'text-red-600'}`}>
                {balanceCheck.difference.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">الفرق</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-center">
            <Badge className={balanceCheck.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {balanceCheck.is_balanced ? 'القيد متوازن' : 'القيد غير متوازن'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* أزرار التحكم */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={loading || !balanceCheck.is_balanced}>
          {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
        </Button>
      </div>
    </div>
  );
};
