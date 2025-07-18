// =======================================================
// نظام الاقتراحات الذكية للتسجيل
// =======================================================

// أنواع الشركات الشائعة في دولة الكويت
export const COMPANY_TYPES_KW = [
  'شركة النقل',
  'شركة التاكسي',
  'شركة الليموزين',
  'شركة تأجير السيارات',
  'شركة النقل البري',
  'شركة النقل السياحي',
  'شركة المقاولات',
  'شركة الخدمات اللوجستية',
  'شركة التوصيل',
  'شركة الشحن',
  'مؤسسة النقل',
  'مؤسسة التاكسي',
  'مؤسسة تأجير السيارات'
];

// أسماء شركات عامة للاقتراح
export const COMPANY_NAME_SUGGESTIONS = [
  'شركة الخليج للنقل',
  'شركة الكويت للتاكسي',
  'شركة النقل المتقدم',
  'شركة الليموزين الذهبي',
  'شركة النقل السريع',
  'مؤسسة التاكسي الأزرق',
  'شركة النقل الحديث',
  'شركة تأجير السيارات الفاخرة',
  'شركة النقل البحري',
  'مؤسسة الخدمات اللوجستية'
];

// مدن دولة الكويت
export const KUWAIT_CITIES = [
  'الكويت',
  'حولي',
  'الفروانية',
  'مبارك الكبير',
  'الأحمدي',
  'الجهراء',
  'العاصمة',
  'السالمية',
  'الفنطاس',
  'المنقف',
  'الفحيحيل',
  'صباح السالم',
  'الرقة',
  'الصباحية'
];

// أنماط أرقام الهواتف الكويتية
export const KUWAIT_PHONE_PATTERNS = [
  '+965 ',
  '965 ',
  '00965 '
];

// مولد كلمات مرور قوية
export const generateStrongPassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // ضمان وجود حرف من كل نوع
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // إضافة باقي الأحرف
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // خلط كلمة المرور
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// اقتراح كلمات مرور سهلة التذكر
export const generateReadablePassword = (): string => {
  const adjectives = ['سريع', 'قوي', 'ذكي', 'آمن', 'حديث', 'متقدم'];
  const nouns = ['نقل', 'تاكسي', 'سيارة', 'خدمة', 'شركة', 'مؤسسة'];
  const numbers = Math.floor(Math.random() * 999) + 100;
  const symbols = ['!', '@', '#', '$'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  return `${adjective}${noun}${numbers}${symbol}`;
};

// فلترة الاقتراحات بناءً على النص المدخل
export const filterSuggestions = (input: string, suggestions: string[]): string[] => {
  if (!input || input.length < 2) return [];
  
  const filtered = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(input.toLowerCase()) ||
    suggestion.includes(input)
  );
  
  return filtered.slice(0, 5); // أقصى 5 اقتراحات
};

// اقتراح إكمال البريد الإلكتروني
export const EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'company.com',
  'business.com'
];

export const suggestEmailCompletion = (email: string): string[] => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return [];
  
  const localPart = email.substring(0, atIndex + 1);
  const domainPart = email.substring(atIndex + 1);
  
  if (!domainPart) {
    return EMAIL_DOMAINS.map(domain => `${localPart}${domain}`);
  }
  
  return EMAIL_DOMAINS
    .filter(domain => domain.startsWith(domainPart.toLowerCase()))
    .map(domain => `${localPart}${domain}`)
    .slice(0, 3);
};

// التحقق من قوة كلمة المرور مع اقتراحات
export const analyzePasswordStrength = (password: string) => {
  let score = 0;
  const feedback = [];
  const suggestions = [];

  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('8 أحرف على الأقل');
    suggestions.push('جرب إضافة المزيد من الأحرف');
  }

  if (/(?=.*[a-z])/.test(password)) {
    score += 25;
  } else {
    feedback.push('حرف صغير');
    suggestions.push('أضف حروف صغيرة (a-z)');
  }

  if (/(?=.*[A-Z])/.test(password)) {
    score += 25;
  } else {
    feedback.push('حرف كبير');
    suggestions.push('أضف حروف كبيرة (A-Z)');
  }

  if (/(?=.*\d)/.test(password)) {
    score += 25;
  } else {
    feedback.push('رقم');
    suggestions.push('أضف أرقام (0-9)');
  }

  // نقاط إضافية للرموز
  if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    score += 10;
    if (score > 100) score = 100;
  } else {
    suggestions.push('أضف رموز (!@#$) لمزيد من الأمان');
  }

  let level = 'ضعيفة جداً';
  let color = 'bg-red-600';

  if (score >= 90) {
    level = 'قوية جداً';
    color = 'bg-green-600';
  } else if (score >= 75) {
    level = 'قوية';
    color = 'bg-green-500';
  } else if (score >= 50) {
    level = 'متوسطة';
    color = 'bg-yellow-500';
  } else if (score >= 25) {
    level = 'ضعيفة';
    color = 'bg-orange-500';
  }

  return { score, level, color, feedback, suggestions };
};

// اقتراحات ذكية للبيانات بناءً على السياق
export const getContextualSuggestions = (field: string, value: string, formData: any) => {
  switch (field) {
    case 'companyName':
      if (value.length >= 2) {
        return filterSuggestions(value, COMPANY_NAME_SUGGESTIONS);
      }
      return COMPANY_TYPES_KW.slice(0, 3);

    case 'city':
      return filterSuggestions(value, KUWAIT_CITIES);

    case 'contactPhone':
      if (!value.startsWith('+965') && !value.startsWith('965')) {
        return ['+965 ', '965 '];
      }
      return [];

    case 'adminEmail':
      if (formData.companyName && !value.includes('@')) {
        const slug = formData.companyName.toLowerCase()
          .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '')
          .substring(0, 8);
        return [`admin@${slug}.com`, `manager@${slug}.com`];
      }
      return suggestEmailCompletion(value);

    default:
      return [];
  }
}; 