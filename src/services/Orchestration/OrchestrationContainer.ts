import { EnhancedEventBus } from './EnhancedEventBus';
import { ContractOrchestrationService } from './ContractOrchestrationService';
import { InvoiceOrchestrationService } from './InvoiceOrchestrationService';
import { NotificationEventHandler } from './EventHandlers/NotificationEventHandler';
import { AnalyticsEventHandler } from './EventHandlers/AnalyticsEventHandler';
import { serviceContainer } from '../Container/ServiceContainer';

export class OrchestrationContainer {
  private static instance: OrchestrationContainer;
  private eventBus: EnhancedEventBus;
  private contractOrchestration: ContractOrchestrationService;
  private invoiceOrchestration: InvoiceOrchestrationService;
  private notificationHandler: NotificationEventHandler;
  private analyticsHandler: AnalyticsEventHandler;

  private constructor() {
    this.eventBus = new EnhancedEventBus();
    this.notificationHandler = new NotificationEventHandler();
    this.analyticsHandler = new AnalyticsEventHandler();
    
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
    // Register notification handlers
    const notificationHandlers = this.notificationHandler.getHandlers();
    Object.entries(notificationHandlers).forEach(([eventType, handler]) => {
      this.eventBus.on(eventType, handler);
    });

    // Register analytics handlers
    const analyticsHandlers = this.analyticsHandler.getHandlers();
    Object.entries(analyticsHandlers).forEach(([eventType, handler]) => {
      this.eventBus.on(eventType, handler);
    });

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

  getEventBus(): EnhancedEventBus {
    return this.eventBus;
  }

  getNotificationHandler(): NotificationEventHandler {
    return this.notificationHandler;
  }

  getAnalyticsHandler(): AnalyticsEventHandler {
    return this.analyticsHandler;
  }
}

export const orchestrationContainer = OrchestrationContainer.getInstance();