import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { handleError, createSafeAbortController } from '@/utils/errorHandling';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'accountant' | 'technician' | 'receptionist' | 'super_admin';
  is_active: boolean;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSaasAdmin: boolean;
  sessionValid: boolean;
  sessionTimeRemaining: number;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  checkSaasAdmin: () => boolean;
  refreshSession: () => Promise<boolean>;
  forceSessionRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaasAdmin, setIsSaasAdmin] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    if (!userId) return null;
    
    // إنشاء AbortController للتحكم في الطلب
    const controller = createSafeAbortController(10000); // 10 ثواني timeout
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .single();
      
      if (error) {
        const errorResult = handleError(error, 'auth-fetchProfile');
        
        // إعادة المحاولة للأخطاء المؤقتة
        if (errorResult.retry && retryCount < 2) {
          console.log(`🔄 Retrying fetch profile, attempt ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchProfile(userId, retryCount + 1);
        }
        
        if (errorResult.shouldLog) {
          console.error('❌ خطأ في جلب الملف الشخصي:', error);
        }
        return null;
      }
      
      return data;
    } catch (error: any) {
      const errorResult = handleError(error, 'auth-fetchProfile-catch');
      
      if (!errorResult.handled) {
        console.error('❌ خطأ غير متوقع في جلب الملف الشخصي:', error);
      }
      
      return null;
    } finally {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // إعداد مستمع تغيير حالة المصادقة مع معالجة محسنة للأخطاء
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          console.log(`🔐 Auth event: ${event}`, session?.user?.email);
          
          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            // جلب الملف الشخصي مع تأخير قصير لضمان استقرار الجلسة
            const delay = event === 'SIGNED_IN' ? 500 : 0;
            setTimeout(async () => {
              if (!isMounted) return;
              
              const userProfile = await fetchProfile(session.user.id);
              if (isMounted) {
                setProfile(userProfile);
              }
            }, delay);
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            // تنظيف البيانات المحلية
            localStorage.removeItem('profile-cache');
          }
          
          setLoading(false);
        } catch (error) {
          handleError(error, 'auth-onAuthStateChange');
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // التحقق من الجلسة الحالية مع معالجة أفضل للأخطاء
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          const errorResult = handleError(error, 'auth-getSession');
          if (errorResult.shouldLog) {
            console.error('❌ خطأ في جلب الجلسة:', error);
          }
        }
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        handleError(error, 'auth-initialize');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { error };
      }
      
      // تأخير قصير للسماح للجلسة بالاستقرار
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { error: null };
    } catch (error) {
      console.error('خطأ غير متوقع في تسجيل الدخول:', error);
      return { error };
    } finally {
      setTimeout(() => setLoading(false), 500); // تأخير قصير لتجنب الوميض
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // مسح البيانات المحلية أولاً
      setProfile(null);
      localStorage.removeItem('profile-cache');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('خطأ في تسجيل الخروج:', error);
      }
    } catch (error) {
      console.error('خطأ غير متوقع في تسجيل الخروج:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const checkSaasAdmin = useCallback((): boolean => {
    return user?.email === 'admin@admin.com';
  }, [user]);

  // دالة تحديث الجلسة
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 محاولة تحديث الجلسة...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ فشل في تحديث الجلسة:', error);
        setSessionValid(false);
        return false;
      }
      
      if (data.session) {
        console.log('✅ تم تحديث الجلسة بنجاح');
        setSession(data.session);
        setUser(data.session.user);
        setSessionValid(true);
        
        // تحديث النشاط في قاعدة البيانات
        try {
          await supabase.rpc('update_user_last_activity');
        } catch (updateError) {
          console.warn('⚠️ تعذر تحديث آخر نشاط:', updateError);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('💥 خطأ في تحديث الجلسة:', error);
      setSessionValid(false);
      return false;
    }
  }, []);

  // دالة إجبار تحديث الجلسة
  const forceSessionRefresh = useCallback(async (): Promise<void> => {
    console.log('🔃 إجبار تحديث الجلسة...');
    const success = await refreshSession();
    
    if (!success && session) {
      console.warn('⚠️ فشل تحديث الجلسة - قد تحتاج لتسجيل الدخول مجدداً');
      // يمكن إضافة منطق إضافي هنا مثل إعادة التوجيه لصفحة تسجيل الدخول
    }
  }, [refreshSession, session]);

  // مراقبة انتهاء صلاحية الجلسة
  useEffect(() => {
    if (!session) {
      setSessionValid(false);
      setSessionTimeRemaining(0);
      return;
    }

    const checkSessionValidity = () => {
      const now = Date.now() / 1000;
      const expiresAt = session.expires_at || 0;
      const timeRemaining = Math.max(0, expiresAt - now);
      
      setSessionTimeRemaining(timeRemaining);
      setSessionValid(timeRemaining > 0);
      
      // إذا كانت الجلسة ستنتهي خلال 5 دقائق، حاول تحديثها تلقائياً
      if (timeRemaining > 0 && timeRemaining < 300 && timeRemaining > 60) {
        console.log('🕐 الجلسة ستنتهي قريباً، محاولة التحديث التلقائي...');
        refreshSession();
      }
      
      // إذا انتهت الجلسة
      if (timeRemaining <= 0) {
        console.log('⏰ انتهت صلاحية الجلسة');
        setSessionValid(false);
      }
    };

    // فحص أولي
    checkSessionValidity();
    
    // فحص دوري كل دقيقة
    const interval = setInterval(checkSessionValidity, 60000);
    
    return () => clearInterval(interval);
  }, [session, refreshSession]);

  // تحديث حالة SaaS admin عند تغيير المستخدم
  useEffect(() => {
    const saasAdminStatus = checkSaasAdmin();
    setIsSaasAdmin(saasAdminStatus);
  }, [checkSaasAdmin]);

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isSaasAdmin,
    sessionValid,
    sessionTimeRemaining,
    signIn,
    signUp,
    signOut,
    hasRole,
    checkSaasAdmin,
    refreshSession,
    forceSessionRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};