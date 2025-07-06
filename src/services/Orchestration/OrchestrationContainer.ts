import { EnhancedEventBus } from './EnhancedEventBus';
import { ContractOrchestrationService } from './ContractOrchestrationService';
import { InvoiceOrchestrationService } from './InvoiceOrchestrationService';
import { NotificationEventHandler } from './EventHandlers/NotificationEventHandler';
import { AnalyticsEventHandler } from './EventHandlers/AnalyticsEventHandler';
import { AccountingEventHandler } from './EventHandlers/AccountingEventHandler';
import { RealTimeAccountingNotificationSystem } from './RealTimeAccountingNotificationSystem';
import { serviceContainer } from '../Container/ServiceContainer';

export class OrchestrationContainer {
  private static instance: OrchestrationContainer;
  private eventBus: EnhancedEventBus;
  private contractOrchestration: ContractOrchestrationService;
  private invoiceOrchestration: InvoiceOrchestrationService;
  private notificationHandler: NotificationEventHandler;
  private analyticsHandler: AnalyticsEventHandler;
  private accountingHandler: AccountingEventHandler;
  private realTimeNotificationSystem: RealTimeAccountingNotificationSystem;

  private constructor() {
    this.eventBus = new EnhancedEventBus();
    this.notificationHandler = new NotificationEventHandler();
    this.analyticsHandler = new AnalyticsEventHandler();
    this.accountingHandler = new AccountingEventHandler();
    this.realTimeNotificationSystem = new RealTimeAccountingNotificationSystem();
    
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
    this.initializeRealTimeSystem();
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

    // Register accounting handlers
    const accountingHandlers = this.accountingHandler.getHandlers();
    Object.entries(accountingHandlers).forEach(([eventType, handler]) => {
      this.eventBus.on(eventType, handler);
    });

    // Set up cross-service event handlers
    this.eventBus.on('CONTRACT_COMPLETED', async (event) => {
      console.log('Contract completed, processing final operations:', event.payload);
      
      // Trigger accounting event
      await this.eventBus.emit({
        type: 'CONTRACT_ACCOUNTING',
        payload: event.payload,
        timestamp: new Date(),
        source: 'ContractOrchestration'
      });
    });

    this.eventBus.on('INVOICE_PAYMENT_PROCESSED', async (event) => {
      console.log('Payment processed, updating related records:', event.payload);
      
      // Trigger payment accounting event
      await this.eventBus.emit({
        type: 'PAYMENT_ACCOUNTING',
        payload: event.payload,
        timestamp: new Date(),
        source: 'InvoiceOrchestration'
      });
    });

    // Real-time accounting integration
    this.eventBus.on('*', async (event) => {
      if (event.type.includes('ACCOUNTING')) {
        await this.realTimeNotificationSystem.sendNotification({
          type: 'transaction_processed',
          data: {
            entityType: event.payload?.entityType || 'unknown',
            entityId: event.payload?.entityId || 'unknown',
            description: `تمت معالجة ${event.type}`,
            timestamp: event.timestamp
          }
        });
      }
    });
  }

  private async initializeRealTimeSystem() {
    try {
      await this.realTimeNotificationSystem.initialize();
      console.log('✅ Real-Time Accounting Notification System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Accounting System:', error);
    }
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

  getAccountingHandler(): AccountingEventHandler {
    return this.accountingHandler;
  }

  getRealTimeNotificationSystem(): RealTimeAccountingNotificationSystem {
    return this.realTimeNotificationSystem;
  }

  async shutdown(): Promise<void> {
    await this.realTimeNotificationSystem.shutdown();
    console.log('🔄 Orchestration Container shut down');
  }
}

export const orchestrationContainer = OrchestrationContainer.getInstance();