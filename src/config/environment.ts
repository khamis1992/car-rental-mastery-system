// ===================================
// تكوين متغيرات البيئة الآمن
// ===================================

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    url: string;
    env: string;
  };
  payment: {
    sadad: {
      apiUrl: string;
      merchantId?: string;
      merchantKey?: string;
    };
    stripe: {
      publishableKey?: string;
    };
  };
  ai: {
    openaiApiKey?: string;
  };
}

// التحقق من وجود متغيرات البيئة المطلوبة
const getEnvironmentVariable = (key: keyof ImportMetaEnv, fallback?: string): string => {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    console.warn(`⚠️ متغير البيئة ${key} غير محدد`);
  }
  return value || '';
};

export const environment: EnvironmentConfig = {
  supabase: {
    url: getEnvironmentVariable('VITE_SUPABASE_URL', 'https://rtottdvuftbqktzborvv.supabase.co'),
    anonKey: getEnvironmentVariable('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0b3R0ZHZ1ZnRicWt0emJvcnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODY2ODEsImV4cCI6MjA2Njk2MjY4MX0.jRVYkaYGCLr7f7SK3zo6x4KumaMard49pNc9xneoUbI')
  },
  app: {
    name: getEnvironmentVariable('VITE_APP_NAME', 'نظام إدارة تأجير السيارات'),
    url: getEnvironmentVariable('VITE_APP_URL', 'http://localhost:5173'),
    env: getEnvironmentVariable('VITE_APP_ENV', 'development')
  },
  payment: {
    sadad: {
      apiUrl: getEnvironmentVariable('VITE_SADAD_API_URL', 'https://api.sadad.qa/v1'),
      merchantId: getEnvironmentVariable('VITE_SADAD_MERCHANT_ID'),
      merchantKey: getEnvironmentVariable('VITE_SADAD_MERCHANT_KEY')
    },
    stripe: {
      publishableKey: getEnvironmentVariable('VITE_STRIPE_PUBLISHABLE_KEY')
    }
  },
  ai: {
    openaiApiKey: getEnvironmentVariable('VITE_OPENAI_API_KEY')
  }
};

// التحقق من التكوين في بيئة التطوير
if (environment.app.env === 'development') {
  console.log('🔧 Environment Configuration:', {
    app: environment.app,
    supabaseConfigured: !!environment.supabase.url,
    sadadConfigured: !!environment.payment.sadad.merchantId,
    stripeConfigured: !!environment.payment.stripe.publishableKey,
    aiConfigured: !!environment.ai.openaiApiKey
  });
}

export default environment; 