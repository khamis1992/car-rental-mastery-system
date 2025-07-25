import { useCallback } from 'react';
import { useUnifiedErrorHandling } from './useUnifiedErrorHandling';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CustomerData {
  customer_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  address?: string;
  city?: string;
  country?: string;
  company_contact_person?: string;
  company_registration_number?: string;
  tax_number?: string;
  notes?: string;
}

export const useCustomerOperations = () => {
  const { user } = useAuth();
  const { execute, handleError, isLoading } = useUnifiedErrorHandling({
    context: 'عمليات العملاء',
    showToast: true,
    loadingKey: 'customer-operations'
  });

  const validateCustomerData = useCallback((data: CustomerData): string[] => {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('اسم العميل مطلوب');
    }

    if (!data.phone?.trim()) {
      errors.push('رقم الهاتف مطلوب');
    } else {
      // التحقق من صحة رقم الهاتف الكويتي
      const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^(\+965|965)?[5-9][0-9]{7}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('رقم الهاتف غير صحيح. يجب أن يبدأ بـ 5، 6، 7، 8، أو 9 ويتكون من 8 أرقام');
      }
    }

    if (data.customer_type === 'company' && !data.company_contact_person?.trim()) {
      errors.push('اسم الشخص المسؤول مطلوب للشركات');
    }

    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('البريد الإلكتروني غير صحيح');
      }
    }

    return errors;
  }, []);

  const addCustomer = useCallback(async (customerData: CustomerData) => {
    return execute(async () => {
      // التحقق من المصادقة أولاً
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من صحة البيانات قبل الإرسال
      const validationErrors = validateCustomerData(customerData);
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في البيانات: ${validationErrors.join(', ')}`);
      }

      // تنظيف البيانات - إزالة المسافات الزائدة والقيم الفارغة
      const cleanedData = {
        customer_type: customerData.customer_type,
        name: customerData.name?.trim(),
        phone: customerData.phone?.trim(),
        ...(customerData.email?.trim() && { email: customerData.email.trim() }),
        ...(customerData.address?.trim() && { address: customerData.address.trim() }),
        ...(customerData.city?.trim() && { city: customerData.city.trim() }),
        ...(customerData.country?.trim() && { country: customerData.country.trim() }),
        ...(customerData.national_id?.trim() && { national_id: customerData.national_id.trim() }),
        ...(customerData.customer_type === 'company' && customerData.company_contact_person?.trim() && { 
          company_contact_person: customerData.company_contact_person.trim() 
        }),
        ...(customerData.customer_type === 'company' && customerData.company_registration_number?.trim() && { 
          company_registration_number: customerData.company_registration_number.trim() 
        }),
        ...(customerData.tax_number?.trim() && { tax_number: customerData.tax_number.trim() }),
        ...(customerData.notes?.trim() && { notes: customerData.notes.trim() }),
      };

      console.log('✅ إدراج العميل بالبيانات المنظفة:', cleanedData);

      // إدراج العميل الجديد - دع trigger يتولى tenant_id ورقم العميل
      const { data, error } = await supabase
        .from('customers')
        .insert([cleanedData as any])
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في إضافة العميل:', error);
        console.error('❌ تفاصيل الخطأ:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // معالجة أخطاء التكرار المحددة
        if (error.code === '23505') {
          if (error.details?.includes('phone') || error.message?.includes('phone')) {
            throw new Error('رقم الهاتف مستخدم مسبقاً من قبل عميل آخر');
          } else if (error.details?.includes('email') || error.message?.includes('email')) {
            throw new Error('البريد الإلكتروني مستخدم مسبقاً من قبل عميل آخر');
          } else if (error.details?.includes('customer_number') || error.message?.includes('customer_number')) {
            throw new Error('رقم العميل مكرر. يرجى المحاولة مرة أخرى');
          } else if (error.details?.includes('national_id') || error.message?.includes('national_id')) {
            throw new Error('الرقم المدني مستخدم مسبقاً من قبل عميل آخر');
          } else {
            throw new Error('البيانات المدخلة مستخدمة مسبقاً. يرجى التحقق من البيانات');
          }
        }
        
        // معالجة الأخطاء من التحقق المخصص (triggers)
        if (error.message?.includes('يجب تسجيل الدخول لإضافة عميل')) {
          throw new Error('يجب تسجيل الدخول لإضافة عميل');
        }
        
        if (error.message?.includes('لا يمكن تحديد المؤسسة الحالية')) {
          throw new Error('لا يمكن تحديد المؤسسة الحالية. تأكد من ربط المستخدم بمؤسسة صالحة.');
        }
        
        if (error.message?.includes('اسم العميل مطلوب')) {
          throw new Error('اسم العميل مطلوب');
        }
        
        if (error.message?.includes('نوع العميل مطلوب')) {
          throw new Error('نوع العميل مطلوب');
        }
        
        if (error.message?.includes('اسم الشركة مطلوب')) {
          throw new Error('اسم الشركة مطلوب للعملاء من نوع شركة');
        }

        if (error.message?.includes('رقم الهاتف غير صالح')) {
          throw new Error('رقم الهاتف غير صالح');
        }

        if (error.message?.includes('البريد الإلكتروني غير صالح')) {
          throw new Error('البريد الإلكتروني غير صالح');
        }
        
        if (error.message?.includes('RLS') || error.message?.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لإضافة عملاء. يرجى التواصل مع المدير');
        }
        
        if (error.message?.includes('JWT') || error.message?.includes('مصادقة')) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
        
        throw new Error(error.message || 'فشل في إضافة العميل');
      }

      console.log('✅ تم إضافة العميل بنجاح:', data);
      toast.success('تم إضافة العميل بنجاح');
      return data;
    });
  }, [execute, user, validateCustomerData]);

  const updateCustomer = useCallback(async (customerId: string, customerData: CustomerData) => {
    return execute(async () => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً');
        } else if (error.message?.includes('RLS') || error.message?.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لتحديث هذا العميل');
        } else {
          throw new Error(`فشل في تحديث العميل: ${error.message}`);
        }
      }

      toast.success('تم تحديث العميل بنجاح');
      return data;
    });
  }, [execute, user]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    return execute(async () => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        if (error.message?.includes('RLS') || error.message?.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لحذف هذا العميل');
        } else {
          throw new Error(`فشل في حذف العميل: ${error.message}`);
        }
      }

      toast.success('تم حذف العميل بنجاح');
      return true;
    });
  }, [execute, user]);

  const fetchCustomers = useCallback(async () => {
    return execute(async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('RLS') || error.message?.includes('row-level security')) {
          throw new Error('ليس لديك صلاحية لعرض العملاء. يرجى التواصل مع المدير');
        } else if (error.message?.includes('JWT') || error.message?.includes('مصادقة')) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        } else {
          throw new Error(`فشل في جلب بيانات العملاء: ${error.message}`);
        }
      }

      return data || [];
    });
  }, [execute]);

  const testCustomerAccess = useCallback(async () => {
    return execute(async () => {
      // اختبار قراءة العملاء
      const { data: readTest, error: readError } = await supabase
        .from('customers')
        .select('id, customer_number, name')
        .limit(1);

      if (readError) {
        throw new Error(`لا يمكن قراءة العملاء: ${readError.message}`);
      }

      // اختبار دالة توليد رقم العميل
      const { data: numberTest, error: numberError } = await supabase
        .rpc('generate_customer_number_simple');

      if (numberError) {
        console.warn('خطأ في دالة توليد رقم العميل:', numberError);
      }

      // اختبار الحصول على معرف المؤسسة
      const { data: tenantId, error: tenantError } = await supabase
        .rpc('get_current_tenant_id');

      if (tenantError) {
        console.warn('خطأ في الحصول على معرف المؤسسة:', tenantError);
      }

      // اختبار إدراج عميل تجريبي (دون حفظ فعلي)
      let insertTestResult = 'غير مختبر';
      try {
        // نجرب التحقق من البيانات فقط دون إدراج فعلي
        if (tenantId && user?.id) {
          insertTestResult = 'ممكن - البيانات المطلوبة متوفرة';
        } else {
          insertTestResult = 'غير ممكن - بيانات مفقودة';
        }
      } catch (error) {
        insertTestResult = `خطأ: ${error}`;
      }

      return {
        canRead: !readError,
        canGenerateNumber: !numberError,
        canGetTenantId: !tenantError,
        customerCount: readTest?.length || 0,
        generatedNumber: numberTest || 'غير متاح',
        tenantId: tenantId || 'غير متاح',
        insertTest: insertTestResult
      };
    });
  }, [execute, user]);

  return {
    addCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomers,
    validateCustomerData,
    testCustomerAccess,
    isLoading,
    handleError
  };
};