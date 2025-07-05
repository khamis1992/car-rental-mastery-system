import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, FileText, Search, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CleanupResult {
  total_accounts_processed: number;
  cleanup_details: Array<{
    account_name: string;
    primary_account_code: string;
    merged_accounts: number;
  }>;
  timestamp: string;
}

interface ValidationResult {
  duplicate_codes: number;
  duplicate_names: number;
  unbalanced_entries: number;
  is_valid: boolean;
  validation_date: string;
}

interface DuplicateAccount {
  account_name: string;
  account_type: string;
  count_duplicates: number;
  account_codes: string[];
}

export const ChartOfAccountsCleanup = () => {
  const [duplicates, setDuplicates] = useState<DuplicateAccount[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'analysis' | 'cleanup' | 'validation' | 'complete'>('analysis');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const findDuplicates = async () => {
    try {
      setLoading(true);
      setProgress(20);
      
      const { data, error } = await supabase.rpc('find_duplicate_accounts');
      
      if (error) throw error;
      
      setDuplicates(data || []);
      setProgress(100);
      
      toast({
        title: 'تم العثور على الحسابات المكررة',
        description: `تم العثور على ${data?.length || 0} مجموعة من الحسابات المكررة`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في البحث عن الحسابات المكررة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCleanup = async () => {
    try {
      setLoading(true);
      setStep('cleanup');
      setProgress(0);
      
      // التنظيف
      setProgress(30);
      const { data: cleanupData, error: cleanupError } = await supabase.rpc('cleanup_duplicate_accounts');
      
      if (cleanupError) throw cleanupError;
      
      setCleanupResult(cleanupData as unknown as CleanupResult);
      setProgress(60);
      
      // إعادة تنظيم الأكواد
      const { error: reorganizeError } = await supabase.rpc('reorganize_account_codes');
      
      if (reorganizeError) throw reorganizeError;
      
      setProgress(90);
      
      // التحقق من النتائج
      await validateAccounts();
      setStep('complete');
      setProgress(100);
      
      toast({
        title: 'تم التنظيف بنجاح',
        description: `تم معالجة ${(cleanupData as any)?.total_accounts_processed || 0} حساب`,
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التنظيف',
        description: error.message || 'فشل في تنظيف الحسابات',
        variant: 'destructive',
      });
      setStep('analysis');
    } finally {
      setLoading(false);
    }
  };

  const validateAccounts = async () => {
    try {
      setLoading(true);
      setStep('validation');
      setProgress(50);
      
      const { data, error } = await supabase.rpc('validate_chart_of_accounts');
      
      if (error) throw error;
      
      setValidationResult(data as unknown as ValidationResult);
      setProgress(100);
      
      if ((data as any)?.is_valid) {
        toast({
          title: 'التحقق مكتمل',
          description: 'دليل الحسابات سليم ولا يحتوي على أخطاء',
        });
      } else {
        toast({
          title: 'تم العثور على مشاكل',
          description: 'لا يزال هناك بعض المشاكل في دليل الحسابات',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في التحقق',
        description: 'فشل في التحقق من سلامة دليل الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setStep('analysis');
    setProgress(0);
    setDuplicates([]);
    setValidationResult(null);
    setCleanupResult(null);
  };

  return (
    <div className="space-y-6">
      {/* شريط التقدم */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            تنظيف دليل الحسابات
            <Wrench className="w-5 h-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>الإكمال: {progress}%</span>
              <span>
                {step === 'analysis' && 'التحليل'}
                {step === 'cleanup' && 'التنظيف'}
                {step === 'validation' && 'التحقق'}
                {step === 'complete' && 'مكتمل'}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            
            <div className="flex gap-2 justify-end">
              {step === 'analysis' && (
                <>
                  <Button onClick={findDuplicates} disabled={loading}>
                    <Search className="w-4 h-4 ml-2" />
                    {loading ? 'جاري البحث...' : 'البحث عن المكررات'}
                  </Button>
                  <Button onClick={validateAccounts} variant="outline" disabled={loading}>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    التحقق من السلامة
                  </Button>
                </>
              )}
              
              {step === 'analysis' && duplicates.length > 0 && (
                <Button onClick={executeCleanup} disabled={loading}>
                  <Wrench className="w-4 h-4 ml-2" />
                  {loading ? 'جاري التنظيف...' : 'بدء التنظيف'}
                </Button>
              )}
              
              {step === 'complete' && (
                <Button onClick={resetProcess} variant="outline">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  عملية جديدة
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نتائج البحث عن المكررات */}
      {duplicates.length > 0 && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              الحسابات المكررة
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicates.map((duplicate, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="destructive">{duplicate.count_duplicates} نسخة</Badge>
                          <Badge variant="outline">{duplicate.account_type}</Badge>
                        </div>
                        <span className="font-medium">{duplicate.account_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>الأكواد: {duplicate.account_codes.join(', ')}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتائج التنظيف */}
      {cleanupResult && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              نتائج التنظيف
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {cleanupResult.total_accounts_processed}
                </div>
                <div className="text-sm text-green-700">حساب تم معالجته</div>
              </div>
              
              {cleanupResult.cleanup_details.map((detail, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{detail.primary_account_code}</Badge>
                      <Badge variant="secondary">{detail.merged_accounts} مدمج</Badge>
                    </div>
                    <span className="font-medium">{detail.account_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتائج التحقق */}
      {validationResult && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              نتائج التحقق
              {validationResult.is_valid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.duplicate_codes}
                </div>
                <div className="text-sm text-muted-foreground">أكواد مكررة</div>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {validationResult.duplicate_names}
                </div>
                <div className="text-sm text-muted-foreground">أسماء مكررة</div>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResult.unbalanced_entries}
                </div>
                <div className="text-sm text-muted-foreground">قيود غير متوازنة</div>
              </div>
            </div>
            
            {validationResult.is_valid && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ دليل الحسابات سليم ولا يحتوي على أخطاء
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};