import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AccountingNotification {
  type: 'journal_entry_created' | 'balance_updated' | 'transaction_processed' | 'error_occurred';
  data: {
    entityType: string;
    entityId: string;
    amount?: number;
    description?: string;
    journalEntryId?: string;
    error?: string;
    timestamp: Date;
  };
}

export class RealTimeAccountingNotificationSystem {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<(notification: AccountingNotification) => void>> = new Map();

  async initialize(): Promise<void> {
    console.log('🔔 Initializing Real-Time Accounting Notification System');

    // Create main accounting updates channel
    const accountingChannel = supabase.channel('accounting-updates');
    
    accountingChannel
      .on('broadcast', { event: 'accounting_update' }, (payload) => {
        this.broadcastToSubscribers('accounting_update', payload.payload);
      })
      .subscribe();

    this.channels.set('accounting-updates', accountingChannel);

    // Create balance updates channel
    const balanceChannel = supabase.channel('balance-updates');
    
    balanceChannel
      .on('broadcast', { event: 'balance_update' }, (payload) => {
        this.broadcastToSubscribers('balance_update', payload.payload);
      })
      .subscribe();

    this.channels.set('balance-updates', balanceChannel);

    // Listen to database changes for real-time updates
    const dbChangesChannel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'journal_entries' },
        (payload) => {
          this.handleJournalEntryInsert(payload.new);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chart_of_accounts' },
        (payload) => {
          this.handleAccountBalanceUpdate(payload.new);
        }
      )
      .subscribe();

    this.channels.set('db-changes', dbChangesChannel);
  }

  subscribe(
    event: string, 
    callback: (notification: AccountingNotification) => void
  ): string {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);
    
    const subscriptionId = `${event}_${Date.now()}_${Math.random()}`;
    return subscriptionId;
  }

  unsubscribe(event: string, callback: (notification: AccountingNotification) => void): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.delete(callback);
    }
  }

  async sendNotification(notification: AccountingNotification): Promise<void> {
    const channelName = this.getChannelForNotificationType(notification.type);
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: notification.type,
        payload: notification
      });
    }

    // Also broadcast to local subscribers
    this.broadcastToSubscribers(notification.type, notification);
  }

  private broadcastToSubscribers(event: string, payload: any): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('🔔 Notification Callback Error:', error);
        }
      });
    }
  }

  private handleJournalEntryInsert(journalEntry: any): void {
    const notification: AccountingNotification = {
      type: 'journal_entry_created',
      data: {
        entityType: journalEntry.reference_type || 'general',
        entityId: journalEntry.reference_id || journalEntry.id,
        journalEntryId: journalEntry.id,
        description: journalEntry.description,
        amount: journalEntry.total_debit,
        timestamp: new Date(journalEntry.created_at)
      }
    };

    this.broadcastToSubscribers('journal_entry_created', notification);
  }

  private handleAccountBalanceUpdate(account: any): void {
    const notification: AccountingNotification = {
      type: 'balance_updated',
      data: {
        entityType: 'account',
        entityId: account.id,
        description: `رصيد ${account.account_name} محدث`,
        amount: account.current_balance,
        timestamp: new Date(account.updated_at)
      }
    };

    this.broadcastToSubscribers('balance_updated', notification);
  }

  private getChannelForNotificationType(type: string): string {
    switch (type) {
      case 'balance_updated':
        return 'balance-updates';
      case 'journal_entry_created':
      case 'transaction_processed':
      default:
        return 'accounting-updates';
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔔 Shutting down Real-Time Accounting Notification System');
    
    for (const [name, channel] of this.channels) {
      await supabase.removeChannel(channel);
      console.log(`📢 Removed channel: ${name}`);
    }
    
    this.channels.clear();
    this.subscribers.clear();
  }
}