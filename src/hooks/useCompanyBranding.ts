import { useState, useEffect } from 'react';
import { CompanyBrandingService, CompanyBranding } from '@/services/companyBrandingService';

export const useCompanyBranding = () => {
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CompanyBrandingService.getCompanyBranding();
      setBranding(data);
    } catch (err) {
      console.error('Error loading company branding:', err);
      setError('فشل في تحميل إعدادات الشركة');
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (updates: Partial<CompanyBranding>) => {
    try {
      const updatedBranding = await CompanyBrandingService.updateCompanyBranding(updates);
      setBranding(updatedBranding);
      return updatedBranding;
    } catch (err) {
      console.error('Error updating company branding:', err);
      throw err;
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const logoUrl = await CompanyBrandingService.uploadLogo(file);
      setBranding(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      return logoUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      throw err;
    }
  };

  const uploadHeaderImage = async (file: File) => {
    try {
      const headerUrl = await CompanyBrandingService.uploadHeaderImage(file);
      setBranding(prev => prev ? { ...prev, header_image_url: headerUrl } : null);
      return headerUrl;
    } catch (err) {
      console.error('Error uploading header image:', err);
      throw err;
    }
  };

  const uploadFooterImage = async (file: File) => {
    try {
      const footerUrl = await CompanyBrandingService.uploadFooterImage(file);
      setBranding(prev => prev ? { ...prev, footer_image_url: footerUrl } : null);
      return footerUrl;
    } catch (err) {
      console.error('Error uploading footer image:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  return {
    branding,
    loading,
    error,
    loadBranding,
    updateBranding,
    uploadLogo,
    uploadHeaderImage,
    uploadFooterImage
  };
};