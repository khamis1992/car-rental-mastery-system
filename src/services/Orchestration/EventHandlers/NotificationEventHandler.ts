import { EventHandler, OrchestrationEvent } from '../types';
import { EventTypes } from '../EventTypes';

export class NotificationEventHandler {
  private notificationQueue: Array<{
    type: 'notification' | 'alert' | 'reminder';
    title: string;
    message: string;
    priority: 'urgent' | 'high' | 'medium' | 'normal';
    category: string;
    targetUsers?: string[];
    metadata?: Record<string, any>;
  }> = [];

  getHandlers(): Record<string, EventHandler> {
    return {
      [EventTypes.CONTRACT_ACTIVATED]: this.handleContractActivated.bind(this),
      [EventTypes.CONTRACT_COMPLETED]: this.handleContractCompleted.bind(this),
      [EventTypes.CONTRACT_CANCELLED]: this.handleContractCancelled.bind(this),
      [EventTypes.INVOICE_OVERDUE]: this.handleInvoiceOverdue.bind(this),
      [EventTypes.INVOICE_PAYMENT_PROCESSED]: this.handlePaymentProcessed.bind(this),
      [EventTypes.VEHICLE_MAINTENANCE_SCHEDULED]: this.handleMaintenanceScheduled.bind(this),
      [EventTypes.EMPLOYEE_LATE_ARRIVAL]: this.handleLateArrival.bind(this),
      [EventTypes.SYSTEM_ERROR]: this.handleSystemError.bind(this),
      [EventTypes.CUSTOMER_BLACKLISTED]: this.handleCustomerBlacklisted.bind(this),
    };
  }

  private async handleContractActivated(event: OrchestrationEvent): Promise<void> {
    const { contractId, customerId } = event.payload;
    
    this.addNotification({
      type: 'notification',
      title: 'تم تفعيل عقد جديد',
      message: `تم تفعيل العقد رقم ${contractId} بنجاح`,
      priority: 'medium',
      category: 'contracts',
      metadata: { contractId, customerId }
    });
  }

  private async handleContractCompleted(event: OrchestrationEvent): Promise<void> {
    const { contractId, invoiceId } = event.payload;
    
    this.addNotification({
      type: 'notification',
      title: 'تم إكمال عقد',
      message: `تم إكمال العقد رقم ${contractId} وإنشاء الفاتورة النهائية`,
      priority: 'medium',
      category: 'contracts',
      metadata: { contractId, invoiceId }
    });
  }

  private async handleContractCancelled(event: OrchestrationEvent): Promise<void> {
    const { contractId, reason } = event.payload;
    
    this.addNotification({
      type: 'alert',
      title: 'تم إلغاء عقد',
      message: `تم إلغاء العقد رقم ${contractId}. السبب: ${reason || 'غير محدد'}`,
      priority: 'high',
      category: 'contracts',
      metadata: { contractId, reason }
    });
  }

  private async handleInvoiceOverdue(event: OrchestrationEvent): Promise<void> {
    const { invoiceId, customerId, amount } = event.payload;
    
    this.addNotification({
      type: 'alert',
      title: 'فاتورة متأخرة السداد',
      message: `الفاتورة رقم ${invoiceId} متأخرة السداد بمبلغ ${amount} د.ك`,
      priority: 'urgent',
      category: 'invoicing',
      metadata: { invoiceId, customerId, amount }
    });
  }

  private async handlePaymentProcessed(event: OrchestrationEvent): Promise<void> {
    const { invoiceId, paymentId, amount } = event.payload;
    
    this.addNotification({
      type: 'notification',
      title: 'تم استلام دفعة',
      message: `تم استلام دفعة بمبلغ ${amount} د.ك للفاتورة رقم ${invoiceId}`,
      priority: 'medium',
      category: 'invoicing',
      metadata: { invoiceId, paymentId, amount }
    });
  }

  private async handleMaintenanceScheduled(event: OrchestrationEvent): Promise<void> {
    const { vehicleId, maintenanceType, scheduledDate } = event.payload;
    
    this.addNotification({
      type: 'reminder',
      title: 'صيانة مجدولة',
      message: `تم جدولة صيانة ${maintenanceType} للمركبة ${vehicleId} في ${scheduledDate}`,
      priority: 'medium',
      category: 'fleet',
      metadata: { vehicleId, maintenanceType, scheduledDate }
    });
  }

  private async handleLateArrival(event: OrchestrationEvent): Promise<void> {
    const { employeeId, employeeName, date } = event.payload;
    
    this.addNotification({
      type: 'alert',
      title: 'تأخير في الحضور',
      message: `الموظف ${employeeName} متأخر في الحضور اليوم ${date}`,
      priority: 'medium',
      category: 'hr',
      targetUsers: ['managers'], // Only notify managers
      metadata: { employeeId, date }
    });
  }

  private async handleSystemError(event: OrchestrationEvent): Promise<void> {
    const { errorType, errorMessage, systemComponent } = event.payload;
    
    this.addNotification({
      type: 'alert',
      title: 'خطأ في النظام',
      message: `خطأ في ${systemComponent}: ${errorMessage}`,
      priority: 'urgent',
      category: 'system',
      targetUsers: ['admins'], // Only notify admins
      metadata: { errorType, systemComponent }
    });
  }

  private async handleCustomerBlacklisted(event: OrchestrationEvent): Promise<void> {
    const { customerId, customerName } = event.payload;
    
    this.addNotification({
      type: 'alert',
      title: 'عميل مدرج في القائمة السوداء',
      message: `تم إدراج العميل ${customerName} في القائمة السوداء`,
      priority: 'high',
      category: 'customers',
      metadata: { customerId }
    });
  }

  private addNotification(notification: {
    type: 'notification' | 'alert' | 'reminder';
    title: string;
    message: string;
    priority: 'urgent' | 'high' | 'medium' | 'normal';
    category: string;
    targetUsers?: string[];
    metadata?: Record<string, any>;
  }): void {
    this.notificationQueue.push(notification);
    
    // Trigger notification processing
    this.processNotificationQueue();
  }

  private async processNotificationQueue(): Promise<void> {
    // In a real implementation, this would integrate with the NotificationContext
    // For now, we'll just log the notifications
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        console.log('📢 New notification:', notification);
        
        // Here you would integrate with the actual notification system
        // For example: await notificationService.create(notification);
      }
    }
  }

  // Method to get pending notifications for integration with UI
  getPendingNotifications() {
    return [...this.notificationQueue];
  }

  // Method to clear processed notifications
  clearProcessedNotifications(): void {
    this.notificationQueue = [];
  }
}