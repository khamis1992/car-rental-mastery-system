// ملف مساعد للتوافق مع قاعدة البيانات حتى يتم تطبيق migrations

export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    // محاولة البحث في information_schema
    const { data } = await supabase
      .rpc('execute_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            AND column_name = '${columnName}'
          ) as column_exists;
        `
      });
    
    return data?.[0]?.column_exists || false;
  } catch (error) {
    console.warn(`Could not check column ${columnName} in table ${tableName}:`, error);
    return false;
  }
};

export const safeInsertCustomer = async (customerData: any) => {
  const hasLifecycleStage = await checkColumnExists('customers', 'lifecycle_stage');
  const hasCustomerCode = await checkColumnExists('customers', 'customer_code');
  const hasSegments = await checkColumnExists('customers', 'segments');
  const hasTags = await checkColumnExists('customers', 'tags');
  
  const insertData: any = {
    name: customerData.full_name || customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    tenant_id: customerData.tenant_id
  };

  // إضافة الحقول فقط إذا كانت موجودة في قاعدة البيانات
  if (hasCustomerCode) {
    insertData.customer_code = customerData.customer_code;
  }
  
  if (hasLifecycleStage) {
    insertData.lifecycle_stage = customerData.lifecycle_stage || 'prospect';
  }
  
  if (hasSegments) {
    insertData.segments = customerData.segments || [];
  }
  
  if (hasTags) {
    insertData.tags = customerData.tags || [];
  }

  // إضافة الحقول الأخرى بأمان
  if (customerData.customer_type) {
    insertData.customer_type = customerData.customer_type;
  }
  
  if (customerData.secondary_phone) {
    insertData.secondary_phone = customerData.secondary_phone;
  }
  
  if (customerData.address) {
    insertData.address = JSON.stringify(customerData.address);
  }
  
  if (customerData.identification) {
    insertData.identification = JSON.stringify(customerData.identification);
  }
  
  if (customerData.financial_info) {
    insertData.financial_info = JSON.stringify(customerData.financial_info);
  }
  
  if (customerData.preferences) {
    insertData.preferences = JSON.stringify(customerData.preferences);
  }
  
  if (customerData.source) {
    insertData.source = customerData.source;
  }
  
  if (customerData.assigned_to) {
    insertData.assigned_to = customerData.assigned_to;
  }

  return insertData;
};

export const safeSelectCustomer = (hasNewFields: boolean = false) => {
  const baseFields = [
    'id',
    'name',
    'email', 
    'phone',
    'tenant_id',
    'created_at',
    'updated_at'
  ];

  if (hasNewFields) {
    return [
      ...baseFields,
      'customer_code',
      'lifecycle_stage',
      'segments',
      'tags',
      'customer_type',
      'secondary_phone',
      'address',
      'identification', 
      'financial_info',
      'preferences',
      'source',
      'assigned_to'
    ].join(', ');
  }

  return baseFields.join(', ');
};

import { supabase } from '../integrations/supabase/client'; 