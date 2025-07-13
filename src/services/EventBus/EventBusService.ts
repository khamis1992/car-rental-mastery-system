import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// أنواع الأحداث التجارية
export enum BusinessEventTypes {
  // أحداث العقود
  CONTRACT_CREATED = 'contract.created',
  CONTRACT_SIGNED = 'contract.signed',
  CONTRACT_STARTED = 'contract.started',
  CONTRACT_COMPLETED = 'contract.completed',
  CONTRACT_CANCELLED = 'contract.cancelled',
  CONTRACT_EXTENDED = 'contract.extended',
  
  // أحداث الفوترة والمدفوعات
  INVOICE_GENERATED = 'invoice.generated',
  INVOICE_SENT = 'invoice.sent',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_OVERDUE = 'payment.overdue',
  REFUND_PROCESSED = 'refund.processed',
  
  // أحداث الأسطول والمركبات
  VEHICLE_RENTED = 'vehicle.rented',
  VEHICLE_RETURNED = 'vehicle.returned',
  VEHICLE_MAINTENANCE_SCHEDULED = 'vehicle.maintenance_scheduled',
  VEHICLE_MAINTENANCE_REQUIRED = 'vehicle.maintenance_required',
  VEHICLE_MAINTENANCE_COMPLETED = 'vehicle.maintenance_completed',
  VEHICLE_ACCIDENT_REPORTED = 'vehicle.accident_reported',
  VEHICLE_FUEL_LOW = 'vehicle.fuel_low',
  VEHICLE_DAMAGED = 'vehicle.damaged',
  
  // أحداث المحاسبة
  JOURNAL_ENTRY_CREATED = 'accounting.journal_entry_created',
  FINANCIAL_PERIOD_OPENED = 'accounting.period_opened',
  FINANCIAL_PERIOD_CLOSED = 'accounting.period_closed',
  BUDGET_EXCEEDED = 'accounting.budget_exceeded',
  CASH_FLOW_WARNING = 'accounting.cash_flow_warning',
  REVENUE_RECOGNITION = 'accounting.revenue_recognition',
  COST_ALLOCATION = 'accounting.cost_allocation',
  
  // أحداث العملاء
  CUSTOMER_REGISTERED = 'customer.registered',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_CREDIT_CHANGED = 'customer.credit_changed',
  CUSTOMER_CHURN_RISK = 'customer.churn_risk',
  CUSTOMER_COMPLAINT = 'customer.complaint',
  CUSTOMER_FEEDBACK = 'customer.feedback',
  
  // أحداث الموارد البشرية
  EMPLOYEE_HIRED = 'hr.employee_hired',
  EMPLOYEE_TERMINATED = 'hr.employee_terminated',
  PAYROLL_PROCESSED = 'hr.payroll_processed',
  ATTENDANCE_MARKED = 'hr.attendance_marked',
  LEAVE_REQUESTED = 'hr.leave_requested',
  LEAVE_APPROVED = 'hr.leave_approved',
  PERFORMANCE_REVIEWED = 'hr.performance_reviewed',
  
  // أحداث النظام
  SYSTEM_BACKUP_COMPLETED = 'system.backup_completed',
  SYSTEM_MAINTENANCE_STARTED = 'system.maintenance_started',
  SYSTEM_ERROR_OCCURRED = 'system.error_occurred',
  SYSTEM_PERFORMANCE_ALERT = 'system.performance_alert',
  
  // أحداث الأمان
  SECURITY_LOGIN_FAILED = 'security.login_failed',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  SECURITY_PASSWORD_CHANGED = 'security.password_changed',
  SECURITY_PERMISSION_CHANGED = 'security.permission_changed'
}

// واجهة الحدث التجاري
export interface BusinessEvent {
  id?: string;
  type: BusinessEventTypes;
  source: string;
  sourceId?: string;
  aggregateId?: string;
  aggregateType?: string;
  data: Record<string, any>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
    causationId?: string;
    version?: number;
  };
  timestamp?: Date;
  tenant_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  retryCount?: number;
  maxRetries?: number;
  scheduled?: Date;
  processed?: boolean;
  error?: string;
}

// واجهة معالج الأحداث
export interface EventHandler {
  eventType: BusinessEventTypes | BusinessEventTypes[];
  handler: (event: BusinessEvent) => Promise<void>;
  filters?: (event: BusinessEvent) => boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    exponential: boolean;
  };
  timeout?: number;
  priority?: number;
}

// واجهة الاشتراك
export interface EventSubscription {
  id: string;
  eventTypes: BusinessEventTypes[];
  handler: EventHandler;
  isActive: boolean;
  createdAt: Date;
  lastProcessed?: Date;
  processedCount: number;
  errorCount: number;
}

// نتيجة نشر الحدث
export interface PublishResult {
  success: boolean;
  eventId: string;
  error?: string;
  subscribersNotified: number;
}

// إحصائيات Event Bus
export interface EventBusStats {
  totalEvents: number;
  eventsToday: number;
  pendingEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  subscribersCount: number;
  eventTypesCount: number;
}

class EventBusService {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private tenant_id: string | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTenant();
    this.startEventProcessor();
  }

  private async initializeTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        this.tenant_id = data?.tenant_id || null;
      }
    } catch (error) {
      console.error('Error initializing tenant:', error);
    }
  }

  // نشر حدث تجاري
  async publishEvent(event: BusinessEvent): Promise<PublishResult> {
    try {
      // تحديد معرف المستأجر
      if (!event.tenant_id && this.tenant_id) {
        event.tenant_id = this.tenant_id;
      }

      // إعداد البيانات الأساسية
      event.id = event.id || crypto.randomUUID();
      event.timestamp = event.timestamp || new Date();
      event.priority = event.priority || 'medium';
      event.retryCount = event.retryCount || 0;
      event.maxRetries = event.maxRetries || 3;
      event.processed = false;

      // التحقق من صحة الحدث
      await this.validateEvent(event);

      // حفظ الحدث في قاعدة البيانات
      const { error: saveError } = await supabase
        .from('business_events')
        .insert({
          id: event.id,
          event_type: event.type,
          source_service: event.source,
          source_id: event.sourceId,
          aggregate_id: event.aggregateId,
          aggregate_type: event.aggregateType,
          event_data: event.data,
          metadata: event.metadata,
          priority: event.priority,
          retry_count: event.retryCount,
          max_retries: event.maxRetries,
          scheduled_at: event.scheduled,
          processed: event.processed,
          tenant_id: event.tenant_id,
          created_at: event.timestamp
        });

      if (saveError) {
        throw new Error(`Failed to save event: ${saveError.message}`);
      }

      // معالجة فورية للأحداث عالية الأولوية
      if (event.priority === 'critical' || event.priority === 'high') {
        await this.processEventImmediately(event);
      }

      // إشعار المشتركين
      const subscribersNotified = await this.notifySubscribers(event);

      return {
        success: true,
        eventId: event.id,
        subscribersNotified
      };

    } catch (error) {
      console.error('Error publishing event:', error);
      return {
        success: false,
        eventId: event.id || '',
        error: error instanceof Error ? error.message : 'Unknown error',
        subscribersNotified: 0
      };
    }
  }

  // الاشتراك في الأحداث
  async subscribeToEvent(handler: EventHandler): Promise<string> {
    const subscriptionId = crypto.randomUUID();
    const eventTypes = Array.isArray(handler.eventType) ? handler.eventType : [handler.eventType];
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes,
      handler,
      isActive: true,
      createdAt: new Date(),
      processedCount: 0,
      errorCount: 0
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    console.log(`Subscribed to events: ${eventTypes.join(', ')} with ID: ${subscriptionId}`);
    return subscriptionId;
  }

  // إلغاء الاشتراك
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from events with ID: ${subscriptionId}`);
      return true;
    }
    return false;
  }

  // معالجة الأحداث المعلقة
  async processEvents(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const { data: pendingEvents, error } = await supabase
        .from('business_events')
        .select('*')
        .eq('tenant_id', this.tenant_id)
        .eq('processed', false)
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching pending events:', error);
        return;
      }

      for (const eventData of pendingEvents || []) {
        const event: BusinessEvent = {
          id: eventData.id,
          type: eventData.event_type as BusinessEventTypes,
          source: eventData.source_service,
          sourceId: eventData.source_id,
          aggregateId: eventData.aggregate_id,
          aggregateType: eventData.aggregate_type,
          data: eventData.event_data,
          metadata: eventData.metadata,
          timestamp: new Date(eventData.created_at),
          tenant_id: eventData.tenant_id,
          priority: eventData.priority,
          retryCount: eventData.retry_count,
          maxRetries: eventData.max_retries,
          scheduled: eventData.scheduled_at ? new Date(eventData.scheduled_at) : undefined,
          processed: eventData.processed,
          error: eventData.error
        };

        await this.processEventImmediately(event);
      }

    } catch (error) {
      console.error('Error processing events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // معالجة حدث فورية
  private async processEventImmediately(event: BusinessEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // البحث عن المشتركين المهتمين
      const interestedSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => 
          sub.isActive && 
          sub.eventTypes.includes(event.type) &&
          (!sub.handler.filters || sub.handler.filters(event))
        );

      // معالجة الحدث مع كل مشترك
      for (const subscription of interestedSubscriptions) {
        try {
          await this.executeHandler(subscription, event);
          subscription.processedCount++;
          subscription.lastProcessed = new Date();
        } catch (error) {
          subscription.errorCount++;
          console.error(`Error in event handler for subscription ${subscription.id}:`, error);
          
          // إعادة المحاولة إذا لم تتجاوز الحد الأقصى
          if (event.retryCount! < event.maxRetries!) {
            await this.scheduleRetry(event);
          } else {
            await this.markEventAsFailed(event, error);
          }
        }
      }

      // تحديث حالة الحدث كمعالج
      await this.markEventAsProcessed(event, Date.now() - startTime);

    } catch (error) {
      console.error('Error processing event immediately:', error);
      await this.markEventAsFailed(event, error);
    }
  }

  // تنفيذ معالج الحدث
  private async executeHandler(subscription: EventSubscription, event: BusinessEvent): Promise<void> {
    const timeout = subscription.handler.timeout || 30000; // 30 ثانية افتراضياً
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Handler timeout after ${timeout}ms`));
      }, timeout);

      subscription.handler.handler(event)
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // إشعار المشتركين
  private async notifySubscribers(event: BusinessEvent): Promise<number> {
    let notifiedCount = 0;
    
    // إشعار المشتركين المحليين
    const localSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => 
        sub.isActive && 
        sub.eventTypes.includes(event.type)
      );

    for (const subscription of localSubscriptions) {
      try {
        // إشعار فوري بدون انتظار
        setImmediate(() => {
          this.executeHandler(subscription, event).catch(error => {
            console.error(`Async handler error for ${subscription.id}:`, error);
          });
        });
        notifiedCount++;
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    }

    // إشعار المشتركين عبر WebSocket (للتحديثات الفورية)
    await this.notifyWebSocketClients(event);

    return notifiedCount;
  }

  // إشعار عملاء WebSocket
  private async notifyWebSocketClients(event: BusinessEvent): Promise<void> {
    try {
      // في التطبيق الفعلي، سيتم إرسال إشعارات WebSocket
      // للعملاء المتصلين المهتمين بهذا النوع من الأحداث
      console.log(`WebSocket notification for event: ${event.type}`);
    } catch (error) {
      console.error('Error sending WebSocket notification:', error);
    }
  }

  // جدولة إعادة المحاولة
  private async scheduleRetry(event: BusinessEvent): Promise<void> {
    const retryDelay = this.calculateRetryDelay(event.retryCount!);
    const scheduledAt = new Date(Date.now() + retryDelay);

    await supabase
      .from('business_events')
      .update({
        retry_count: event.retryCount! + 1,
        scheduled_at: scheduledAt.toISOString(),
        error: null
      })
      .eq('id', event.id);
  }

  // حساب تأخير إعادة المحاولة
  private calculateRetryDelay(retryCount: number): number {
    // تأخير تصاعدي: 1s, 4s, 16s, 64s
    return Math.pow(4, retryCount) * 1000;
  }

  // تحديد الحدث كمعالج
  private async markEventAsProcessed(event: BusinessEvent, processingTime: number): Promise<void> {
    await supabase
      .from('business_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        error: null
      })
      .eq('id', event.id);
  }

  // تحديد الحدث كفاشل
  private async markEventAsFailed(event: BusinessEvent, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await supabase
      .from('business_events')
      .update({
        processed: false,
        error: errorMessage,
        failed_at: new Date().toISOString()
      })
      .eq('id', event.id);
  }

  // التحقق من صحة الحدث
  private async validateEvent(event: BusinessEvent): Promise<void> {
    if (!event.type) {
      throw new Error('Event type is required');
    }

    if (!event.source) {
      throw new Error('Event source is required');
    }

    if (!event.data) {
      throw new Error('Event data is required');
    }

    // التحقق من نوع الحدث
    if (!Object.values(BusinessEventTypes).includes(event.type)) {
      throw new Error(`Invalid event type: ${event.type}`);
    }

    // التحقق من حجم البيانات
    const dataSize = JSON.stringify(event.data).length;
    if (dataSize > 64 * 1024) { // 64KB
      throw new Error('Event data too large (max 64KB)');
    }
  }

  // بدء معالج الأحداث
  private startEventProcessor(): void {
    // معالجة دورية كل 5 ثوان
    this.processingInterval = setInterval(() => {
      this.processEvents().catch(error => {
        console.error('Error in event processor:', error);
      });
    }, 5000);

    // معالجة فورية عند بدء التشغيل
    setTimeout(() => {
      this.processEvents().catch(error => {
        console.error('Error in initial event processing:', error);
      });
    }, 1000);
  }

  // إيقاف معالج الأحداث
  stopEventProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // الحصول على إحصائيات Event Bus
  async getStats(): Promise<EventBusStats> {
    const { data: totalEvents } = await supabase
      .from('business_events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', this.tenant_id);

    const { data: eventsToday } = await supabase
      .from('business_events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .gte('created_at', format(new Date(), 'yyyy-MM-dd'));

    const { data: pendingEvents } = await supabase
      .from('business_events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .eq('processed', false);

    const { data: failedEvents } = await supabase
      .from('business_events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .not('error', 'is', null);

    const { data: processingTimes } = await supabase
      .from('business_events')
      .select('processing_time_ms')
      .eq('tenant_id', this.tenant_id)
      .eq('processed', true)
      .not('processing_time_ms', 'is', null)
      .limit(100);

    const avgProcessingTime = processingTimes?.length ? 
      processingTimes.reduce((sum, item) => sum + (item.processing_time_ms || 0), 0) / processingTimes.length : 0;

    return {
      totalEvents: totalEvents?.length || 0,
      eventsToday: eventsToday?.length || 0,
      pendingEvents: pendingEvents?.length || 0,
      failedEvents: failedEvents?.length || 0,
      averageProcessingTime: Math.round(avgProcessingTime),
      subscribersCount: this.subscriptions.size,
      eventTypesCount: Object.keys(BusinessEventTypes).length
    };
  }

  // الحصول على أحداث حسب النوع
  async getEventsByType(eventType: BusinessEventTypes, limit: number = 50): Promise<BusinessEvent[]> {
    const { data: events, error } = await supabase
      .from('business_events')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching events by type:', error);
      return [];
    }

    return events?.map(eventData => ({
      id: eventData.id,
      type: eventData.event_type as BusinessEventTypes,
      source: eventData.source_service,
      sourceId: eventData.source_id,
      aggregateId: eventData.aggregate_id,
      aggregateType: eventData.aggregate_type,
      data: eventData.event_data,
      metadata: eventData.metadata,
      timestamp: new Date(eventData.created_at),
      tenant_id: eventData.tenant_id,
      priority: eventData.priority,
      retryCount: eventData.retry_count,
      maxRetries: eventData.max_retries,
      processed: eventData.processed,
      error: eventData.error
    })) || [];
  }

  // إعادة معالجة الأحداث الفاشلة
  async retryFailedEvents(): Promise<number> {
    const { data: failedEvents, error } = await supabase
      .from('business_events')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .eq('processed', false)
      .not('error', 'is', null)
      .lt('retry_count', supabase.rpc('max_retries'))
      .limit(10);

    if (error || !failedEvents) {
      console.error('Error fetching failed events:', error);
      return 0;
    }

    let retriedCount = 0;
    for (const eventData of failedEvents) {
      await supabase
        .from('business_events')
        .update({
          error: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', eventData.id);
      
      retriedCount++;
    }

    return retriedCount;
  }

  // تنظيف الأحداث القديمة
  async cleanupOldEvents(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data: deletedEvents, error } = await supabase
      .from('business_events')
      .delete()
      .eq('tenant_id', this.tenant_id)
      .eq('processed', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up old events:', error);
      return 0;
    }

    return deletedEvents?.length || 0;
  }

  // إنشاء حدث بسيط
  static createEvent(
    type: BusinessEventTypes,
    source: string,
    data: Record<string, any>,
    options?: {
      sourceId?: string;
      aggregateId?: string;
      aggregateType?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      scheduled?: Date;
      metadata?: BusinessEvent['metadata'];
    }
  ): BusinessEvent {
    return {
      type,
      source,
      data,
      sourceId: options?.sourceId,
      aggregateId: options?.aggregateId,
      aggregateType: options?.aggregateType,
      priority: options?.priority || 'medium',
      scheduled: options?.scheduled,
      metadata: options?.metadata
    };
  }
}

// إنشاء مثيل مشترك
export const eventBusService = new EventBusService();

// تصدير الأنواع والواجهات
export type {
  BusinessEvent,
  EventHandler,
  EventSubscription,
  PublishResult,
  EventBusStats
}; 