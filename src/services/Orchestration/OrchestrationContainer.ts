import { InMemoryEventBus } from './EventBus';
import { ContractOrchestrationService } from './ContractOrchestrationService';
import { InvoiceOrchestrationService } from './InvoiceOrchestrationService';
import { serviceContainer } from '../Container/ServiceContainer';

export class OrchestrationContainer {
  private static instance: OrchestrationContainer;
  private eventBus: InMemoryEventBus;
  private contractOrchestration: ContractOrchestrationService;
  private invoiceOrchestration: InvoiceOrchestrationService;

  private constructor() {
    this.eventBus = new InMemoryEventBus();
    
    this.contractOrchestration = new ContractOrchestrationService(
      this.eventBus,
      serviceContainer.getContractBusinessService(),
      serviceContainer.getVehicleBusinessService(),
      serviceContainer.getInvoiceBusinessService()
    );

    this.invoiceOrchestration = new InvoiceOrchestrationService(
      this.eventBus,
      serviceContainer.getInvoiceBusinessService(),
      serviceContainer.getPaymentBusinessService(),
      serviceContainer.getAdditionalChargeBusinessService()
    );

    this.setupEventHandlers();
  }

  static getInstance(): OrchestrationContainer {
    if (!OrchestrationContainer.instance) {
      OrchestrationContainer.instance = new OrchestrationContainer();
    }
    return OrchestrationContainer.instance;
  }

  private setupEventHandlers() {
    // Set up cross-service event handlers
    this.eventBus.on('CONTRACT_COMPLETED', async (event) => {
      console.log('Contract completed, processing final operations:', event.payload);
    });

    this.eventBus.on('INVOICE_PAYMENT_PROCESSED', async (event) => {
      console.log('Payment processed, updating related records:', event.payload);
    });
  }

  getContractOrchestration(): ContractOrchestrationService {
    return this.contractOrchestration;
  }

  getInvoiceOrchestration(): InvoiceOrchestrationService {
    return this.invoiceOrchestration;
  }

  getEventBus(): InMemoryEventBus {
    return this.eventBus;
  }
}

export const orchestrationContainer = OrchestrationContainer.getInstance();