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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
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
    await supabase.auth.signOut();
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};