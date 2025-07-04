// خدمة إدارة أحداث العقود
import { ContractWithDetails } from './contractService';

export type ContractEventType = 
  | 'contract_created'
  | 'contract_updated' 
  | 'contract_activated'
  | 'contract_completed'
  | 'contract_cancelled'
  | 'status_changed'
  | 'payment_received'
  | 'delivery_completed';

export interface ContractEvent {
  id: string;
  type: ContractEventType;
  contractId: string;
  data: any;
  timestamp: Date;
  source: 'local' | 'realtime' | 'manual';
}

class ContractEventManager {
  private listeners: Map<ContractEventType, Array<(event: ContractEvent) => void>> = new Map();
  private eventHistory: ContractEvent[] = [];
  private maxHistorySize = 100;

  // إضافة مستمع للأحداث
  addEventListener(
    type: ContractEventType, 
    listener: (event: ContractEvent) => void
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type)!.push(listener);
    
    // إرجاع دالة لإلغاء الاستماع
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // إطلاق حدث
  emitEvent(
    type: ContractEventType,
    contractId: string,
    data: any,
    source: 'local' | 'realtime' | 'manual' = 'local'
  ) {
    const event: ContractEvent = {
      id: crypto.randomUUID(),
      type,
      contractId,
      data,
      timestamp: new Date(),
      source,
    };

    // إضافة للتاريخ
    this.addToHistory(event);

    // إشعار المستمعين
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('خطأ في معالج الحدث:', error);
      }
    });

    console.log(`🔔 حدث العقد: ${type}`, event);
  }

  // إضافة للتاريخ مع الحد الأقصى
  private addToHistory(event: ContractEvent) {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  // الحصول على تاريخ الأحداث
  getEventHistory(contractId?: string): ContractEvent[] {
    if (contractId) {
      return this.eventHistory.filter(e => e.contractId === contractId);
    }
    return [...this.eventHistory];
  }

  // مسح التاريخ
  clearHistory() {
    this.eventHistory = [];
  }

  // مسح جميع المستمعين
  removeAllListeners() {
    this.listeners.clear();
  }
}

// مثيل وحيد من مدير الأحداث
export const contractEventManager = new ContractEventManager();

// دوال مساعدة لإطلاق أحداث شائعة
export const contractEvents = {
  created: (contract: ContractWithDetails) => {
    contractEventManager.emitEvent('contract_created', contract.id, contract);
  },

  updated: (contractId: string, updates: Partial<ContractWithDetails>) => {
    contractEventManager.emitEvent('contract_updated', contractId, updates);
  },

  activated: (contractId: string, actualStartDate: string) => {
    contractEventManager.emitEvent('contract_activated', contractId, { actualStartDate });
  },

  completed: (contractId: string, actualEndDate: string) => {
    contractEventManager.emitEvent('contract_completed', contractId, { actualEndDate });
  },

  statusChanged: (contractId: string, oldStatus: string, newStatus: string) => {
    contractEventManager.emitEvent('status_changed', contractId, { 
      oldStatus, 
      newStatus 
    });
  },

  paymentReceived: (contractId: string, amount: number, paymentMethod: string) => {
    contractEventManager.emitEvent('payment_received', contractId, { 
      amount, 
      paymentMethod 
    });
  },

  deliveryCompleted: (contractId: string, deliveryData: any) => {
    contractEventManager.emitEvent('delivery_completed', contractId, deliveryData);
  },
};

// Hook لاستخدام أحداث العقود
export const useContractEvents = () => {
  return {
    addEventListener: contractEventManager.addEventListener.bind(contractEventManager),
    emitEvent: contractEventManager.emitEvent.bind(contractEventManager),
    getEventHistory: contractEventManager.getEventHistory.bind(contractEventManager),
    contractEvents,
  };
};