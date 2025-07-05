// System verification utilities to test the invoice and payment system
import { serviceContainer } from '@/services/Container/ServiceContainer';

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