import { supabase } from '@/integrations/supabase/client';
import { eventBusService, BusinessEventTypes } from '@/services/EventBus/EventBusService';

// أنواع المصادقة المتعددة
export enum MFATypes {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  PUSH = 'push',
  BIOMETRIC = 'biometric'
}

// حالة المصادقة
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  MFA_REQUIRED = 'mfa_required',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired'
}

// واجهة المستخدم المتقدمة
export interface AdvancedUser {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  tenant_id: string;
  role: string;
  permissions: string[];
  mfa_enabled: boolean;
  mfa_methods: MFATypes[];
  last_login: Date;
  login_count: number;
  password_changed_at: Date;
  account_locked: boolean;
  failed_attempts: number;
  suspension_reason?: string;
  preferences: UserPreferences;
  security_settings: SecuritySettings;
}

// تفضيلات المستخدم
export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard_layout: string;
  date_format: string;
  currency: string;
}

// إعدادات الأمان
export interface SecuritySettings {
  password_expires_days: number;
  session_timeout_minutes: number;
  concurrent_sessions_limit: number;
  require_mfa: boolean;
  allowed_ip_ranges: string[];
  device_trust_days: number;
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
}

// معلومات الجلسة
export interface SessionInfo {
  id: string;
  user_id: string;
  tenant_id: string;
  token: string;
  refresh_token: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  is_active: boolean;
  is_trusted_device: boolean;
  mfa_verified: boolean;
}

// سجل الأنشطة الأمنية
export interface SecurityLog {
  id: string;
  user_id: string;
  tenant_id: string;
  event_type: string;
  event_description: string;
  ip_address: string;
  user_agent: string;
  location?: object;
  risk_score: number;
  timestamp: Date;
  additional_data?: object;
}

// طلب المصادقة المتعددة
export interface MFARequest {
  user_id: string;
  method: MFATypes;
  code: string;
  device_token?: string;
  expires_at: Date;
  attempts: number;
  verified: boolean;
}

// نتيجة المصادقة
export interface AuthResult {
  success: boolean;
  user?: AdvancedUser;
  session?: SessionInfo;
  mfa_required?: boolean;
  mfa_methods?: MFATypes[];
  token?: string;
  refresh_token?: string;
  error?: string;
  risk_score?: number;
}

// إعدادات كلمة المرور
export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  prevent_reuse_count: number;
  lockout_attempts: number;
  lockout_duration_minutes: number;
}

// معلومات الأمان للجهاز
export interface DeviceInfo {
  id: string;
  user_id: string;
  fingerprint: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  first_seen: Date;
  last_seen: Date;
  is_trusted: boolean;
  location_history: object[];
  risk_score: number;
}

class AdvancedAuthService {
  private currentUser: AdvancedUser | null = null;
  private currentSession: SessionInfo | null = null;
  private passwordPolicy: PasswordPolicy;

  constructor() {
    this.passwordPolicy = {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      max_age_days: 90,
      prevent_reuse_count: 5,
      lockout_attempts: 5,
      lockout_duration_minutes: 30
    };

    this.initializeSession();
  }

  private async initializeSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.loadUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  // تسجيل الدخول المتقدم
  async login(email: string, password: string, deviceInfo?: Partial<DeviceInfo>): Promise<AuthResult> {
    try {
      // تسجيل محاولة الدخول
      await this.logSecurityEvent('login_attempt', { email }, 'medium');

      // التحقق من قفل الحساب
      const lockStatus = await this.checkAccountLock(email);
      if (lockStatus.locked) {
        return {
          success: false,
          error: `Account locked. Try again in ${lockStatus.remainingMinutes} minutes.`
        };
      }

      // المصادقة الأساسية
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        await this.recordFailedLogin(email);
        return {
          success: false,
          error: authError.message
        };
      }

      // تحميل ملف المستخدم
      const user = await this.loadUserProfile(authData.user.id);
      if (!user) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // تقييم المخاطر
      const riskScore = await this.calculateRiskScore(user.id, deviceInfo);

      // إنشاء الجلسة
      const session = await this.createSession(user, authData, deviceInfo, riskScore);

      // فحص متطلبات MFA
      const mfaRequired = await this.checkMFARequirements(user, riskScore);
      if (mfaRequired.required) {
        return {
          success: false,
          mfa_required: true,
          mfa_methods: mfaRequired.methods,
          user,
          session
        };
      }

      // تسجيل الدخول الناجح
      await this.recordSuccessfulLogin(user.id);
      await this.logSecurityEvent('login_success', { user_id: user.id }, 'low');

      // نشر حدث تسجيل الدخول
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SECURITY_LOGIN_FAILED,
        source: 'auth-service',
        data: {
          user_id: user.id,
          email: user.email,
          ip_address: session.ip_address,
          risk_score: riskScore,
          action: 'login_success'
        }
      });

      return {
        success: true,
        user,
        session,
        token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        risk_score: riskScore
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed due to system error'
      };
    }
  }

  // تسجيل الخروج
  async logout(sessionId?: string): Promise<boolean> {
    try {
      const targetSession = sessionId ? 
        await this.getSession(sessionId) : 
        this.currentSession;

      if (targetSession) {
        await this.invalidateSession(targetSession.id);
        await this.logSecurityEvent('logout', { session_id: targetSession.id }, 'low');
      }

      await supabase.auth.signOut();
      this.currentUser = null;
      this.currentSession = null;

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // تسجيل الخروج من جميع الجلسات
  async logoutAllSessions(userId: string): Promise<boolean> {
    try {
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (sessions) {
        for (const session of sessions) {
          await this.invalidateSession(session.id);
        }
      }

      await this.logSecurityEvent('logout_all_sessions', { user_id: userId }, 'medium');
      return true;
    } catch (error) {
      console.error('Logout all sessions error:', error);
      return false;
    }
  }

  // إعداد المصادقة المتعددة
  async enableMFA(userId: string, method: MFATypes, verificationCode?: string): Promise<boolean> {
    try {
      const user = await this.loadUserProfile(userId);
      if (!user) return false;

      let verificationRequired = false;
      
      switch (method) {
        case MFATypes.SMS:
          if (!user.phone) {
            throw new Error('Phone number required for SMS MFA');
          }
          if (!verificationCode) {
            await this.sendSMSVerification(user.phone);
            verificationRequired = true;
          } else {
            const isValid = await this.verifySMSCode(user.phone, verificationCode);
            if (!isValid) return false;
          }
          break;

        case MFATypes.EMAIL:
          if (!verificationCode) {
            await this.sendEmailVerification(user.email);
            verificationRequired = true;
          } else {
            const isValid = await this.verifyEmailCode(user.email, verificationCode);
            if (!isValid) return false;
          }
          break;

        case MFATypes.TOTP:
          if (!verificationCode) {
            const secret = await this.generateTOTPSecret(userId);
            return { secret, qr_code: this.generateQRCode(secret) };
          } else {
            const isValid = await this.verifyTOTPCode(userId, verificationCode);
            if (!isValid) return false;
          }
          break;
      }

      if (verificationRequired) {
        return { verification_required: true };
      }

      // تفعيل MFA
      const updatedMethods = [...user.mfa_methods, method];
      await supabase
        .from('user_profiles')
        .update({
          mfa_enabled: true,
          mfa_methods: updatedMethods
        })
        .eq('user_id', userId);

      await this.logSecurityEvent('mfa_enabled', { method, user_id: userId }, 'medium');
      return true;

    } catch (error) {
      console.error('Enable MFA error:', error);
      return false;
    }
  }

  // إلغاء المصادقة المتعددة
  async disableMFA(userId: string, method: MFATypes, verificationCode: string): Promise<boolean> {
    try {
      const user = await this.loadUserProfile(userId);
      if (!user) return false;

      // التحقق من رمز التحقق
      const isValid = await this.verifyMFACode(userId, method, verificationCode);
      if (!isValid) return false;

      // إزالة الطريقة
      const updatedMethods = user.mfa_methods.filter(m => m !== method);
      const mfaEnabled = updatedMethods.length > 0;

      await supabase
        .from('user_profiles')
        .update({
          mfa_enabled: mfaEnabled,
          mfa_methods: updatedMethods
        })
        .eq('user_id', userId);

      await this.logSecurityEvent('mfa_disabled', { method, user_id: userId }, 'medium');
      return true;

    } catch (error) {
      console.error('Disable MFA error:', error);
      return false;
    }
  }

  // التحقق من رمز MFA
  async verifyMFA(userId: string, method: MFATypes, code: string): Promise<boolean> {
    try {
      const isValid = await this.verifyMFACode(userId, method, code);
      
      if (isValid) {
        // تحديث الجلسة لتكون مُحققة
        if (this.currentSession) {
          await supabase
            .from('user_sessions')
            .update({ mfa_verified: true })
            .eq('id', this.currentSession.id);
        }

        await this.logSecurityEvent('mfa_verification_success', { method, user_id: userId }, 'low');
      } else {
        await this.logSecurityEvent('mfa_verification_failed', { method, user_id: userId }, 'medium');
      }

      return isValid;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  // تغيير كلمة المرور
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // التحقق من كلمة المرور الحالية
      const user = await this.loadUserProfile(userId);
      if (!user) return false;

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        await this.logSecurityEvent('password_change_failed', { user_id: userId, reason: 'invalid_current_password' }, 'medium');
        return false;
      }

      // التحقق من سياسة كلمة المرور
      const policyCheck = await this.validatePasswordPolicy(newPassword, userId);
      if (!policyCheck.valid) {
        throw new Error(policyCheck.error);
      }

      // تحديث كلمة المرور
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // تسجيل تاريخ التغيير
      await supabase
        .from('user_profiles')
        .update({
          password_changed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // إضافة إلى سجل كلمات المرور (مُشفرة)
      await this.addPasswordHistory(userId, newPassword);

      await this.logSecurityEvent('password_changed', { user_id: userId }, 'medium');

      // نشر حدث تغيير كلمة المرور
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SECURITY_PASSWORD_CHANGED,
        source: 'auth-service',
        data: {
          user_id: userId,
          action: 'password_changed'
        }
      });

      return true;

    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }

  // إدارة الجلسات
  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      return sessions?.map(session => ({
        id: session.id,
        user_id: session.user_id,
        tenant_id: session.tenant_id,
        token: session.token,
        refresh_token: session.refresh_token,
        device_fingerprint: session.device_fingerprint,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        location: session.location,
        created_at: new Date(session.created_at),
        last_activity: new Date(session.last_activity),
        expires_at: new Date(session.expires_at),
        is_active: session.is_active,
        is_trusted_device: session.is_trusted_device,
        mfa_verified: session.mfa_verified
      })) || [];
    } catch (error) {
      console.error('Get active sessions error:', error);
      return [];
    }
  }

  // إدارة الأجهزة الموثوقة
  async trustDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      await supabase
        .from('trusted_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          trusted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() // 30 days
        });

      await this.logSecurityEvent('device_trusted', { user_id: userId, device_fingerprint: deviceFingerprint }, 'low');
      return true;
    } catch (error) {
      console.error('Trust device error:', error);
      return false;
    }
  }

  async revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      await supabase
        .from('trusted_devices')
        .delete()
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint);

      await this.logSecurityEvent('device_trust_revoked', { user_id: userId, device_fingerprint: deviceFingerprint }, 'medium');
      return true;
    } catch (error) {
      console.error('Revoke device trust error:', error);
      return false;
    }
  }

  // تقييم المخاطر
  async calculateRiskScore(userId: string, deviceInfo?: Partial<DeviceInfo>): Promise<number> {
    try {
      let riskScore = 0;

      // عوامل الخطر المختلفة
      const factors = await Promise.all([
        this.checkUnknownDevice(userId, deviceInfo?.fingerprint),
        this.checkSuspiciousLocation(userId, deviceInfo?.location_history),
        this.checkLoginPattern(userId),
        this.checkAccountAge(userId),
        this.checkRecentSecurityEvents(userId)
      ]);

      // حساب النقاط
      riskScore += factors[0] ? 30 : 0; // جهاز غير معروف
      riskScore += factors[1] ? 25 : 0; // موقع مشكوك فيه
      riskScore += factors[2] ? 20 : 0; // نمط دخول غير عادي
      riskScore += factors[3] ? 15 : 0; // حساب جديد
      riskScore += factors[4] ? 35 : 0; // أحداث أمنية حديثة

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('Calculate risk score error:', error);
      return 50; // نقاط متوسطة في حالة الخطأ
    }
  }

  // سجل الأحداث الأمنية
  async getSecurityLog(userId: string, limit: number = 50): Promise<SecurityLog[]> {
    try {
      const { data: logs } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      return logs?.map(log => ({
        id: log.id,
        user_id: log.user_id,
        tenant_id: log.tenant_id,
        event_type: log.event_type,
        event_description: log.event_description,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        location: log.location,
        risk_score: log.risk_score,
        timestamp: new Date(log.timestamp),
        additional_data: log.additional_data
      })) || [];
    } catch (error) {
      console.error('Get security log error:', error);
      return [];
    }
  }

  // إعادة تعيين كلمة المرور
  async resetPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }

      await this.logSecurityEvent('password_reset_requested', { email }, 'medium');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }

  // دوال مساعدة خاصة

  private async loadUserProfile(userId: string): Promise<AdvancedUser | null> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, roles(name), permissions(permission)')
        .eq('user_id', userId)
        .single();

      if (!profile) return null;

      return {
        id: userId,
        email: profile.email,
        phone: profile.phone,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        tenant_id: profile.tenant_id,
        role: profile.roles?.name || 'user',
        permissions: profile.permissions?.map(p => p.permission) || [],
        mfa_enabled: profile.mfa_enabled || false,
        mfa_methods: profile.mfa_methods || [],
        last_login: profile.last_login ? new Date(profile.last_login) : new Date(),
        login_count: profile.login_count || 0,
        password_changed_at: profile.password_changed_at ? new Date(profile.password_changed_at) : new Date(),
        account_locked: profile.account_locked || false,
        failed_attempts: profile.failed_attempts || 0,
        suspension_reason: profile.suspension_reason,
        preferences: profile.preferences || this.getDefaultPreferences(),
        security_settings: profile.security_settings || this.getDefaultSecuritySettings()
      };
    } catch (error) {
      console.error('Load user profile error:', error);
      return null;
    }
  }

  private async createSession(
    user: AdvancedUser, 
    authData: any, 
    deviceInfo?: Partial<DeviceInfo>,
    riskScore: number = 0
  ): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (user.security_settings.session_timeout_minutes * 60 * 1000));

    const session: SessionInfo = {
      id: sessionId,
      user_id: user.id,
      tenant_id: user.tenant_id,
      token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      device_fingerprint: deviceInfo?.fingerprint || 'unknown',
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      location: await this.getLocationInfo(),
      created_at: new Date(),
      last_activity: new Date(),
      expires_at: expiresAt,
      is_active: true,
      is_trusted_device: await this.isDeviceTrusted(user.id, deviceInfo?.fingerprint),
      mfa_verified: !user.mfa_enabled // إذا لم يكن MFA مفعل، فهو محقق بالفعل
    };

    await supabase
      .from('user_sessions')
      .insert({
        id: session.id,
        user_id: session.user_id,
        tenant_id: session.tenant_id,
        token: session.token,
        refresh_token: session.refresh_token,
        device_fingerprint: session.device_fingerprint,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        location: session.location,
        created_at: session.created_at.toISOString(),
        last_activity: session.last_activity.toISOString(),
        expires_at: session.expires_at.toISOString(),
        is_active: session.is_active,
        is_trusted_device: session.is_trusted_device,
        mfa_verified: session.mfa_verified
      });

    this.currentSession = session;
    return session;
  }

  private async checkAccountLock(email: string): Promise<{ locked: boolean; remainingMinutes: number }> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_locked, locked_until, failed_attempts')
      .eq('email', email)
      .single();

    if (!profile?.account_locked) {
      return { locked: false, remainingMinutes: 0 };
    }

    const lockedUntil = new Date(profile.locked_until);
    const now = new Date();
    
    if (now > lockedUntil) {
      // إلغاء القفل
      await supabase
        .from('user_profiles')
        .update({
          account_locked: false,
          locked_until: null,
          failed_attempts: 0
        })
        .eq('email', email);

      return { locked: false, remainingMinutes: 0 };
    }

    const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60));
    return { locked: true, remainingMinutes };
  }

  private async recordFailedLogin(email: string): Promise<void> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('failed_attempts')
      .eq('email', email)
      .single();

    const failedAttempts = (profile?.failed_attempts || 0) + 1;
    const shouldLock = failedAttempts >= this.passwordPolicy.lockout_attempts;

    const updates: any = { failed_attempts: failedAttempts };
    
    if (shouldLock) {
      updates.account_locked = true;
      updates.locked_until = new Date(Date.now() + (this.passwordPolicy.lockout_duration_minutes * 60 * 1000));
    }

    await supabase
      .from('user_profiles')
      .update(updates)
      .eq('email', email);
  }

  private async recordSuccessfulLogin(userId: string): Promise<void> {
    await supabase
      .from('user_profiles')
      .update({
        last_login: new Date().toISOString(),
        login_count: supabase.rpc('increment_login_count', { user_id: userId }),
        failed_attempts: 0,
        account_locked: false,
        locked_until: null
      })
      .eq('user_id', userId);
  }

  private async checkMFARequirements(user: AdvancedUser, riskScore: number): Promise<{ required: boolean; methods: MFATypes[] }> {
    const requireMFA = user.mfa_enabled || 
                      user.security_settings.require_mfa || 
                      riskScore > 50;

    return {
      required: requireMFA,
      methods: user.mfa_methods.length > 0 ? user.mfa_methods : [MFATypes.EMAIL]
    };
  }

  private async logSecurityEvent(
    eventType: string, 
    data: any, 
    riskLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    const riskScores = { low: 10, medium: 50, high: 80 };
    
    await supabase
      .from('security_logs')
      .insert({
        user_id: data.user_id || null,
        tenant_id: this.currentUser?.tenant_id || null,
        event_type: eventType,
        event_description: JSON.stringify(data),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        location: await this.getLocationInfo(),
        risk_score: riskScores[riskLevel],
        timestamp: new Date().toISOString(),
        additional_data: data
      });
  }

  private async getClientIP(): Promise<string> {
    // في التطبيق الفعلي، سيتم الحصول على IP من الخادم
    return '192.168.1.1';
  }

  private async getLocationInfo(): Promise<object> {
    // في التطبيق الفعلي، سيتم الحصول على الموقع من API الموقع الجغرافي
    return {
      country: 'Kuwait',
      region: 'Kuwait',
      city: 'Kuwait City'
    };
  }

  private async isDeviceTrusted(userId: string, deviceFingerprint?: string): Promise<boolean> {
    if (!deviceFingerprint) return false;

    const { data: trustedDevice } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .gt('expires_at', new Date().toISOString())
      .single();

    return !!trustedDevice;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'ar',
      timezone: 'Asia/Kuwait',
      theme: 'light',
      notifications: {
        email: true,
        sms: true,
        push: true,
        desktop: true
      },
      dashboard_layout: 'default',
      date_format: 'DD/MM/YYYY',
      currency: 'KWD'
    };
  }

  private getDefaultSecuritySettings(): SecuritySettings {
    return {
      password_expires_days: 90,
      session_timeout_minutes: 480, // 8 hours
      concurrent_sessions_limit: 3,
      require_mfa: false,
      allowed_ip_ranges: [],
      device_trust_days: 30,
      login_notifications: true,
      suspicious_activity_alerts: true
    };
  }

  private async validatePasswordPolicy(password: string, userId: string): Promise<{ valid: boolean; error?: string }> {
    // طول كلمة المرور
    if (password.length < this.passwordPolicy.min_length) {
      return { valid: false, error: `Password must be at least ${this.passwordPolicy.min_length} characters` };
    }

    // الأحرف الكبيرة
    if (this.passwordPolicy.require_uppercase && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain uppercase letters' };
    }

    // الأحرف الصغيرة
    if (this.passwordPolicy.require_lowercase && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain lowercase letters' };
    }

    // الأرقام
    if (this.passwordPolicy.require_numbers && !/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain numbers' };
    }

    // الرموز
    if (this.passwordPolicy.require_symbols && !/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain symbols' };
    }

    // فحص إعادة الاستخدام
    const isReused = await this.checkPasswordReuse(userId, password);
    if (isReused) {
      return { valid: false, error: 'Password has been used recently' };
    }

    return { valid: true };
  }

  private async checkPasswordReuse(userId: string, password: string): Promise<boolean> {
    // في التطبيق الفعلي، سيتم مقارنة hash كلمة المرور
    const { data: history } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(this.passwordPolicy.prevent_reuse_count);

    // محاكاة فحص التكرار
    return false; // لا يمكن التحقق من التكرار بدون hashing
  }

  private async addPasswordHistory(userId: string, password: string): Promise<void> {
    // في التطبيق الفعلي، سيتم حفظ hash كلمة المرور
    await supabase
      .from('password_history')
      .insert({
        user_id: userId,
        password_hash: 'hashed_password', // سيتم استخدام bcrypt أو مشابه
        created_at: new Date().toISOString()
      });
  }

  private async sendSMSVerification(phone: string): Promise<void> {
    // إرسال رمز التحقق عبر SMS
    console.log(`Sending SMS verification to ${phone}`);
  }

  private async sendEmailVerification(email: string): Promise<void> {
    // إرسال رمز التحقق عبر البريد الإلكتروني
    console.log(`Sending email verification to ${email}`);
  }

  private async generateTOTPSecret(userId: string): Promise<string> {
    // إنشاء سر TOTP
    return 'TOTP_SECRET_KEY';
  }

  private generateQRCode(secret: string): string {
    // إنشاء رمز QR لـ TOTP
    return `data:image/png;base64,QR_CODE_DATA`;
  }

  private async verifyMFACode(userId: string, method: MFATypes, code: string): Promise<boolean> {
    // التحقق من رمز MFA
    return code === '123456'; // محاكاة
  }

  private async verifySMSCode(phone: string, code: string): Promise<boolean> {
    return code === '123456'; // محاكاة
  }

  private async verifyEmailCode(email: string, code: string): Promise<boolean> {
    return code === '123456'; // محاكاة
  }

  private async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    return code === '123456'; // محاكاة
  }

  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return session ? {
      id: session.id,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      token: session.token,
      refresh_token: session.refresh_token,
      device_fingerprint: session.device_fingerprint,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      location: session.location,
      created_at: new Date(session.created_at),
      last_activity: new Date(session.last_activity),
      expires_at: new Date(session.expires_at),
      is_active: session.is_active,
      is_trusted_device: session.is_trusted_device,
      mfa_verified: session.mfa_verified
    } : null;
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
  }

  private async checkUnknownDevice(userId: string, deviceFingerprint?: string): Promise<boolean> {
    if (!deviceFingerprint) return true;
    return !(await this.isDeviceTrusted(userId, deviceFingerprint));
  }

  private async checkSuspiciousLocation(userId: string, locationHistory?: any[]): Promise<boolean> {
    // في التطبيق الفعلي، سيتم مقارنة الموقع مع التاريخ
    return false;
  }

  private async checkLoginPattern(userId: string): Promise<boolean> {
    // فحص نمط تسجيل الدخول غير العادي
    return false;
  }

  private async checkAccountAge(userId: string): Promise<boolean> {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('user_id', userId)
      .single();

    if (!profile) return true;

    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    return daysSinceCreation < 30; // حساب جديد إذا كان أقل من 30 يوم
  }

  private async checkRecentSecurityEvents(userId: string): Promise<boolean> {
    const { data: events } = await supabase
      .from('security_logs')
      .select('risk_score')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // آخر 24 ساعة
      .gt('risk_score', 50);

    return (events?.length || 0) > 0;
  }

  // الحصول على المستخدم الحالي
  getCurrentUser(): AdvancedUser | null {
    return this.currentUser;
  }

  // الحصول على الجلسة الحالية
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  // فحص الصلاحيات
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions.includes(permission) || false;
  }

  // فحص الدور
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }
}

// إنشاء مثيل مشترك
export const advancedAuthService = new AdvancedAuthService(); 