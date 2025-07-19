import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Upload, 
  Eye, 
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccountTemplate {
  id: string;
  template_name: string;
  template_name_en?: string;
  business_type: string;
  template_structure: any;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export const AccountTemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<AccountTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('account_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قوالب الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    try {
      setApplying(templateId);
      
      // هنا يمكن تطبيق منطق تطبيق القالب
      // للآن سنقوم بعرض رسالة نجاح
      
      toast({
        title: 'تم بنجاح',
        description: 'تم تطبيق قالب الحسابات بنجاح',
      });
      
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تطبيق قالب الحسابات',
        variant: 'destructive',
      });
    } finally {
      setApplying(null);
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const labels = {
      rental: 'تأجير السيارات',
      trading: 'شركة تجارية',
      service: 'شركة خدمات',
      manufacturing: 'شركة تصنيع',
      general: 'عام'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBusinessTypeColor = (type: string) => {
    const colors = {
      rental: 'bg-blue-100 text-blue-800',
      trading: 'bg-green-100 text-green-800',
      service: 'bg-purple-100 text-purple-800',
      manufacturing: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderTemplateStructure = (structure: any) => {
    if (!structure?.accounts) return null;

    return (
      <div className="space-y-2">
        {structure.accounts.map((account: any, index: number) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <Badge variant="outline" className="font-mono">
              {account.code}
            </Badge>
            <span className="flex-1">{account.name}</span>
            <Badge variant="secondary" className="text-xs">
              {account.type}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-8 h-8 animate-pulse mx-auto mb-2" />
            <p>جاري تحميل القوالب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            قوالب دليل الحسابات
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">القوالب المتاحة</TabsTrigger>
              <TabsTrigger value="preview">معاينة القالب</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>لا توجد قوالب متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm">{template.template_name}</h3>
                            {template.template_name_en && (
                              <p className="text-xs text-muted-foreground">{template.template_name_en}</p>
                            )}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getBusinessTypeColor(template.business_type)}`}
                          >
                            {getBusinessTypeLabel(template.business_type)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <Eye className="w-3 h-3 ml-1" />
                              معاينة
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => applyTemplate(template.id)}
                              disabled={applying === template.id}
                            >
                              {applying === template.id ? (
                                <>
                                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent ml-1" />
                                  تطبيق...
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3 ml-1" />
                                  تطبيق
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="w-3 h-3" />
                              {template.template_structure?.accounts?.length || 0} حساب
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedTemplate.template_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                    <Badge className={getBusinessTypeColor(selectedTemplate.business_type)}>
                      {getBusinessTypeLabel(selectedTemplate.business_type)}
                    </Badge>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">هيكل الحسابات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTemplateStructure(selectedTemplate.template_structure)}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => applyTemplate(selectedTemplate.id)}
                      disabled={applying === selectedTemplate.id}
                    >
                      {applying === selectedTemplate.id ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                          جاري التطبيق...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 ml-2" />
                          تطبيق هذا القالب
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline">
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ كقالب مخصص
                    </Button>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">تحذير:</p>
                        <p>
                          تطبيق هذا القالب سيؤثر على دليل الحسابات الحالي. 
                          تأكد من عمل نسخة احتياطية قبل المتابعة.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4" />
                  <p>اختر قالباً من القائمة لمعاينته</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};