export interface OrchestrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackActions?: Array<() => Promise<void>>;
}

export interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  rollback: () => Promise<void>;
}

export interface OrchestrationEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
}

export interface Saga {
  id: string;
  steps: TransactionStep[];
  currentStep: number;
  isCompleted: boolean;
  isRolledBack: boolean;
}

export type EventHandler = (event: OrchestrationEvent) => Promise<void>;

export interface EventBus {
  emit(event: OrchestrationEvent): Promise<void>;
  on(eventType: string, handler: EventHandler): void;
  off(eventType: string, handler: EventHandler): void;
}