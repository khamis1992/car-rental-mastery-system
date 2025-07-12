import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LandingContent {
  id: string;
  section_name: string;
  content_key: string;
  content_value: any;
  content_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useLandingContent = (sectionName?: string) => {
  const [content, setContent] = useState<LandingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true)
        .order('section_name', { ascending: true })
        .order('content_key', { ascending: true });

      if (sectionName) {
        query = query.eq('section_name', sectionName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching landing content:', error);
      toast({
        title: "خطأ في جلب المحتوى",
        description: "حدث خطأ أثناء جلب محتوى الصفحة الرئيسية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, updates: Partial<LandingContent>) => {
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المحتوى بنجاح",
      });

      fetchContent(); // Refresh data
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث المحتوى",
        variant: "destructive",
      });
    }
  };

  const createContent = async (newContent: Omit<LandingContent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .insert([newContent]);

      if (error) throw error;

      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء المحتوى الجديد بنجاح",
      });

      fetchContent(); // Refresh data
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: "حدث خطأ أثناء إنشاء المحتوى",
        variant: "destructive",
      });
    }
  };

  const getContentValue = (sectionName: string, contentKey: string, lang: 'ar' | 'en' = 'ar') => {
    const item = content.find(c => c.section_name === sectionName && c.content_key === contentKey);
    if (!item) return '';
    
    if (item.content_type === 'json' && typeof item.content_value === 'object' && item.content_value[lang]) {
      return item.content_value[lang];
    }
    
    return item.content_value || '';
  };

  useEffect(() => {
    fetchContent();
  }, [sectionName]);

  return {
    content,
    loading,
    updateContent,
    createContent,
    fetchContent,
    getContentValue
  };
};