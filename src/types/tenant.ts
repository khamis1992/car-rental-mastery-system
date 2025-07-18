export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country: string;
  timezone: string;
  currency: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  subscription_plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  max_users: number;
  max_vehicles: number;
  max_contracts: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'receptionist' | 'user';
  status: 'active' | 'inactive' | 'pending';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
  };
}

export interface SubscriptionHistory {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  amount?: number;
  currency: string;
  billing_period?: 'monthly' | 'yearly';
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface TenantSettings {
  branding?: {
    primary_color?: string;
    logo_url?: string;
    company_name?: string;
  };
  features?: {
    accounting_enabled?: boolean;
    hr_enabled?: boolean;
    violations_enabled?: boolean;
  };
  notifications?: {
    email_enabled?: boolean;
    sms_enabled?: boolean;
  };
  integrations?: {
    [key: string]: any;
  };
}

export interface TenantInvitation {
  email: string;
  role: TenantUser['role'];
  tenant_id: string;
}

export interface TenantOnboardingData {
  name: string;
  slug: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country: string;
  timezone: string;
  currency: string;
  subscription_plan: Tenant['subscription_plan'];
  admin_user: {
    email: string;
    password: string;
    full_name: string;
  };
}