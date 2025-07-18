import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Layout,
  Type,
  Image as ImageIcon,
  Video,
  Code,
  Palette,
  Eye,
  Save,
  Trash2,
  Plus,
  Move,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Undo,
  Redo,
  Copy,
  Edit,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Upload,
  Download,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'contact' | 'gallery' | 'about' | 'custom';
  title: string;
  content: any;
  order: number;
  isVisible: boolean;
  settings: {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    margin?: string;
    customCSS?: string;
  };
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  tenantId: string;
  tenantName: string;
  sections: PageSection[];
  settings: {
    theme: 'light' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    customCSS: string;
  };
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  sections: Omit<PageSection, 'id'>[];
  category: 'business' | 'portfolio' | 'blog' | 'ecommerce';
}

const LandingPageEditor: React.FC = () => {
  const { toast } = useToast();
  const { t, msg, formatNumber } = useTranslation();
  
  // State management
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // نموذج صفحة جديدة
  const [newPageForm, setNewPageForm] = useState({
    name: '',
    slug: '',
    title: '',
    description: '',
    tenantId: '',
    theme: 'light' as const,
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b'
  });

  // نموذج قسم جديد
  const [newSectionForm, setNewSectionForm] = useState({
    type: 'hero' as const,
    title: '',
    content: {},
    backgroundColor: '#ffffff',
    textColor: '#000000'
  });

  // بيانات تجريبية
  const [landingPages, setLandingPages] = useState<LandingPage[]>([
    {
      id: '1',
      name: 'صفحة شركة الخليج للنقل',
      slug: 'gulf-transport',
      title: 'شركة الخليج للنقل - خدمات النقل المتميزة',
      description: 'نوفر خدمات النقل والخدمات اللوجستية بأعلى معايير الجودة',
      tenantId: 'tenant-1',
      tenantName: 'شركة الخليج للنقل',
      sections: [
        {
          id: 's1',
          type: 'hero',
          title: 'القسم الرئيسي',
          content: {
            headline: 'عنوان رئيسي جذاب',
            subtitle: 'وصف مختصر وواضح',
            buttonText: 'ابدأ الآن',
            backgroundImage: '/images/hero-bg.jpg'
          },
          order: 1,
          isVisible: true,
          settings: {
            backgroundColor: '#1e40af',
            textColor: '#ffffff'
          }
        }
      ],
      settings: {
        theme: 'light',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Tajawal',
        customCSS: ''
      },
      isPublished: true,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      publishedAt: '2024-01-12T10:00:00Z'
    }
  ]);

  const [templates] = useState<Template[]>([
    {
      id: 't1',
      name: 'قالب الأعمال الاحترافي',
      description: 'قالب متكامل للشركات والأعمال التجارية',
      preview: '/templates/business-pro.jpg',
      category: 'business',
      sections: [
        {
          type: 'hero',
          title: 'القسم الرئيسي',
          content: {
            headline: 'عنوان رئيسي جذاب',
            subtitle: 'وصف مختصر وواضح لخدماتك',
            buttonText: 'ابدأ الآن'
          },
          order: 1,
          isVisible: true,
          settings: {}
        },
        {
          type: 'features',
          title: 'المميزات',
          content: {
            features: [
              { title: 'ميزة رائعة', description: 'وصف الميزة', icon: 'star' },
              { title: 'ميزة أخرى', description: 'وصف الميزة', icon: 'check' },
              { title: 'ميزة ثالثة', description: 'وصف الميزة', icon: 'heart' }
            ]
          },
          order: 2,
          isVisible: true,
          settings: {}
        }
      ]
    }
  ]);

  // تعريف أعمدة جدول الصفحات
  const pageColumns = [
    {
      key: 'name',
      title: 'اسم الصفحة',
      sortable: true,
      render: (value: string, row: LandingPage) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Layout className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: 'tenantName',
      title: 'المؤسسة',
      render: (tenantName: string) => (
        <span className="text-sm text-muted-foreground">{tenantName}</span>
      )
    },
    {
      key: 'isPublished',
      title: 'الحالة',
      align: 'center' as const,
      render: (isPublished: boolean) => (
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'منشورة' : 'مسودة'}
        </Badge>
      )
    },
    {
      key: 'sections',
      title: 'الأقسام',
      align: 'center' as const,
      render: (sections: PageSection[]) => (
        <span className="font-medium">{formatNumber(sections.length)}</span>
      )
    },
    {
      key: 'updatedAt',
      title: 'آخر تحديث',
      render: (date: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString('ar-SA')}
        </span>
      )
    }
  ];

  // تعريف إجراءات الصفحات
  const pageActions = [
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (page: LandingPage) => {
        setSelectedPage(page);
        setShowPageEditor(true);
      }
    },
    {
      label: 'معاينة',
      icon: <Eye className="w-4 h-4" />,
      onClick: (page: LandingPage) => {
        window.open(`/preview/${page.slug}`, '_blank');
      }
    },
    {
      label: 'نسخ',
      icon: <Copy className="w-4 h-4" />,
      onClick: (page: LandingPage) => {
        duplicatePage(page);
      }
    },
    {
      label: page => page.isPublished ? 'إلغاء النشر' : 'نشر',
      icon: <Globe className="w-4 h-4" />,
      onClick: (page: LandingPage) => {
        togglePublishPage(page);
      },
      variant: (page: LandingPage) => page.isPublished ? 'secondary' : 'default'
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (page: LandingPage) => {
        setConfirmationDialog({
          isOpen: true,
          title: 'تأكيد حذف الصفحة',
          message: `هل أنت متأكد من حذف الصفحة "${page.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
          onConfirm: () => deletePage(page)
        });
      },
      variant: 'destructive' as const,
      separator: true
    }
  ];

  // معالجات الأحداث
  const handleCreatePage = async () => {
    setLoading(true);
    try {
      const newPage: LandingPage = {
        id: Date.now().toString(),
        name: newPageForm.name,
        slug: newPageForm.slug || newPageForm.name.toLowerCase().replace(/\s+/g, '-'),
        title: newPageForm.title,
        description: newPageForm.description,
        tenantId: newPageForm.tenantId || 'default',
        tenantName: 'المؤسسة الافتراضية',
        sections: [],
        settings: {
          theme: newPageForm.theme,
          primaryColor: newPageForm.primaryColor,
          secondaryColor: newPageForm.secondaryColor,
          fontFamily: 'Tajawal',
          customCSS: ''
        },
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setLandingPages(prev => [...prev, newPage]);
      
      toast({
        title: 'تم إنشاء الصفحة بنجاح',
        description: `تم إنشاء الصفحة "${newPageForm.name}" بنجاح`
      });
      
      setShowCreatePage(false);
      resetPageForm();
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء الصفحة',
        description: 'حدث خطأ أثناء إنشاء الصفحة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!selectedPage) return;

    // إظهار تأكيد قبل إضافة القسم
    setConfirmationDialog({
      isOpen: true,
      title: 'تأكيد إضافة قسم جديد',
      message: `هل تريد إضافة قسم "${t(newSectionForm.type)}" إلى الصفحة؟`,
      onConfirm: () => {
        const newSection: PageSection = {
          id: `section-${Date.now()}`,
          type: newSectionForm.type,
          title: newSectionForm.title || t(newSectionForm.type),
          content: getDefaultSectionContent(newSectionForm.type),
          order: selectedPage.sections.length + 1,
          isVisible: true,
          settings: {
            backgroundColor: newSectionForm.backgroundColor,
            textColor: newSectionForm.textColor
          }
        };

        const updatedPage = {
          ...selectedPage,
          sections: [...selectedPage.sections, newSection],
          updatedAt: new Date().toISOString()
        };

        setLandingPages(prev =>
          prev.map(page => page.id === selectedPage.id ? updatedPage : page)
        );

        setSelectedPage(updatedPage);
        setShowSectionEditor(false);
        resetSectionForm();

        toast({
          title: 'تم إضافة القسم بنجاح',
          description: `تم إضافة قسم "${newSection.title}" إلى الصفحة`
        });
      }
    });
  };

  const getDefaultSectionContent = (type: PageSection['type']) => {
    const defaults = {
      hero: {
        headline: 'عنوان رئيسي جذاب',
        subtitle: 'وصف مختصر وواضح',
        buttonText: 'ابدأ الآن',
        backgroundImage: ''
      },
      features: {
        features: [
          { title: 'ميزة رائعة', description: 'وصف الميزة', icon: 'star' }
        ]
      },
      testimonials: {
        testimonials: [
          { name: 'عميل راضي', comment: 'خدمة ممتازة', rating: 5 }
        ]
      },
      pricing: {
        plans: [
          { name: 'الباقة الأساسية', price: '99', features: ['ميزة 1', 'ميزة 2'] }
        ]
      },
      contact: {
        title: 'تواصل معنا',
        phone: '+966 50 123 4567',
        email: 'info@example.com',
        address: 'الرياض، المملكة العربية السعودية'
      },
      gallery: {
        images: []
      },
      about: {
        title: 'من نحن',
        description: 'نبذة عن الشركة',
        team: []
      },
      custom: {
        html: '<div class="text-center"><h2>محتوى مخصص</h2></div>'
      }
    };

    return defaults[type] || {};
  };

  const deletePage = (page: LandingPage) => {
    setLandingPages(prev => prev.filter(p => p.id !== page.id));
    if (selectedPage?.id === page.id) {
      setSelectedPage(null);
      setShowPageEditor(false);
    }
    toast({
      title: 'تم حذف الصفحة',
      description: `تم حذف الصفحة "${page.name}" بنجاح`
    });
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const duplicatePage = (page: LandingPage) => {
    const duplicatedPage: LandingPage = {
      ...page,
      id: Date.now().toString(),
      name: `${page.name} - نسخة`,
      slug: `${page.slug}-copy`,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined
    };

    setLandingPages(prev => [...prev, duplicatedPage]);
    toast({
      title: 'تم نسخ الصفحة',
      description: `تم إنشاء نسخة من الصفحة "${page.name}"`
    });
  };

  const togglePublishPage = (page: LandingPage) => {
    const updatedPage = {
      ...page,
      isPublished: !page.isPublished,
      publishedAt: !page.isPublished ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };

    setLandingPages(prev =>
      prev.map(p => p.id === page.id ? updatedPage : p)
    );

    if (selectedPage?.id === page.id) {
      setSelectedPage(updatedPage);
    }

    toast({
      title: page.isPublished ? 'تم إلغاء نشر الصفحة' : 'تم نشر الصفحة',
      description: page.isPublished 
        ? `تم إلغاء نشر الصفحة "${page.name}"` 
        : `تم نشر الصفحة "${page.name}" بنجاح`
    });
  };

  const resetPageForm = () => {
    setNewPageForm({
      name: '',
      slug: '',
      title: '',
      description: '',
      tenantId: '',
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b'
    });
  };

  const resetSectionForm = () => {
    setNewSectionForm({
      type: 'hero',
      title: '',
      content: {},
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });
  };

  // إحصائيات الصفحات
  const pageStats = {
    total: landingPages.length,
    published: landingPages.filter(p => p.isPublished).length,
    drafts: landingPages.filter(p => !p.isPublished).length,
    sections: landingPages.reduce((sum, page) => sum + page.sections.length, 0)
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">محرر الصفحات المقصودة</h2>
            <p className="text-muted-foreground">
              إنشاء وإدارة الصفحات المقصودة للمؤسسات
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={() => window.location.reload()}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              تحديث
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName="صفحة جديدة"
              onClick={() => {
                resetPageForm();
                setShowCreatePage(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              صفحة جديدة
            </ActionButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">إجمالي الصفحات</p>
                  <p className="text-2xl font-bold text-right">{formatNumber(pageStats.total)}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Layout className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">منشورة</p>
                  <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(pageStats.published)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">مسودات</p>
                  <p className="text-2xl font-bold text-orange-600 text-right">{formatNumber(pageStats.drafts)}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Edit className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">الأقسام</p>
                  <p className="text-2xl font-bold text-purple-600 text-right">{formatNumber(pageStats.sections)}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Type className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pages">الصفحات</TabsTrigger>
            <TabsTrigger value="templates">القوالب</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <LoadingState
              loading={false}
              isEmpty={landingPages.length === 0}
              emptyMessage="لا توجد صفحات مقصودة"
            >
              <EnhancedTable
                data={landingPages}
                columns={pageColumns}
                actions={pageActions}
                searchable
                searchPlaceholder="البحث في الصفحات..."
                onRefresh={() => window.location.reload()}
                emptyMessage="لا توجد صفحات مقصودة"
                maxHeight="600px"
                stickyHeader
              />
            </LoadingState>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <Layout className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button size="sm">
                        استخدام القالب
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات عامة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>النطاق الافتراضي</Label>
                    <Input defaultValue="https://example.com" />
                  </div>
                  <div>
                    <Label>اللغة الافتراضية</Label>
                    <Select defaultValue="ar">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">الإنجليزية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات التحسين</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>ضغط الصور</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>تحسين الـ CSS</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>تشغيل التخزين المؤقت</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Page Dialog */}
        <EnhancedDialog
          open={showCreatePage}
          onOpenChange={setShowCreatePage}
          title="إنشاء صفحة مقصودة جديدة"
          description="قم بملء المعلومات الأساسية للصفحة الجديدة"
          size="lg"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page-name">اسم الصفحة</Label>
                <Input
                  id="page-name"
                  value={newPageForm.name}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: صفحة الشركة الرئيسية"
                />
              </div>
              <div>
                <Label htmlFor="page-slug">الرابط المختصر</Label>
                <Input
                  id="page-slug"
                  value={newPageForm.slug}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="company-homepage"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="page-title">عنوان الصفحة</Label>
              <Input
                id="page-title"
                value={newPageForm.title}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="العنوان الذي سيظهر في تبويب المتصفح"
              />
            </div>

            <div>
              <Label htmlFor="page-description">وصف الصفحة</Label>
              <Textarea
                id="page-description"
                value={newPageForm.description}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للصفحة سيظهر في نتائج البحث"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="page-theme">السمة</Label>
                <Select
                  value={newPageForm.theme}
                  onValueChange={(value) => setNewPageForm(prev => ({ ...prev, theme: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="primary-color">اللون الأساسي</Label>
                <Input
                  id="primary-color"
                  type="color"
                  value={newPageForm.primaryColor}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="secondary-color">اللون الثانوي</Label>
                <Input
                  id="secondary-color"
                  type="color"
                  value={newPageForm.secondaryColor}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreatePage(false)}
              >
                إلغاء
              </Button>
              <ActionButton
                action="create"
                itemName="الصفحة"
                onClick={handleCreatePage}
                loading={loading}
              >
                إنشاء الصفحة
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Add Section Dialog */}
        <EnhancedDialog
          open={showSectionEditor}
          onOpenChange={setShowSectionEditor}
          title="إضافة قسم جديد"
          description="اختر نوع القسم وأعدّ محتواه"
          size="md"
          showCloseButton
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-type">نوع القسم</Label>
              <Select
                value={newSectionForm.type}
                onValueChange={(value) => setNewSectionForm(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">القسم الرئيسي</SelectItem>
                  <SelectItem value="features">المميزات</SelectItem>
                  <SelectItem value="testimonials">آراء العملاء</SelectItem>
                  <SelectItem value="pricing">الأسعار</SelectItem>
                  <SelectItem value="contact">التواصل</SelectItem>
                  <SelectItem value="gallery">معرض الصور</SelectItem>
                  <SelectItem value="about">من نحن</SelectItem>
                  <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="section-title">عنوان القسم</Label>
              <Input
                id="section-title"
                value={newSectionForm.title}
                onChange={(e) => setNewSectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t(newSectionForm.type)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bg-color">لون الخلفية</Label>
                <Input
                  id="bg-color"
                  type="color"
                  value={newSectionForm.backgroundColor}
                  onChange={(e) => setNewSectionForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="text-color">لون النص</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={newSectionForm.textColor}
                  onChange={(e) => setNewSectionForm(prev => ({ ...prev, textColor: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSectionEditor(false)}
              >
                إلغاء
              </Button>
              <ActionButton
                action="create"
                itemName="القسم"
                onClick={handleAddSection}
                loading={loading}
              >
                إضافة القسم
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Page Editor Dialog */}
        <EnhancedDialog
          open={showPageEditor}
          onOpenChange={setShowPageEditor}
          title={selectedPage ? `تحرير: ${selectedPage.name}` : ''}
          description="تحرير محتوى وتصميم الصفحة"
          size="lg"
          showCloseButton
        >
          {selectedPage && (
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-80 border-l bg-muted/30 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">أقسام الصفحة</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowSectionEditor(true)}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة قسم
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedPage.sections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-background"
                      >
                        <div>
                          <div className="font-medium text-sm">{section.title}</div>
                          <div className="text-xs text-muted-foreground">{t(section.type)}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Preview Controls */}
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">معاينة</Label>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'tablet' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('tablet')}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Editor Area */}
              <div className="flex-1 p-4">
                <div className={`mx-auto border rounded-lg bg-white ${
                  previewMode === 'mobile' ? 'max-w-sm' :
                  previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-6xl'
                }`}>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">{selectedPage.title}</h1>
                    <p className="text-muted-foreground mb-8">{selectedPage.description}</p>
                    
                    {selectedPage.sections.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">لا توجد أقسام</h3>
                        <p>ابدأ بإضافة قسم جديد لبناء صفحتك</p>
                        <Button
                          className="mt-4"
                          onClick={() => setShowSectionEditor(true)}
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة قسم
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {selectedPage.sections
                          .sort((a, b) => a.order - b.order)
                          .map((section) => (
                            <div
                              key={section.id}
                              className="border-2 border-dashed border-muted rounded-lg p-6"
                              style={{
                                backgroundColor: section.settings.backgroundColor,
                                color: section.settings.textColor
                              }}
                            >
                              <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                              <div className="text-sm text-muted-foreground">
                                قسم من نوع: {t(section.type)}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </EnhancedDialog>

        {/* Confirmation Dialog */}
        <EnhancedDialog
          open={confirmationDialog.isOpen}
          onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}
          title={confirmationDialog.title}
          description="تأكيد الإجراء"
          size="sm"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 ml-2" />
                <div>
                  <p className="text-sm text-yellow-800">
                    {confirmationDialog.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  confirmationDialog.onConfirm();
                  setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default LandingPageEditor; 