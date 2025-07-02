import { EventBus, OrchestrationEvent, EventHandler } from './types';

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async emit(event: OrchestrationEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers for this event type
    await Promise.all(
      handlers.map(handler => 
        handler(event).catch(error => 
          console.error(`Event handler failed for ${event.type}:`, error)
        )
      )
    );

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    await Promise.all(
      wildcardHandlers.map(handler => 
        handler(event).catch(error => 
          console.error(`Wildcard event handler failed:`, error)
        )
      )
    );
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}