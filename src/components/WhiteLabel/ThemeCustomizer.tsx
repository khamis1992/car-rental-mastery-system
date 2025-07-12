import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Palette, Type, Layout, RotateCcw, Save, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, description }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-8 p-0 border-0"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

export const ThemeCustomizer: React.FC = () => {
  const { 
    currentTheme, 
    colors, 
    typography, 
    layout, 
    isLoading, 
    error,
    updateThemeColors,
    updateThemeTypography,
    updateThemeLayout,
    resetToDefault,
    refreshTheme
  } = useTheme();

  const [activeTab, setActiveTab] = useState('colors');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for pending changes
  const [pendingColors, setPendingColors] = useState(colors);
  const [pendingTypography, setPendingTypography] = useState(typography);
  const [pendingLayout, setPendingLayout] = useState(layout);

  const hasUnsavedChanges = () => {
    return JSON.stringify(pendingColors) !== JSON.stringify(colors) ||
           JSON.stringify(pendingTypography) !== JSON.stringify(typography) ||
           JSON.stringify(pendingLayout) !== JSON.stringify(layout);
  };

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges()) return;

    setIsSaving(true);
    try {
      // Save colors if changed
      if (JSON.stringify(pendingColors) !== JSON.stringify(colors)) {
        await updateThemeColors(pendingColors);
      }

      // Save typography if changed
      if (JSON.stringify(pendingTypography) !== JSON.stringify(typography)) {
        await updateThemeTypography(pendingTypography);
      }

      // Save layout if changed
      if (JSON.stringify(pendingLayout) !== JSON.stringify(layout)) {
        await updateThemeLayout(pendingLayout);
      }

      await refreshTheme();
    } catch (err) {
      console.error('Error saving theme changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefault();
      setPendingColors(colors);
      setPendingTypography(typography);
      setPendingLayout(layout);
    } catch (err) {
      console.error('Error resetting theme:', err);
    }
  };

  const handleDiscardChanges = () => {
    setPendingColors(colors);
    setPendingTypography(typography);
    setPendingLayout(layout);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">جاري التحميل...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold rtl-title">تخصيص الثيم</h2>
          <p className="text-muted-foreground">
            قم بتخصيص ألوان وخطوط ومظهر التطبيق حسب علامتك التجارية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentTheme?.is_active ? "default" : "secondary"}>
            {currentTheme?.is_active ? "نشط" : "غير نشط"}
          </Badge>
          {currentTheme?.is_default && (
            <Badge variant="outline">افتراضي</Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Switch
            checked={previewMode}
            onCheckedChange={setPreviewMode}
            id="preview-mode"
          />
          <Label htmlFor="preview-mode" className="rtl-label">
            <Eye className="w-4 h-4 inline mr-2" />
            معاينة مباشرة
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges() && (
            <>
              <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                تجاهل التغييرات
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveChanges} 
                disabled={isSaving}
                className="rtl-flex"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </>
          )}
          
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* Theme Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">إعدادات الثيم</CardTitle>
          <CardDescription>
            استخدم الألسنة أدناه لتخصيص جوانب مختلفة من مظهر التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="rtl-flex">
                <Palette className="w-4 h-4" />
                الألوان
              </TabsTrigger>
              <TabsTrigger value="typography" className="rtl-flex">
                <Type className="w-4 h-4" />
                الخطوط
              </TabsTrigger>
              <TabsTrigger value="layout" className="rtl-flex">
                <Layout className="w-4 h-4" />
                التخطيط
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Colors */}
                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">الألوان الأساسية</h4>
                  <ColorInput
                    label="اللون الأساسي"
                    value={pendingColors.primary_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, primary_color: value }))}
                    description="اللون الرئيسي للعلامة التجارية"
                  />
                  <ColorInput
                    label="اللون الثانوي"
                    value={pendingColors.secondary_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, secondary_color: value }))}
                    description="لون مساعد للتمييز"
                  />
                  <ColorInput
                    label="لون التمييز"
                    value={pendingColors.accent_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, accent_color: value }))}
                    description="للتركيز والإجراءات المهمة"
                  />
                </div>

                {/* Background Colors */}
                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">ألوان الخلفية</h4>
                  <ColorInput
                    label="لون الخلفية"
                    value={pendingColors.background_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, background_color: value }))}
                    description="الخلفية الرئيسية للصفحة"
                  />
                  <ColorInput
                    label="لون السطح"
                    value={pendingColors.surface_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, surface_color: value }))}
                    description="خلفية البطاقات والعناصر"
                  />
                  <ColorInput
                    label="لون النص الأساسي"
                    value={pendingColors.text_primary}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, text_primary: value }))}
                    description="لون النص الرئيسي"
                  />
                  <ColorInput
                    label="لون النص الثانوي"
                    value={pendingColors.text_secondary}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, text_secondary: value }))}
                    description="لون النص المساعد"
                  />
                </div>
              </div>

              <Separator />

              {/* Status Colors */}
              <div>
                <h4 className="font-medium mb-4 rtl-title">ألوان الحالة</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorInput
                    label="النجاح"
                    value={pendingColors.success_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, success_color: value }))}
                  />
                  <ColorInput
                    label="التحذير"
                    value={pendingColors.warning_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, warning_color: value }))}
                  />
                  <ColorInput
                    label="الخطأ"
                    value={pendingColors.error_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, error_color: value }))}
                  />
                  <ColorInput
                    label="المعلومات"
                    value={pendingColors.info_color}
                    onChange={(value) => setPendingColors(prev => ({ ...prev, info_color: value }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">إعدادات الخط</h4>
                  
                  <div className="space-y-2">
                    <Label className="rtl-label">عائلة الخط</Label>
                    <Input
                      value={pendingTypography.font_family}
                      onChange={(e) => setPendingTypography(prev => ({ ...prev, font_family: e.target.value }))}
                      placeholder="Inter, Arial, sans-serif"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="rtl-label">حجم الخط الأساسي</Label>
                    <Input
                      value={pendingTypography.font_size_base}
                      onChange={(e) => setPendingTypography(prev => ({ ...prev, font_size_base: e.target.value }))}
                      placeholder="16px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="rtl-label">سُمك الخط الأساسي</Label>
                    <Input
                      value={pendingTypography.font_weight_base}
                      onChange={(e) => setPendingTypography(prev => ({ ...prev, font_weight_base: e.target.value }))}
                      placeholder="400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">معاينة النص</h4>
                  <div 
                    className="p-4 border rounded-lg space-y-2"
                    style={{
                      fontFamily: pendingTypography.font_family,
                      fontSize: pendingTypography.font_size_base,
                      fontWeight: pendingTypography.font_weight_base
                    }}
                  >
                    <h1 className="text-2xl font-bold">عنوان رئيسي</h1>
                    <h2 className="text-xl font-semibold">عنوان فرعي</h2>
                    <p>نص عادي للمعاينة. هذا مثال على النص العادي في التطبيق.</p>
                    <p className="text-sm text-muted-foreground">نص صغير ثانوي</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">إعدادات التخطيط</h4>
                  
                  <div className="space-y-2">
                    <Label className="rtl-label">نصف قطر الحدود</Label>
                    <Input
                      value={pendingLayout.border_radius}
                      onChange={(e) => setPendingLayout(prev => ({ ...prev, border_radius: e.target.value }))}
                      placeholder="8px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="rtl-label">وحدة التباعد</Label>
                    <Input
                      value={pendingLayout.spacing_unit}
                      onChange={(e) => setPendingLayout(prev => ({ ...prev, spacing_unit: e.target.value }))}
                      placeholder="4px"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium rtl-title">معاينة التخطيط</h4>
                  <div className="space-y-4">
                    <div 
                      className="p-4 border bg-card"
                      style={{ borderRadius: pendingLayout.border_radius }}
                    >
                      بطاقة بنصف قطر: {pendingLayout.border_radius}
                    </div>
                    
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 bg-primary"
                        style={{ borderRadius: pendingLayout.border_radius }}
                      />
                      <div 
                        className="w-8 h-8 bg-secondary"
                        style={{ borderRadius: pendingLayout.border_radius }}
                      />
                      <div 
                        className="w-8 h-8 bg-accent"
                        style={{ borderRadius: pendingLayout.border_radius }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};