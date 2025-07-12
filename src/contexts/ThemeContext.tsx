import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tenantThemeService, ThemeColors, ThemeTypography, ThemeLayout } from '@/services/tenantThemeService';
import { useTenant } from '@/contexts/TenantContext';
import { Database } from '@/integrations/supabase/types';

type TenantTheme = Database['public']['Tables']['tenant_themes']['Row'];

export interface ThemeContextType {
  currentTheme: TenantTheme | null;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  isLoading: boolean;
  error: string | null;
  
  // Theme management functions
  refreshTheme: () => Promise<void>;
  applyTheme: (theme: TenantTheme) => Promise<void>;
  updateThemeColors: (colors: Partial<ThemeColors>) => Promise<void>;
  updateThemeTypography: (typography: Partial<ThemeTypography>) => Promise<void>;
  updateThemeLayout: (layout: Partial<ThemeLayout>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<TenantTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTenant } = useTenant();

  // Default theme values
  const defaultColors: ThemeColors = {
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
    info_color: '#3b82f6'
  };

  const defaultTypography: ThemeTypography = {
    font_family: 'Inter',
    font_size_base: '16px',
    font_weight_base: '400'
  };

  const defaultLayout: ThemeLayout = {
    border_radius: '8px',
    spacing_unit: '4px'
  };

  // Extract theme properties
  const colors: ThemeColors = currentTheme ? {
    primary_color: currentTheme.primary_color || defaultColors.primary_color,
    secondary_color: currentTheme.secondary_color || defaultColors.secondary_color,
    accent_color: currentTheme.accent_color || defaultColors.accent_color,
    background_color: currentTheme.background_color || defaultColors.background_color,
    surface_color: currentTheme.surface_color || defaultColors.surface_color,
    text_primary: currentTheme.text_primary || defaultColors.text_primary,
    text_secondary: currentTheme.text_secondary || defaultColors.text_secondary,
    success_color: currentTheme.success_color || defaultColors.success_color,
    warning_color: currentTheme.warning_color || defaultColors.warning_color,
    error_color: currentTheme.error_color || defaultColors.error_color,
    info_color: currentTheme.info_color || defaultColors.info_color
  } : defaultColors;

  const typography: ThemeTypography = currentTheme ? {
    font_family: currentTheme.font_family || defaultTypography.font_family,
    font_size_base: currentTheme.font_size_base || defaultTypography.font_size_base,
    font_weight_base: currentTheme.font_weight_base || defaultTypography.font_weight_base
  } : defaultTypography;

  const layout: ThemeLayout = currentTheme ? {
    border_radius: currentTheme.border_radius || defaultLayout.border_radius,
    spacing_unit: currentTheme.spacing_unit || defaultLayout.spacing_unit
  } : defaultLayout;

  // Load theme on tenant change
  useEffect(() => {
    if (currentTenant) {
      loadCurrentTheme();
    }
  }, [currentTenant]);

  // Apply theme when it changes
  useEffect(() => {
    if (currentTheme) {
      tenantThemeService.applyTheme(currentTheme);
    }
  }, [currentTheme]);

  const loadCurrentTheme = async () => {
    if (!currentTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const theme = await tenantThemeService.getCurrentTheme(currentTenant.id);
      
      if (theme) {
        setCurrentTheme(theme);
      } else {
        // Create default theme if none exists
        const defaultTheme = await tenantThemeService.createDefaultTheme(currentTenant.id);
        setCurrentTheme(defaultTheme);
      }
    } catch (err) {
      console.error('Error loading theme:', err);
      setError('فشل في تحميل الثيم');
      // Set default theme on error
      setCurrentTheme({
        id: 'default',
        tenant_id: currentTenant.id,
        theme_name: 'الثيم الافتراضي',
        ...defaultColors,
        ...defaultTypography,
        ...defaultLayout,
        custom_css: {},
        is_active: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null
      } as TenantTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadCurrentTheme();
  };

  const applyTheme = async (theme: TenantTheme) => {
    setCurrentTheme(theme);
    await tenantThemeService.applyTheme(theme);
  };

  const updateThemeColors = async (newColors: Partial<ThemeColors>) => {
    if (!currentTheme || !currentTenant) return;

    try {
      const updatedTheme = await tenantThemeService.updateTheme(currentTheme.id, {
        ...newColors,
        updated_at: new Date().toISOString()
      });
      
      setCurrentTheme(updatedTheme);
    } catch (err) {
      console.error('Error updating theme colors:', err);
      setError('فشل في تحديث ألوان الثيم');
    }
  };

  const updateThemeTypography = async (newTypography: Partial<ThemeTypography>) => {
    if (!currentTheme || !currentTenant) return;

    try {
      const updatedTheme = await tenantThemeService.updateTheme(currentTheme.id, {
        ...newTypography,
        updated_at: new Date().toISOString()
      });
      
      setCurrentTheme(updatedTheme);
    } catch (err) {
      console.error('Error updating theme typography:', err);
      setError('فشل في تحديث خطوط الثيم');
    }
  };

  const updateThemeLayout = async (newLayout: Partial<ThemeLayout>) => {
    if (!currentTheme || !currentTenant) return;

    try {
      const updatedTheme = await tenantThemeService.updateTheme(currentTheme.id, {
        ...newLayout,
        updated_at: new Date().toISOString()
      });
      
      setCurrentTheme(updatedTheme);
    } catch (err) {
      console.error('Error updating theme layout:', err);
      setError('فشل في تحديث تخطيط الثيم');
    }
  };

  const resetToDefault = async () => {
    if (!currentTenant) return;

    try {
      // Find or create default theme
      let defaultTheme = await tenantThemeService.getCurrentTheme(currentTenant.id);
      
      if (!defaultTheme) {
        defaultTheme = await tenantThemeService.createDefaultTheme(currentTenant.id);
      }

      // Set as current theme
      await tenantThemeService.setDefaultTheme(defaultTheme.id);
      setCurrentTheme(defaultTheme);
    } catch (err) {
      console.error('Error resetting to default theme:', err);
      setError('فشل في إعادة تعيين الثيم الافتراضي');
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    colors,
    typography,
    layout,
    isLoading,
    error,
    refreshTheme,
    applyTheme,
    updateThemeColors,
    updateThemeTypography,
    updateThemeLayout,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};