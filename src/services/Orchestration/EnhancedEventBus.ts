import { EventBus, OrchestrationEvent, EventHandler } from './types';

export interface EventFilter {
  type?: string;
  source?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;
}

export interface EnhancedEvent extends OrchestrationEvent {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  metadata?: Record<string, any>;
  retryCount?: number;
  maxRetries?: number;
}

export interface EventSubscription {
  id: string;
  handler: EventHandler;
  filter?: EventFilter;
  isActive: boolean;
}

export class EnhancedEventBus implements EventBus {
  private handlers: Map<string, EventSubscription[]> = new Map();
  private eventHistory: EnhancedEvent[] = [];
  private maxHistorySize = 1000;
  private subscriptionCounter = 0;

  async emit(event: OrchestrationEvent): Promise<void> {
    const enhancedEvent: EnhancedEvent = {
      ...event,
      id: this.generateEventId(),
      priority: this.extractPriority(event),
      category: this.extractCategory(event),
      metadata: this.extractMetadata(event),
      retryCount: 0,
      maxRetries: 3
    };

    // Store in history
    this.addToHistory(enhancedEvent);

    // Get matching handlers
    const matchingHandlers = this.getMatchingHandlers(enhancedEvent);
    
    // Execute handlers with error handling and retry logic
    await Promise.all(
      matchingHandlers.map(subscription => 
        this.executeHandlerWithRetry(subscription.handler, enhancedEvent)
      )
    );
  }

  on(eventType: string, handler: EventHandler): string {
    return this.subscribe(eventType, handler);
  }

  subscribe(eventType: string, handler: EventHandler, filter?: EventFilter): string {
    const subscription: EventSubscription = {
      id: `sub_${++this.subscriptionCounter}`,
      handler,
      filter,
      isActive: true
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(subscription);
    return subscription.id;
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex(sub => sub.handler === handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.handlers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index > -1) {
        subscriptions.splice(index, 1);
        break;
      }
    }
  }

  getEventHistory(filter?: EventFilter, limit = 100): EnhancedEvent[] {
    let events = [...this.eventHistory];
    
    if (filter) {
      events = events.filter(event => this.matchesFilter(event, filter));
    }
    
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getSubscriptions(eventType?: string): EventSubscription[] {
    if (eventType) {
      return this.handlers.get(eventType) || [];
    }
    
    const allSubscriptions: EventSubscription[] = [];
    for (const subscriptions of this.handlers.values()) {
      allSubscriptions.push(...subscriptions);
    }
    return allSubscriptions;
  }

  private async executeHandlerWithRetry(handler: EventHandler, event: EnhancedEvent): Promise<void> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= (event.maxRetries || 3)) {
      try {
        await handler(event);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        console.warn(`Event handler failed (attempt ${attempt}/${(event.maxRetries || 3) + 1}) for ${event.type}:`, error);
        
        if (attempt <= (event.maxRetries || 3)) {
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // All retries failed
    console.error(`Event handler failed permanently for ${event.type}:`, lastError);
    
    // Emit failure event
    await this.emitFailureEvent(event, lastError);
  }

  private getMatchingHandlers(event: EnhancedEvent): EventSubscription[] {
    const directHandlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    
    const allHandlers = [...directHandlers, ...wildcardHandlers];
    
    return allHandlers.filter(subscription => 
      subscription.isActive && 
      (!subscription.filter || this.matchesFilter(event, subscription.filter))
    );
  }

  private matchesFilter(event: EnhancedEvent, filter: EventFilter): boolean {
    if (filter.type && event.type !== filter.type) return false;
    if (filter.source && event.source !== filter.source) return false;
    if (filter.priority && event.priority !== filter.priority) return false;
    if (filter.category && event.category !== filter.category) return false;
    return true;
  }

  private extractPriority(event: OrchestrationEvent): 'urgent' | 'high' | 'medium' | 'low' {
    // Extract priority from event type or payload
    if (event.type.includes('URGENT') || event.type.includes('CRITICAL')) return 'urgent';
    if (event.type.includes('FAILED') || event.type.includes('ERROR')) return 'high';
    if (event.type.includes('WARNING') || event.type.includes('ALERT')) return 'medium';
    return 'low';
  }

  private extractCategory(event: OrchestrationEvent): string {
    // Extract category from event type
    if (event.type.includes('CONTRACT')) return 'contracts';
    if (event.type.includes('INVOICE') || event.type.includes('PAYMENT')) return 'invoicing';
    if (event.type.includes('VEHICLE')) return 'fleet';
    if (event.type.includes('CUSTOMER')) return 'customers';
    if (event.type.includes('EMPLOYEE') || event.type.includes('ATTENDANCE')) return 'hr';
    if (event.type.includes('SYSTEM') || event.type.includes('SAGA')) return 'system';
    return 'general';
  }

  private extractMetadata(event: OrchestrationEvent): Record<string, any> {
    return {
      eventSize: JSON.stringify(event.payload).length,
      hasPayload: !!event.payload,
      payloadKeys: typeof event.payload === 'object' ? Object.keys(event.payload || {}) : []
    };
  }

  private addToHistory(event: EnhancedEvent): void {
    this.eventHistory.push(event);
    
    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private async emitFailureEvent(originalEvent: EnhancedEvent, error: Error | null): Promise<void> {
    try {
      await this.emit({
        type: 'EVENT_HANDLER_FAILED',
        payload: {
          originalEventId: originalEvent.id,
          originalEventType: originalEvent.type,
          error: error?.message,
          retryCount: originalEvent.retryCount
        },
        timestamp: new Date(),
        source: 'EnhancedEventBus'
      });
    } catch (e) {
      console.error('Failed to emit failure event:', e);
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}