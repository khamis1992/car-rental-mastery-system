
interface TranslationMap {
  [key: string]: string;
}

const translations: TranslationMap = {
  // Common terms
  'organization': 'المؤسسة',
  'admin': 'إدارة',
  'update': 'تحديث',
  'add': 'إضافة',
  'edit': 'تحرير',
  'delete': 'حذف',
  'search': 'البحث',
  'total': 'الإجمالي',
  'active': 'نشط',
  'pending': 'معلق',
  'suspended': 'معلق',
  'cancelled': 'ملغي',
  'trial': 'تجريبي',
};

const messages: { [key: string]: { [key: string]: string } } = {
  'success': {
    'created': 'تم الإنشاء بنجاح',
    'updated': 'تم التحديث بنجاح',
    'deleted': 'تم الحذف بنجاح',
  },
  'error': {
    'failed': 'فشل في',
    'not_found': 'لم يتم العثور على',
  },
  'info': {
    'empty': 'لا توجد بيانات',
    'loading': 'جاري التحميل...',
  }
};

export const useTranslation = () => {
  const t = (key: string): string => {
    return translations[key] || key;
  };

  const msg = (type: string, action?: string, item?: string): string => {
    if (type && action && messages[type] && messages[type][action]) {
      return `${messages[type][action]} ${item || ''}`.trim();
    }
    return `${type} ${action || ''} ${item || ''}`.trim();
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  return { t, msg, formatNumber };
};

export const formatStatus = (status: string) => {
  const statusMap: { [key: string]: { text: string; variant: string } } = {
    'active': { text: 'نشط', variant: 'default' },
    'pending': { text: 'معلق', variant: 'secondary' },
    'suspended': { text: 'معلق', variant: 'destructive' },
    'cancelled': { text: 'ملغي', variant: 'outline' },
    'trial': { text: 'تجريبي', variant: 'secondary' },
  };

  return statusMap[status] || { text: status, variant: 'outline' };
};
