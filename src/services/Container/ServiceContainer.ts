// Repository implementations
import { ContractRepository } from '@/repositories/implementations/ContractRepository';
import { InvoiceRepository } from '@/repositories/implementations/InvoiceRepository';
import { PaymentRepository } from '@/repositories/implementations/PaymentRepository';
import { QuotationRepository } from '@/repositories/implementations/QuotationRepository';
import { AdditionalChargeRepository } from '@/repositories/implementations/AdditionalChargeRepository';
import { AttendanceRepository } from '@/repositories/implementations/AttendanceRepository';
import { EmployeeRepository } from '@/repositories/implementations/EmployeeRepository';
import { ViolationRepository } from '@/repositories/implementations/ViolationRepository';
import { ViolationTypeRepository } from '@/repositories/implementations/ViolationTypeRepository';
import { ViolationPaymentRepository } from '@/repositories/implementations/ViolationPaymentRepository';
import { WorkLocationRepository } from '@/repositories/implementations/WorkLocationRepository';

// Business services
import { ContractBusinessService } from '@/services/BusinessServices/ContractBusinessService';
import { InvoiceBusinessService } from '@/services/BusinessServices/InvoiceBusinessService';
import { PaymentBusinessService } from '@/services/BusinessServices/PaymentBusinessService';
import { QuotationBusinessService } from '@/services/BusinessServices/QuotationBusinessService';
import { AdditionalChargeBusinessService } from '@/services/BusinessServices/AdditionalChargeBusinessService';
import { AttendanceBusinessService } from '@/services/BusinessServices/AttendanceBusinessService';
import { EmployeeBusinessService } from '@/services/BusinessServices/EmployeeBusinessService';
import { ViolationBusinessService } from '@/services/BusinessServices/ViolationBusinessService';
import { ViolationTypeBusinessService } from '@/services/BusinessServices/ViolationTypeBusinessService';
import { ViolationPaymentBusinessService } from '@/services/BusinessServices/ViolationPaymentBusinessService';
import { WorkLocationBusinessService } from '@/services/BusinessServices/WorkLocationBusinessService';

// Repository interfaces
import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { IInvoiceRepository } from '@/repositories/interfaces/IInvoiceRepository';
import { IPaymentRepository } from '@/repositories/interfaces/IPaymentRepository';
import { IQuotationRepository } from '@/repositories/interfaces/IQuotationRepository';
import { IAdditionalChargeRepository } from '@/repositories/interfaces/IAdditionalChargeRepository';
import { IAttendanceRepository } from '@/repositories/interfaces/IAttendanceRepository';
import { IEmployeeRepository } from '@/repositories/interfaces/IEmployeeRepository';
import { IViolationRepository } from '@/repositories/interfaces/IViolationRepository';
import { IViolationTypeRepository } from '@/repositories/interfaces/IViolationTypeRepository';
import { IViolationPaymentRepository } from '@/repositories/interfaces/IViolationPaymentRepository';
import { IWorkLocationRepository } from '@/repositories/interfaces/IWorkLocationRepository';

export class ServiceContainer {
  private static instance: ServiceContainer;
  
  // Repository instances
  private contractRepository: IContractRepository;
  private invoiceRepository: IInvoiceRepository;
  private paymentRepository: IPaymentRepository;
  private quotationRepository: IQuotationRepository;
  private additionalChargeRepository: IAdditionalChargeRepository;
  private attendanceRepository: IAttendanceRepository;
  private employeeRepository: IEmployeeRepository;
  private violationRepository: IViolationRepository;
  private violationTypeRepository: IViolationTypeRepository;
  private violationPaymentRepository: IViolationPaymentRepository;
  private workLocationRepository: IWorkLocationRepository;
  
  // Business service instances
  private contractBusinessService: ContractBusinessService;
  private invoiceBusinessService: InvoiceBusinessService;
  private paymentBusinessService: PaymentBusinessService;
  private quotationBusinessService: QuotationBusinessService;
  private additionalChargeBusinessService: AdditionalChargeBusinessService;
  private attendanceBusinessService: AttendanceBusinessService;
  private employeeBusinessService: EmployeeBusinessService;
  private violationBusinessService: ViolationBusinessService;
  private violationTypeBusinessService: ViolationTypeBusinessService;
  private violationPaymentBusinessService: ViolationPaymentBusinessService;
  private workLocationBusinessService: WorkLocationBusinessService;

  private constructor() {
    // Initialize repositories
    this.contractRepository = new ContractRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.paymentRepository = new PaymentRepository();
    this.quotationRepository = new QuotationRepository();
    this.additionalChargeRepository = new AdditionalChargeRepository();
    this.attendanceRepository = new AttendanceRepository();
    this.employeeRepository = new EmployeeRepository();
    this.violationRepository = new ViolationRepository();
    this.violationTypeRepository = new ViolationTypeRepository();
    this.violationPaymentRepository = new ViolationPaymentRepository();
    this.workLocationRepository = new WorkLocationRepository();
    
    // Initialize business services with dependencies
    this.contractBusinessService = new ContractBusinessService(this.contractRepository);
    this.invoiceBusinessService = new InvoiceBusinessService(this.invoiceRepository);
    this.paymentBusinessService = new PaymentBusinessService(this.paymentRepository, this.invoiceRepository);
    this.quotationBusinessService = new QuotationBusinessService(this.quotationRepository);
    this.additionalChargeBusinessService = new AdditionalChargeBusinessService(this.additionalChargeRepository);
    this.attendanceBusinessService = new AttendanceBusinessService(this.attendanceRepository);
    this.employeeBusinessService = new EmployeeBusinessService(this.employeeRepository);
    this.violationBusinessService = new ViolationBusinessService(this.violationRepository);
    this.violationTypeBusinessService = new ViolationTypeBusinessService(this.violationTypeRepository);
    this.violationPaymentBusinessService = new ViolationPaymentBusinessService(this.violationPaymentRepository);
    this.workLocationBusinessService = new WorkLocationBusinessService(this.workLocationRepository);
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

  getAdditionalChargeRepository(): IAdditionalChargeRepository {
    return this.additionalChargeRepository;
  }

  getAttendanceRepository(): IAttendanceRepository {
    return this.attendanceRepository;
  }

  getEmployeeRepository(): IEmployeeRepository {
    return this.employeeRepository;
  }

  getViolationRepository(): IViolationRepository {
    return this.violationRepository;
  }

  getViolationTypeRepository(): IViolationTypeRepository {
    return this.violationTypeRepository;
  }

  getViolationPaymentRepository(): IViolationPaymentRepository {
    return this.violationPaymentRepository;
  }

  getWorkLocationRepository(): IWorkLocationRepository {
    return this.workLocationRepository;
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

  getAdditionalChargeBusinessService(): AdditionalChargeBusinessService {
    return this.additionalChargeBusinessService;
  }

  getAttendanceBusinessService(): AttendanceBusinessService {
    return this.attendanceBusinessService;
  }

  getEmployeeBusinessService(): EmployeeBusinessService {
    return this.employeeBusinessService;
  }

  getViolationBusinessService(): ViolationBusinessService {
    return this.violationBusinessService;
  }

  getViolationTypeBusinessService(): ViolationTypeBusinessService {
    return this.violationTypeBusinessService;
  }

  getViolationPaymentBusinessService(): ViolationPaymentBusinessService {
    return this.violationPaymentBusinessService;
  }

  getWorkLocationBusinessService(): WorkLocationBusinessService {
    return this.workLocationBusinessService;
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();