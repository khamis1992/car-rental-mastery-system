// نسخة متوافقة من CRM Service للعمل مع هيكل قاعدة البيانات الحالي
import { supabase } from '../../integrations/supabase/client';

export interface CompatibleCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  customer_number?: string;
  customer_type?: 'individual' | 'company';
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  status?: 'active' | 'inactive' | 'blocked';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: string;
  title: string;
  description?: string;
  date: string;
  performed_by?: string;
  tenant_id: string;
  created_at: string;
}

class CRMServiceCompatible {
  private tenant_id: string | null = null;

  constructor() {
    this.initializeTenant();
  }

  private async initializeTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        this.tenant_id = data?.tenant_id || null;
      }
    } catch (error) {
      console.error('خطأ في تهيئة المستأجر:', error);
    }
  }

  // إنشاء عميل جديد
  async createCustomer(customerData: Partial<CompatibleCustomer>): Promise<CompatibleCustomer> {
    try {
      // استخدام الحقول الموجودة فقط
      const insertData = {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        customer_type: customerData.customer_type || 'individual',
        address: customerData.address,
        city: customerData.city,
        country: customerData.country,
        notes: customerData.notes,
        status: customerData.status || 'active',
        tenant_id: this.tenant_id
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في إنشاء العميل: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: customer.id,
        activity_type: 'contact',
        title: 'تم إنشاء العميل',
        description: `تم إنشاء عميل جديد: ${customer.name}`,
        date: new Date().toISOString(),
        performed_by: 'النظام',
        tenant_id: this.tenant_id!
      });

      return customer;
    } catch (error) {
      console.error('خطأ في إنشاء العميل:', error);
      throw error;
    }
  }

  // الحصول على العملاء
  async getCustomers(filters?: any): Promise<CompatibleCustomer[]> {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', this.tenant_id);

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }

      const { data: customers, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (error) {
        throw new Error(`فشل في استرجاع العملاء: ${error.message}`);
      }

      return customers || [];
    } catch (error) {
      console.error('خطأ في استرجاع العملاء:', error);
      throw error;
    }
  }

  // الحصول على عميل واحد
  async getCustomer(customerId: string): Promise<CompatibleCustomer | null> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', this.tenant_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`فشل في استرجاع العميل: ${error.message}`);
      }

      return customer;
    } catch (error) {
      console.error('خطأ في استرجاع العميل:', error);
      throw error;
    }
  }

  // تحديث العميل
  async updateCustomer(customerId: string, updates: Partial<CompatibleCustomer>): Promise<CompatibleCustomer> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('tenant_id', this.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في تحديث العميل: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: customerId,
        activity_type: 'update',
        title: 'تم تحديث العميل',
        description: `تم تحديث معلومات العميل`,
        date: new Date().toISOString(),
        performed_by: 'المستخدم',
        tenant_id: this.tenant_id!
      });

      return customer;
    } catch (error) {
      console.error('خطأ في تحديث العميل:', error);
      throw error;
    }
  }

  // حذف العميل
  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('tenant_id', this.tenant_id);

      if (error) {
        throw new Error(`فشل في حذف العميل: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('خطأ في حذف العميل:', error);
      throw error;
    }
  }

  // تسجيل النشاط
  async logActivity(activity: Omit<CustomerActivity, 'id' | 'created_at'>): Promise<CustomerActivity> {
    try {
      // محاولة إدراج النشاط في جدول منفصل إذا كان موجوداً
      const { data: activityData, error } = await supabase
        .from('customer_activities')
        .insert({
          customer_id: activity.customer_id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          date: activity.date,
          performed_by: activity.performed_by,
          tenant_id: activity.tenant_id
        })
        .select()
        .single();

      if (error) {
        // إذا فشل، قم بتسجيله في الملاحظات أو جدول بديل
        console.warn('تعذر تسجيل النشاط في الجدول المخصص، سيتم تسجيله في الملاحظات');
        
        // إضافة الملاحظة إلى العميل
        await supabase
          .from('customers')
          .update({
            notes: `${activity.title}: ${activity.description}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', activity.customer_id)
          .eq('tenant_id', this.tenant_id);

        // إرجاع نشاط وهمي
        return {
          id: 'temp_' + Date.now(),
          customer_id: activity.customer_id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          date: activity.date,
          performed_by: activity.performed_by,
          tenant_id: activity.tenant_id,
          created_at: new Date().toISOString()
        };
      }

      return activityData;
    } catch (error) {
      console.error('خطأ في تسجيل النشاط:', error);
      throw error;
    }
  }

  // الحصول على أنشطة العميل
  async getCustomerActivities(customerId: string, limit: number = 20): Promise<CustomerActivity[]> {
    try {
      const { data: activities, error } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', this.tenant_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('تعذر استرجاع الأنشطة من الجدول المخصص');
        return [];
      }

      return activities || [];
    } catch (error) {
      console.error('خطأ في استرجاع أنشطة العميل:', error);
      return [];
    }
  }

  // إحصائيات العملاء
  async getCustomerStats(): Promise<any> {
    try {
      const { data: stats, error } = await supabase
        .from('customers')
        .select('status, customer_type, created_at')
        .eq('tenant_id', this.tenant_id);

      if (error) {
        throw new Error(`فشل في استرجاع إحصائيات العملاء: ${error.message}`);
      }

      const totalCustomers = stats?.length || 0;
      const activeCustomers = stats?.filter(c => c.status === 'active').length || 0;
      const inactiveCustomers = stats?.filter(c => c.status === 'inactive').length || 0;
      const individualCustomers = stats?.filter(c => c.customer_type === 'individual').length || 0;
      const companyCustomers = stats?.filter(c => c.customer_type === 'company').length || 0;

      // عملاء جدد هذا الشهر
      const thisMonth = new Date();
      const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const newThisMonth = stats?.filter(c => 
        new Date(c.created_at) >= firstDayOfMonth
      ).length || 0;

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        individualCustomers,
        companyCustomers,
        newThisMonth,
        activePercentage: totalCustomers > 0 ? (activeCustomers / totalCustomers * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('خطأ في استرجاع إحصائيات العملاء:', error);
      throw error;
    }
  }

  // البحث في العملاء
  async searchCustomers(searchTerm: string): Promise<CompatibleCustomer[]> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', this.tenant_id)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        throw new Error(`فشل في البحث عن العملاء: ${error.message}`);
      }

      return customers || [];
    } catch (error) {
      console.error('خطأ في البحث عن العملاء:', error);
      throw error;
    }
  }
}

export const crmServiceCompatible = new CRMServiceCompatible(); 