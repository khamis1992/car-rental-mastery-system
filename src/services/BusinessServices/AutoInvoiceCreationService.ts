import { InvoiceBusinessService } from './InvoiceBusinessService';
import { PaymentBusinessService } from './PaymentBusinessService';
import { InvoiceFormData, PaymentFormData, Invoice, Payment } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';

interface AutoInvoiceAndPaymentData {
  contractId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  notes?: string;
}

interface AutoInvoiceAndPaymentResult {
  invoice: Invoice;
  payment: Payment;
}

export class AutoInvoiceCreationService {
  constructor(
    private invoiceService: InvoiceBusinessService,
    private paymentService: PaymentBusinessService
  ) {}

  /**
   * إنشاء فاتورة تلقائية من العقد وتسجيل دفعة عليها
   */
  async createInvoiceAndPayment(data: AutoInvoiceAndPaymentData): Promise<AutoInvoiceAndPaymentResult> {
    try {
      // التحقق من صحة البيانات
      if (!data.contractId || !data.paymentAmount || data.paymentAmount <= 0) {
        throw new Error('بيانات غير صالحة: معرف العقد ومبلغ الدفعة مطلوبان');
      }

      // 1. جلب بيانات العقد مع التحقق من وجوده
      const contract = await this.getContractDetails(data.contractId);
      
      if (!contract) {
        throw new Error('العقد غير موجود');
      }

      // 2. إنشاء الفاتورة تلقائياً
      const invoice = await this.createAutoInvoice(contract);
      
      if (!invoice || !invoice.id) {
        throw new Error('فشل في إنشاء الفاتورة');
      }

      // 3. تسجيل الدفعة على الفاتورة
      const payment = await this.createPaymentForInvoice(invoice, data);
      
      if (!payment || !payment.id) {
        throw new Error('فشل في تسجيل الدفعة');
      }

      return { invoice, payment };
    } catch (error) {
      console.error('Error in createInvoiceAndPayment:', error);
      
      // إعطاء رسائل خطأ واضحة
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new Error('الفاتورة موجودة بالفعل لهذا العقد');
      }
      
      if (error.message.includes('foreign key') || error.message.includes('does not exist')) {
        throw new Error('بيانات العقد أو العميل غير صحيحة');
      }
      
      throw new Error(`خطأ في إنشاء الفاتورة والدفعة: ${error.message}`);
    }
  }

  /**
   * جلب تفاصيل العقد
   */
  private async getContractDetails(contractId: string): Promise<any> {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        customers(id, name, phone, email),
        vehicles(make, model, license_plate, vehicle_number)
      `)
      .eq('id', contractId)
      .single();

    if (error) throw error;
    if (!contract) throw new Error('العقد غير موجود');

    return contract;
  }

  /**
   * إنشاء فاتورة تلقائية من العقد
   */
  private async createAutoInvoice(contract: any): Promise<Invoice> {
    const invoiceData: InvoiceFormData = {
      contract_id: contract.id,
      customer_id: contract.customer_id,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      invoice_type: 'rental',
      tax_amount: contract.tax_amount || 0,
      discount_amount: contract.discount_amount || 0,
      payment_terms: 'استحقاق خلال 30 يوم',
      notes: 'فاتورة تم إنشاؤها تلقائياً من العقد',
      terms_and_conditions: 'شروط وأحكام الإيجار وفقاً للعقد',
      items: [{
        description: this.generateInvoiceDescription(contract),
        item_type: 'rental',
        quantity: contract.rental_days,
        unit_price: contract.daily_rate,
        start_date: contract.start_date,
        end_date: contract.end_date,
        daily_rate: contract.daily_rate,
      }]
    };

    return await this.invoiceService.createInvoice(invoiceData);
  }

  /**
   * إنشاء وصف الفاتورة
   */
  private generateInvoiceDescription(contract: any): string {
    const vehicleInfo = contract.vehicles 
      ? `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.license_plate}`
      : 'مركبة';
    
    return `إيجار ${vehicleInfo} لمدة ${contract.rental_days} يوم`;
  }

  /**
   * تسجيل دفعة على الفاتورة
   */
  private async createPaymentForInvoice(
    invoice: Invoice, 
    paymentData: AutoInvoiceAndPaymentData
  ): Promise<Payment> {
    const paymentFormData: PaymentFormData = {
      invoice_id: invoice.id,
      amount: paymentData.paymentAmount,
      payment_date: paymentData.paymentDate,
      payment_method: paymentData.paymentMethod,
      transaction_reference: paymentData.transactionReference,
      bank_name: paymentData.bankName,
      check_number: paymentData.checkNumber,
      notes: paymentData.notes || 'دفعة مسجلة مع إنشاء الفاتورة التلقائية',
    };

    return await this.paymentService.createPayment(paymentFormData);
  }

  /**
   * التحقق من إمكانية إنشاء فاتورة للعقد
   */
  async canCreateInvoiceForContract(contractId: string): Promise<boolean> {
    try {
      const contract = await this.getContractDetails(contractId);
      
      // التحقق من حالة العقد
      if (contract.status !== 'completed' && contract.status !== 'active') {
        return false;
      }

      // التحقق من عدم وجود فاتورة إيجار مسبقاً
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('contract_id', contractId)
        .eq('invoice_type', 'rental');

      return !existingInvoices || existingInvoices.length === 0;
    } catch (error) {
      console.error('Error checking contract invoice eligibility:', error);
      return false;
    }
  }

  /**
   * التحقق من حالة الدفع وتحديث العقد إذا لزم الأمر
   */
  async checkAndUpdateContractStatus(contractId: string, paymentAmount: number): Promise<void> {
    try {
      // التحقق من إجمالي المبلغ المستحق في جميع الفواتير
      const { data: invoices } = await supabase
        .from('invoices')
        .select('outstanding_amount')
        .eq('contract_id', contractId);

      const totalOutstanding = invoices?.reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0;

      // إذا تم تحصيل جميع المدفوعات، قم بتحديث تاريخ تسجيل الدفع
      if (totalOutstanding === 0) {
        await supabase
          .from('contracts')
          .update({ 
            payment_registered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);
      }
    } catch (error) {
      console.error('Error updating contract payment status:', error);
      // لا نرمي الخطأ هنا لأن الفاتورة والدفعة تمت بنجاح
    }
  }
}