
// مساعد للترجمة والتنسيق
export const useTranslation = () => {
  const t = (key: string): string => {
    const translations: Record<string, string> = {
      'organization': 'المؤسسة',
      'admin': 'إدارة',
      'total': 'المجموع',
      'active': 'النشط',
      'suspended': 'المعلق',
      'update': 'تحديث',
      'add': 'إضافة',
      'search': 'البحث',
      'delete': 'حذف',
    };
    return translations[key] || key;
  };

  const msg = (type: string, action?: string, item?: string): string => {
    const messages: Record<string, string> = {
      'success.deleted': `تم حذف ${item || 'العنصر'} بنجاح`,
      'error.failed': `فشل في ${action || 'العملية'}`,
      'info.empty': 'لا توجد بيانات للعرض',
    };
    
    const key = action ? `${type}.${action}` : type;
    return messages[key] || `${type} ${action || ''} ${item || ''}`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  return { t, msg, formatNumber };
};

export const formatStatus = (status: string) => {
  const statusMap: Record<string, { text: string; variant: string }> = {
    'active': { text: 'نشط', variant: 'default' },
    'trial': { text: 'تجريبي', variant: 'secondary' },
    'suspended': { text: 'معلق', variant: 'destructive' },
    'cancelled': { text: 'ملغي', variant: 'outline' },
  };
  
  return statusMap[status] || { text: status, variant: 'outline' };
};
