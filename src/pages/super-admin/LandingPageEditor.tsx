import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Eye, 
  Edit3, 
  Plus,
  Globe,
  RefreshCw,
  Settings,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent, LandingContent } from '@/hooks/useLandingContent';
import { useToast } from '@/hooks/use-toast';

const LandingPageEditor: React.FC = () => {
  const { content, loading, updateContent, createContent, fetchContent } = useLandingContent();
  const [editingItem, setEditingItem] = useState<LandingContent | null>(null);
  const [formData, setFormData] = useState({
    content_value_ar: '',
    content_value_en: '',
    content_value_simple: ''
  });
  const { toast } = useToast();

  const sections = [
    { id: 'hero', name: 'القسم الرئيسي', icon: '🏠' },
    { id: 'features', name: 'المميزات', icon: '⭐' },
    { id: 'pricing', name: 'الأسعار', icon: '💰' },
    { id: 'contact', name: 'التواصل', icon: '📞' },
    { id: 'footer', name: 'التذييل', icon: '📄' }
  ];

  const handleEdit = (item: LandingContent) => {
    setEditingItem(item);
    
    if (item.content_type === 'json' && typeof item.content_value === 'object') {
      setFormData({
        content_value_ar: item.content_value.ar || '',
        content_value_en: item.content_value.en || '',
        content_value_simple: ''
      });
    } else {
      setFormData({
        content_value_ar: '',
        content_value_en: '',
        content_value_simple: String(item.content_value || '')
      });
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;

    let contentValue;
    if (editingItem.content_type === 'json') {
      contentValue = {
        ar: formData.content_value_ar,
        en: formData.content_value_en
      };
    } else {
      contentValue = formData.content_value_simple;
    }

    await updateContent(editingItem.id, {
      content_value: contentValue
    });

    setEditingItem(null);
    setFormData({
      content_value_ar: '',
      content_value_en: '',
      content_value_simple: ''
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({
      content_value_ar: '',
      content_value_en: '',
      content_value_simple: ''
    });
  };

  const getContentBySection = (sectionName: string) => {
    return content.filter(item => item.section_name === sectionName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>جاري تحميل المحتوى...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/super-admin">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                محرر الصفحة الرئيسية
              </h1>
              <p className="text-muted-foreground">
                إدارة وتحرير محتوى الصفحة الرئيسية بشكل ديناميكي
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={fetchContent}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/landing', '_blank')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              معاينة الصفحة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Sections */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="hero" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {sections.map((section) => (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="text-xs px-2 py-2"
                  >
                    <span className="mr-1">{section.icon}</span>
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>{section.icon}</span>
                        {section.name}
                        <Badge variant="secondary">
                          {getContentBySection(section.id).length} عنصر
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getContentBySection(section.id).map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-background/50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {item.content_key}
                                </h4>
                                <Badge variant="outline" className="mt-1">
                                  {item.content_type}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                className="gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                تحرير
                              </Button>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {item.content_type === 'json' && typeof item.content_value === 'object' ? (
                                <div className="space-y-1">
                                  <div><strong>العربية:</strong> {item.content_value.ar}</div>
                                  <div><strong>الإنجليزية:</strong> {item.content_value.en}</div>
                                </div>
                              ) : (
                                <div>{String(item.content_value)}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {editingItem ? 'تحرير المحتوى' : 'اختر عنصراً للتحرير'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingItem ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">المفتاح</Label>
                      <Input 
                        value={editingItem.content_key} 
                        disabled 
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">النوع</Label>
                      <Input 
                        value={editingItem.content_type} 
                        disabled 
                        className="mt-1"
                      />
                    </div>

                    <Separator />

                    {editingItem.content_type === 'json' ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            النص بالعربية
                          </Label>
                          <Textarea
                            value={formData.content_value_ar}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              content_value_ar: e.target.value
                            }))}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            النص بالإنجليزية
                          </Label>
                          <Textarea
                            value={formData.content_value_en}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              content_value_en: e.target.value
                            }))}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm font-medium">المحتوى</Label>
                        <Textarea
                          value={formData.content_value_simple}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            content_value_simple: e.target.value
                          }))}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} className="flex-1 gap-1">
                        <Save className="w-4 h-4" />
                        حفظ
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      اختر عنصراً من القائمة لبدء التحرير
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageEditor;