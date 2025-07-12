import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TenantTheme = Database['public']['Tables']['tenant_themes']['Row'];
type TenantThemeInsert = Database['public']['Tables']['tenant_themes']['Insert'];
type TenantThemeUpdate = Database['public']['Tables']['tenant_themes']['Update'];

export interface ThemeColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  info_color: string;
}

export interface ThemeTypography {
  font_family: string;
  font_size_base: string;
  font_weight_base: string;
}

export interface ThemeLayout {
  border_radius: string;
  spacing_unit: string;
}

export const tenantThemeService = {
  // الحصول على الثيم الحالي للتينانت
  async getCurrentTheme(tenantId?: string): Promise<TenantTheme | null> {
    const { data, error } = await supabase
      .from('tenant_themes')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current theme:', error);
      throw error;
    }

    return data;
  },

  // الحصول على جميع الثيمات للتينانت
  async getThemes(): Promise<TenantTheme[]> {
    const { data, error } = await supabase
      .from('tenant_themes')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching themes:', error);
      throw error;
    }

    return data || [];
  },

  // إنشاء ثيم جديد
  async createTheme(theme: Omit<TenantThemeInsert, 'id' | 'created_at' | 'updated_at'>): Promise<TenantTheme> {
    const { data, error } = await supabase
      .from('tenant_themes')
      .insert(theme)
      .select()
      .single();

    if (error) {
      console.error('Error creating theme:', error);
      throw error;
    }

    return data;
  },

  // تحديث ثيم موجود
  async updateTheme(id: string, updates: Partial<TenantThemeUpdate>): Promise<TenantTheme> {
    const { data, error } = await supabase
      .from('tenant_themes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating theme:', error);
      throw error;
    }

    return data;
  },

  // حذف ثيم
  async deleteTheme(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenant_themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting theme:', error);
      throw error;
    }
  },

  // تعيين ثيم كافتراضي
  async setDefaultTheme(id: string): Promise<void> {
    // إزالة الافتراضي من جميع الثيمات الأخرى
    const { error: clearError } = await supabase
      .from('tenant_themes')
      .update({ is_default: false })
      .neq('id', id);

    if (clearError) {
      console.error('Error clearing default themes:', clearError);
      throw clearError;
    }

    // تعيين الثيم الجديد كافتراضي
    const { error: setError } = await supabase
      .from('tenant_themes')
      .update({ is_default: true, is_active: true })
      .eq('id', id);

    if (setError) {
      console.error('Error setting default theme:', setError);
      throw setError;
    }
  },

  // تطبيق الثيم الحالي على العناصر
  async applyTheme(theme: TenantTheme): Promise<void> {
    const root = document.documentElement;
    
    // تطبيق الألوان
    root.style.setProperty('--primary', this.hexToHsl(theme.primary_color || '#2563eb'));
    root.style.setProperty('--secondary', this.hexToHsl(theme.secondary_color || '#64748b'));
    root.style.setProperty('--accent', this.hexToHsl(theme.accent_color || '#f59e0b'));
    root.style.setProperty('--background', this.hexToHsl(theme.background_color || '#ffffff'));
    root.style.setProperty('--surface', this.hexToHsl(theme.surface_color || '#f8fafc'));
    root.style.setProperty('--foreground', this.hexToHsl(theme.text_primary || '#1e293b'));
    root.style.setProperty('--muted-foreground', this.hexToHsl(theme.text_secondary || '#64748b'));
    
    // تطبيق ألوان الحالة
    root.style.setProperty('--success', this.hexToHsl(theme.success_color || '#10b981'));
    root.style.setProperty('--warning', this.hexToHsl(theme.warning_color || '#f59e0b'));
    root.style.setProperty('--destructive', this.hexToHsl(theme.error_color || '#ef4444'));
    root.style.setProperty('--info', this.hexToHsl(theme.info_color || '#3b82f6'));
    
    // تطبيق خصائص الخط
    if (theme.font_family) {
      root.style.setProperty('--font-family', theme.font_family);
    }
    
    // تطبيق خصائص التخطيط
    if (theme.border_radius) {
      root.style.setProperty('--radius', theme.border_radius);
    }
    
    // تطبيق CSS مخصص
    if (theme.custom_css) {
      this.applyCustomCSS(theme.custom_css);
    }
  },

  // تحويل هيكس إلى HSL
  hexToHsl(hex: string): string {
    // إزالة الـ # إذا كان موجود
    hex = hex.replace(/^#/, '');
    
    // تحويل إلى RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  },

  // تطبيق CSS مخصص
  applyCustomCSS(customCSS: any): void {
    // إزالة الستايل المخصص السابق
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // إضافة الستايل الجديد
    if (customCSS && typeof customCSS === 'object') {
      const style = document.createElement('style');
      style.id = 'tenant-custom-css';
      
      let cssText = '';
      Object.entries(customCSS).forEach(([selector, rules]) => {
        if (typeof rules === 'object') {
          cssText += `${selector} {\n`;
          Object.entries(rules as Record<string, string>).forEach(([property, value]) => {
            cssText += `  ${property}: ${value};\n`;
          });
          cssText += '}\n';
        }
      });
      
      style.textContent = cssText;
      document.head.appendChild(style);
    }
  },

  // إنشاء ثيم افتراضي للتينانت الجديد
  async createDefaultTheme(tenantId: string): Promise<TenantTheme> {
    const defaultTheme: Omit<TenantThemeInsert, 'id' | 'created_at' | 'updated_at'> = {
      tenant_id: tenantId,
      theme_name: 'الثيم الافتراضي',
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      accent_color: '#f59e0b',
      background_color: '#ffffff',
      surface_color: '#f8fafc',
      text_primary: '#1e293b',
      text_secondary: '#64748b',
      success_color: '#10b981',
      warning_color: '#f59e0b',
      error_color: '#ef4444',
      info_color: '#3b82f6',
      font_family: 'Inter',
      font_size_base: '16px',
      font_weight_base: '400',
      border_radius: '8px',
      spacing_unit: '4px',
      is_active: true,
      is_default: true
    };

    return this.createTheme(defaultTheme);
  }
};