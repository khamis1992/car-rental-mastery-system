// Repository implementations
import { ContractRepository } from '@/repositories/implementations/ContractRepository';
import { InvoiceRepository } from '@/repositories/implementations/InvoiceRepository';
import { PaymentRepository } from '@/repositories/implementations/PaymentRepository';
import { QuotationRepository } from '@/repositories/implementations/QuotationRepository';

// Business services
import { ContractBusinessService } from '@/services/BusinessServices/ContractBusinessService';
import { InvoiceBusinessService } from '@/services/BusinessServices/InvoiceBusinessService';
import { PaymentBusinessService } from '@/services/BusinessServices/PaymentBusinessService';
import { QuotationBusinessService } from '@/services/BusinessServices/QuotationBusinessService';

// Repository interfaces
import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { IInvoiceRepository } from '@/repositories/interfaces/IInvoiceRepository';
import { IPaymentRepository } from '@/repositories/interfaces/IPaymentRepository';
import { IQuotationRepository } from '@/repositories/interfaces/IQuotationRepository';

export class ServiceContainer {
  private static instance: ServiceContainer;
  
  // Repository instances
  private contractRepository: IContractRepository;
  private invoiceRepository: IInvoiceRepository;
  private paymentRepository: IPaymentRepository;
  private quotationRepository: IQuotationRepository;
  
  // Business service instances
  private contractBusinessService: ContractBusinessService;
  private invoiceBusinessService: InvoiceBusinessService;
  private paymentBusinessService: PaymentBusinessService;
  private quotationBusinessService: QuotationBusinessService;

  private constructor() {
    // Initialize repositories
    this.contractRepository = new ContractRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.paymentRepository = new PaymentRepository();
    this.quotationRepository = new QuotationRepository();
    
    // Initialize business services with dependencies
    this.contractBusinessService = new ContractBusinessService(this.contractRepository);
    this.invoiceBusinessService = new InvoiceBusinessService(this.invoiceRepository);
    this.paymentBusinessService = new PaymentBusinessService(this.paymentRepository, this.invoiceRepository);
    this.quotationBusinessService = new QuotationBusinessService(this.quotationRepository);
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Repository getters
  getContractRepository(): IContractRepository {
    return this.contractRepository;
  }

  getInvoiceRepository(): IInvoiceRepository {
    return this.invoiceRepository;
  }

  getPaymentRepository(): IPaymentRepository {
    return this.paymentRepository;
  }

  getQuotationRepository(): IQuotationRepository {
    return this.quotationRepository;
  }

  // Business service getters
  getContractBusinessService(): ContractBusinessService {
    return this.contractBusinessService;
  }

  getInvoiceBusinessService(): InvoiceBusinessService {
    return this.invoiceBusinessService;
  }

  getPaymentBusinessService(): PaymentBusinessService {
    return this.paymentBusinessService;
  }

  getQuotationBusinessService(): QuotationBusinessService {
    return this.quotationBusinessService;
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();