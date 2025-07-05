// System verification utilities to test the invoice and payment system
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { supabase } from '@/integrations/supabase/client';

export const verifyInvoiceSystemIntegrity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Starting invoice system verification...');
    
    // Test services availability
    const invoiceService = serviceContainer.getInvoiceBusinessService();
    const paymentService = serviceContainer.getPaymentBusinessService();
    
    if (!invoiceService || !paymentService) {
      console.error('❌ Services not properly initialized');
      return false;
    }
    
    // Test basic functionality without creating actual records
    try {
      await invoiceService.getInvoiceStats();
      await paymentService.getPaymentStats();
      console.log('✅ Basic service functionality verified');
    } catch (error) {
      console.error('❌ Service functionality test failed:', error);
      return false;
    }
    
    console.log('✅ Invoice system verification completed successfully');
    return true;
  } catch (error) {
    console.error('❌ System verification failed:', error);
    return false;
  }
};

export const checkSystemHealth = async (): Promise<{
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Check if services are properly initialized
    const invoiceService = serviceContainer.getInvoiceBusinessService();
    const paymentService = serviceContainer.getPaymentBusinessService();
    
    if (!invoiceService) {
      issues.push('Invoice service not initialized');
      recommendations.push('Check ServiceContainer configuration');
    }
    
    if (!paymentService) {
      issues.push('Payment service not initialized');
      recommendations.push('Check ServiceContainer configuration');
    }
    
    // Check database connectivity (basic test)
    try {
      await invoiceService.getInvoiceStats();
    } catch (error) {
      issues.push('Database connectivity issue');
      recommendations.push('Check database connection and RLS policies');
    }
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'error' : 'warning';
    }
    
    return { status, issues, recommendations };
  } catch (error) {
    return {
      status: 'error',
      issues: ['System health check failed'],
      recommendations: ['Check system configuration and logs']
    };
  }
};

/**
 * Reprocess existing invoices without accounting entries
 */
export const reprocessMissingInvoiceEntries = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  details: any[];
}> => {
  try {
    console.log('🔄 Starting reprocessing of missing invoice accounting entries...');
    
    const { data, error } = await supabase.rpc('reprocess_missing_invoice_entries');
    
    if (error) {
      console.error('❌ Failed to reprocess invoice entries:', error);
      return {
        success: false,
        processed: 0,
        errors: 1,
        details: [{ error: error.message }]
      };
    }
    
    const result = data as any;
    console.log('✅ Invoice reprocessing completed:', result);
    return {
      success: true,
      processed: result?.processed_count || 0,
      errors: result?.error_count || 0,
      details: result?.results || []
    };
  } catch (error: any) {
    console.error('❌ Error during invoice reprocessing:', error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      details: [{ error: error.message }]
    };
  }
};

/**
 * Reprocess existing payments without accounting entries
 */
export const reprocessMissingPaymentEntries = async (): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  details: any[];
}> => {
  try {
    console.log('🔄 Starting reprocessing of missing payment accounting entries...');
    
    const { data, error } = await supabase.rpc('reprocess_missing_payment_entries');
    
    if (error) {
      console.error('❌ Failed to reprocess payment entries:', error);
      return {
        success: false,
        processed: 0,
        errors: 1,
        details: [{ error: error.message }]
      };
    }
    
    const result = data as any;
    console.log('✅ Payment reprocessing completed:', result);
    return {
      success: true,
      processed: result?.processed_count || 0,
      errors: result?.error_count || 0,
      details: result?.results || []
    };
  } catch (error: any) {
    console.error('❌ Error during payment reprocessing:', error);
    return {
      success: false,
      processed: 0,
      errors: 1,
      details: [{ error: error.message }]
    };
  }
};

/**
 * Validate accounting system integrity
 */
export const validateAccountingIntegrity = async (): Promise<{
  isValid: boolean;
  issues: {
    paymentsWithoutEntries: number;
    invoicesWithoutEntries: number;
    unbalancedEntries: number;
    missingAccounts: number;
  };
  recommendations: string[];
}> => {
  try {
    console.log('🔍 Validating accounting system integrity...');
    
    const { data, error } = await supabase.rpc('validate_accounting_integrity');
    
    if (error) {
      console.error('❌ Failed to validate accounting integrity:', error);
      return {
        isValid: false,
        issues: {
          paymentsWithoutEntries: 0,
          invoicesWithoutEntries: 0,
          unbalancedEntries: 0,
          missingAccounts: 1
        },
        recommendations: ['Check database connection and functions']
      };
    }
    
    const result = data as any;
    const recommendations: string[] = [];
    
    if (result?.payments_without_entries > 0) {
      recommendations.push(`${result.payments_without_entries} دفعة بدون قيود محاسبية - استخدم إعادة المعالجة`);
    }
    
    if (result?.invoices_without_entries > 0) {
      recommendations.push(`${result.invoices_without_entries} فاتورة بدون قيود محاسبية - استخدم إعادة المعالجة`);  
    }
    
    if (result?.unbalanced_entries > 0) {
      recommendations.push(`${result.unbalanced_entries} قيد غير متوازن - تحتاج إلى مراجعة`);
    }
    
    if (result?.missing_required_accounts > 0) {
      recommendations.push('حسابات مطلوبة مفقودة في دليل الحسابات');
    }
    
    console.log('✅ Accounting integrity validation completed');
    
    return {
      isValid: result?.overall_status === 'healthy',
      issues: {
        paymentsWithoutEntries: result?.payments_without_entries || 0,
        invoicesWithoutEntries: result?.invoices_without_entries || 0,
        unbalancedEntries: result?.unbalanced_entries || 0,
        missingAccounts: result?.missing_required_accounts || 0
      },
      recommendations
    };
  } catch (error: any) {
    console.error('❌ Error validating accounting integrity:', error);
    return {
      isValid: false,
      issues: {
        paymentsWithoutEntries: 0,
        invoicesWithoutEntries: 0,
        unbalancedEntries: 0,
        missingAccounts: 0
      },
      recommendations: ['System error - check logs']
    };
  }
};