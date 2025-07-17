import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Eye, 
  Upload, 
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Image,
  Type,
  Palette,
  Layout,
  Settings,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LandingPageSection {
  id: string;
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'footer';
  title: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  order: number;
  enabled: boolean;
  settings: Record<string, any>;
}

interface LandingPageConfig {
  id?: string;
  site_title: string;
  site_description: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  custom_css?: string;
  meta_tags: Record<string, string>;
  sections: LandingPageSection[];
  published: boolean;
  last_updated: string;
}

const LandingPageEditor: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig>({
    site_title: 'نظام إدارة تأجير السيارات',
    site_description: 'نظام شامل لإدارة تأجير السيارات مع جميع الميزات المتقدمة',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    font_family: 'Inter',
    meta_tags: {
      keywords: 'تأجير السيارات, إدارة الأسطول, نظام SaaS',
      author: 'Car Rental System',
      robots: 'index,follow'
    },
    sections: [],
    published: false,
    last_updated: new Date().toISOString()
  });

  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sectionTemplates = {
    hero: {
      type: 'hero' as const,
      title: 'مرحباً بك في نظام إدارة تأجير السيارات',
      subtitle: 'الحل الشامل لإدارة أعمال تأجير السيارات',
      content: 'نظام متكامل وسهل الاستخدام يوفر جميع الأدوات اللازمة لإدارة أسطول السيارات والعقود والعملاء بكفاءة عالية.',
      settings: {
        background_type: 'image',
        background_value: '/hero-rental.jpg',
        text_alignment: 'center',
        button_text: 'ابدأ الآن',
        button_link: '/auth'
      }
    },
    features: {
      type: 'features' as const,
      title: 'الميزات الرئيسية',
      subtitle: 'كل ما تحتاجه لإدارة أعمال تأجير السيارات',
      content: JSON.stringify([
        {
          icon: 'Car',
          title: 'إدارة الأسطول',
          description: 'تتبع وإدارة جميع المركبات بسهولة'
        },
        {
          icon: 'FileText',
          title: 'إدارة العقود',
          description: 'إنشاء وإدارة عقود التأجير بكفاءة'
        },
        {
          icon: 'Users',
          title: 'إدارة العملاء',
          description: 'قاعدة بيانات شاملة للعملاء'
        },
        {
          icon: 'BarChart3',
          title: 'التقارير والتحليلات',
          description: 'تقارير مفصلة لاتخاذ قرارات ذكية'
        }
      ]),
      settings: {
        layout: 'grid',
        columns: 2,
        show_icons: true
      }
    },
    pricing: {
      type: 'pricing' as const,
      title: 'خطط الاشتراك',
      subtitle: 'اختر الخطة المناسبة لك',
      content: JSON.stringify([
        {
          name: 'أساسية',
          price: '29.999',
          currency: 'KWD',
          period: 'شهرياً',
          features: ['حتى 10 مركبات', '100 عقد شهرياً', 'دعم فني أساسي'],
          popular: false
        },
        {
          name: 'احترافية',
          price: '49.999',
          currency: 'KWD', 
          period: 'شهرياً',
          features: ['حتى 50 مركبة', '500 عقد شهرياً', 'تقارير متقدمة', 'دعم فني 24/7'],
          popular: true
        },
        {
          name: 'مؤسسية',
          price: '99.999',
          currency: 'KWD',
          period: 'شهرياً',
          features: ['مركبات غير محدودة', 'عقود غير محدودة', 'تخصيص كامل', 'دعم مخصص'],
          popular: false
        }
      ]),
      settings: {
        layout: 'cards',
        show_currency: true,
        highlight_popular: true
      }
    },
    cta: {
      type: 'cta' as const,
      title: 'هل أنت مستعد للبدء؟',
      subtitle: 'ابدأ رحلتك معنا اليوم',
      content: 'انضم إلى آلاف العملاء الذين يثقون في نظامنا لإدارة أعمال تأجير السيارات',
      settings: {
        button_text: 'ابدأ تجربتك المجانية',
        button_link: '/auth',
        background_color: '#3B82F6',
        text_color: '#FFFFFF'
      }
    }
  };

  useEffect(() => {
    loadLandingPageConfig();
  }, []);

  const loadLandingPageConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('landing_page_config')
        .select('*')
        .single();

      if (error && !error.message.includes('0 rows')) {
        throw error;
      }

      if (data) {
        setConfig({
          ...data,
          sections: data.sections || getDefaultSections()
        });
      } else {
        // إنشاء تكوين افتراضي
        setConfig(prev => ({
          ...prev,
          sections: getDefaultSections()
        }));
      }
    } catch (err) {
      console.error('خطأ في تحميل تكوين الصفحة الرئيسية:', err);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تكوين الصفحة الرئيسية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSections = (): LandingPageSection[] => {
    return [
      {
        id: 'hero-1',
        ...sectionTemplates.hero,
        order: 1,
        enabled: true
      },
      {
        id: 'features-1',
        ...sectionTemplates.features,
        order: 2,
        enabled: true
      },
      {
        id: 'pricing-1',
        ...sectionTemplates.pricing,
        order: 3,
        enabled: true
      },
      {
        id: 'cta-1',
        ...sectionTemplates.cta,
        order: 4,
        enabled: true
      }
    ];
  };

  const saveLandingPageConfig = async () => {
    try {
      setSaving(true);

      const configToSave = {
        ...config,
        last_updated: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('landing_page_config')
        .upsert([configToSave])
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ تكوين الصفحة الرئيسية بنجاح",
      });
    } catch (err) {
      console.error('خطأ في حفظ التكوين:', err);
      toast({
        title: "خطأ",
        description: "فشل في حفظ التكوين",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const publishLandingPage = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('landing_page_config')
        .update({ 
          published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfig(prev => ({ ...prev, published: true }));
      
      toast({
        title: "تم النشر",
        description: "تم نشر الصفحة الرئيسية بنجاح",
      });
    } catch (err) {
      console.error('خطأ في نشر الصفحة:', err);
      toast({
        title: "خطأ",
        description: "فشل في نشر الصفحة الرئيسية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addSection = (templateKey: string) => {
    const template = sectionTemplates[templateKey as keyof typeof sectionTemplates];
    if (!template) return;

    const newSection: LandingPageSection = {
      id: `${template.type}-${Date.now()}`,
      ...template,
      order: config.sections.length + 1,
      enabled: true
    };

    setConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<LandingPageSection>) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...config.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    
    // إعادة ترقيم الأقسام
    sections.forEach((section, i) => {
      section.order = i + 1;
    });
    
    setConfig(prev => ({ ...prev, sections }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>محرر الصفحة الرئيسية</CardTitle>
                <p className="text-sm text-muted-foreground">
                  آخر تحديث: {new Date(config.last_updated).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.published ? "default" : "secondary"}>
                {config.published ? 'منشورة' : 'مسودة'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/', '_blank')}
              >
                <Eye className="w-4 h-4 ml-2" />
                معاينة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveLandingPageConfig}
                disabled={saving}
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
              <Button
                size="sm"
                onClick={publishLandingPage}
                disabled={saving || !config.sections.length}
              >
                <Globe className="w-4 h-4 ml-2" />
                نشر
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">عام</TabsTrigger>
              <TabsTrigger value="sections">الأقسام</TabsTrigger>
              <TabsTrigger value="design">التصميم</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>الإعدادات العامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_title">عنوان الموقع</Label>
                      <Input
                        id="site_title"
                        value={config.site_title}
                        onChange={(e) => setConfig(prev => ({ ...prev, site_title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="site_description">وصف الموقع</Label>
                      <Input
                        id="site_description"
                        value={config.site_description}
                        onChange={(e) => setConfig(prev => ({ ...prev, site_description: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo_url">رابط الشعار</Label>
                      <Input
                        id="logo_url"
                        value={config.logo_url || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <Label htmlFor="favicon_url">رابط الأيقونة المفضلة</Label>
                      <Input
                        id="favicon_url"
                        value={config.favicon_url || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, favicon_url: e.target.value }))}
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>إدارة الأقسام</CardTitle>
                    <div className="flex gap-2">
                      {Object.keys(sectionTemplates).map(key => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => addSection(key)}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          {key === 'hero' ? 'البانر' : 
                           key === 'features' ? 'الميزات' :
                           key === 'pricing' ? 'الأسعار' :
                           key === 'cta' ? 'دعوة للعمل' : key}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {config.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <Card key={section.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={section.enabled}
                                  onCheckedChange={(enabled) => updateSection(section.id, { enabled })}
                                />
                                <h4 className="font-medium">{section.title}</h4>
                                <Badge variant="outline">{section.type}</Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSection(section.id, 'up')}
                                  disabled={section.order === 1}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSection(section.id, 'down')}
                                  disabled={section.order === config.sections.length}
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSection(section.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>العنوان</Label>
                                <Input
                                  value={section.title}
                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                />
                              </div>
                              {section.subtitle !== undefined && (
                                <div>
                                  <Label>العنوان الفرعي</Label>
                                  <Input
                                    value={section.subtitle || ''}
                                    onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <Label>المحتوى</Label>
                              <Textarea
                                value={section.content}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات التصميم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary_color">اللون الأساسي</Label>
                      <Input
                        id="primary_color"
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary_color">اللون الثانوي</Label>
                      <Input
                        id="secondary_color"
                        type="color"
                        value={config.secondary_color}
                        onChange={(e) => setConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="font_family">خط النص</Label>
                    <select
                      id="font_family"
                      className="w-full p-2 border rounded-md"
                      value={config.font_family}
                      onChange={(e) => setConfig(prev => ({ ...prev, font_family: e.target.value }))}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom_css">CSS مخصص</Label>
                    <Textarea
                      id="custom_css"
                      value={config.custom_css || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, custom_css: e.target.value }))}
                      rows={8}
                      placeholder="/* أضف CSS مخصص هنا */"
                      className="font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="keywords">الكلمات المفتاحية</Label>
                    <Input
                      id="keywords"
                      value={config.meta_tags.keywords || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        meta_tags: { ...prev.meta_tags, keywords: e.target.value }
                      }))}
                      placeholder="كلمة1، كلمة2، كلمة3"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="author">المؤلف</Label>
                    <Input
                      id="author"
                      value={config.meta_tags.author || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        meta_tags: { ...prev.meta_tags, author: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="robots">توجيهات محركات البحث</Label>
                    <select
                      id="robots"
                      className="w-full p-2 border rounded-md"
                      value={config.meta_tags.robots || 'index,follow'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        meta_tags: { ...prev.meta_tags, robots: e.target.value }
                      }))}
                    >
                      <option value="index,follow">فهرسة ومتابعة الروابط</option>
                      <option value="index,nofollow">فهرسة بدون متابعة الروابط</option>
                      <option value="noindex,follow">عدم فهرسة مع متابعة الروابط</option>
                      <option value="noindex,nofollow">عدم فهرسة أو متابعة</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">معاينة</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`border rounded-lg overflow-hidden transition-all ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                  previewMode === 'tablet' ? 'max-w-md mx-auto' :
                  'w-full'
                }`}
              >
                <div className="bg-gray-100 h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">معاينة الصفحة الرئيسية</p>
                    <p className="text-xs">{config.sections.length} أقسام</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPageEditor; 