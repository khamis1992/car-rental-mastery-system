import { OrchestrationResult, TransactionStep, Saga, OrchestrationEvent, EventBus } from './types';

export abstract class BaseOrchestrationService {
  protected eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  protected async executeWithRollback<T>(
    steps: TransactionStep[]
  ): Promise<OrchestrationResult<T>> {
    const saga: Saga = {
      id: this.generateSagaId(),
      steps,
      currentStep: 0,
      isCompleted: false,
      isRolledBack: false,
    };

    try {
      for (let i = 0; i < steps.length; i++) {
        saga.currentStep = i;
        await steps[i].execute();
        
        await this.emitEvent({
          type: 'STEP_COMPLETED',
          payload: { sagaId: saga.id, stepIndex: i, stepName: steps[i].name },
          timestamp: new Date(),
          source: this.constructor.name,
        });
      }

      saga.isCompleted = true;
      await this.emitEvent({
        type: 'SAGA_COMPLETED',
        payload: { sagaId: saga.id },
        timestamp: new Date(),
        source: this.constructor.name,
      });

      return { success: true };
    } catch (error) {
      await this.rollbackSaga(saga);
      
      await this.emitEvent({
        type: 'SAGA_FAILED',
        payload: { sagaId: saga.id, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        source: this.constructor.name,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  private async rollbackSaga(saga: Saga): Promise<void> {
    for (let i = saga.currentStep; i >= 0; i--) {
      try {
        await saga.steps[i].rollback();
        await this.emitEvent({
          type: 'STEP_ROLLED_BACK',
          payload: { sagaId: saga.id, stepIndex: i, stepName: saga.steps[i].name },
          timestamp: new Date(),
          source: this.constructor.name,
        });
      } catch (rollbackError) {
        console.error(`Failed to rollback step ${i}:`, rollbackError);
      }
    }
    saga.isRolledBack = true;
  }

  protected async emitEvent(event: OrchestrationEvent): Promise<void> {
    await this.eventBus.emit(event);
  }

  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}