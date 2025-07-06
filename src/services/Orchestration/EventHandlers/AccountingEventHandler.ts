import { EventHandler, OrchestrationEvent } from '../types';
import { supabase } from '@/integrations/supabase/client';

export interface AccountingEvent extends OrchestrationEvent {
  accountingData: {
    transactionType: 'contract' | 'payment' | 'invoice' | 'violation' | 'maintenance';
    entityId: string;
    amount: number;
    description: string;
    accounts: {
      debitAccount: string;
      creditAccount: string;
    };
    metadata?: Record<string, any>;
  };
}

export class AccountingEventHandler {
  private webhookUrls: string[] = [];

  async handleContractAccounting(event: AccountingEvent): Promise<void> {
    console.log('🧾 Processing Contract Accounting Event:', event.payload);
    
    try {
      // Create immediate accounting entry
      const { data: journalEntry, error } = await supabase.rpc('create_contract_accounting_entry', {
        contract_id: event.accountingData.entityId,
        contract_data: event.accountingData.metadata
      });

      if (error) throw error;

      // Real-time notification
      await this.notifyAccountingUpdate({
        type: 'contract_accounting_created',
        entityId: event.accountingData.entityId,
        journalEntryId: journalEntry,
        timestamp: new Date()
      });

      // Audit trail
      await this.createAuditEntry({
        eventType: 'contract_accounting',
        entityId: event.accountingData.entityId,
        action: 'created',
        details: event.accountingData,
        userId: event.source
      });

    } catch (error) {
      console.error('❌ Contract Accounting Error:', error);
      throw error;
    }
  }

  async handlePaymentAccounting(event: AccountingEvent): Promise<void> {
    console.log('💰 Processing Payment Accounting Event:', event.payload);
    
    try {
      // Create payment accounting entry
      const { data: journalEntry, error } = await supabase.rpc('create_payment_accounting_entry', {
        payment_id: event.accountingData.entityId,
        payment_data: event.accountingData.metadata
      });

      if (error) throw error;

      // Real-time notification
      await this.notifyAccountingUpdate({
        type: 'payment_accounting_created',
        entityId: event.accountingData.entityId,
        journalEntryId: journalEntry,
        timestamp: new Date()
      });

      // Update account balances in real-time
      await this.updateAccountBalances(event.accountingData.accounts);

    } catch (error) {
      console.error('❌ Payment Accounting Error:', error);
      throw error;
    }
  }

  async handleInvoiceAccounting(event: AccountingEvent): Promise<void> {
    console.log('📄 Processing Invoice Accounting Event:', event.payload);
    
    try {
      // Create invoice accounting entry
      const { data: journalEntry, error } = await supabase.rpc('create_invoice_accounting_entry', {
        invoice_id: event.accountingData.entityId,
        invoice_data: event.accountingData.metadata
      });

      if (error) throw error;

      // Real-time notification
      await this.notifyAccountingUpdate({
        type: 'invoice_accounting_created',
        entityId: event.accountingData.entityId,
        journalEntryId: journalEntry,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Invoice Accounting Error:', error);
      throw error;
    }
  }

  async handleViolationAccounting(event: AccountingEvent): Promise<void> {
    console.log('🚨 Processing Violation Accounting Event:', event.payload);
    
    try {
      // Create violation accounting entry
      const { data: journalEntry, error } = await supabase.rpc('create_violation_accounting_entry', {
        payment_id: event.accountingData.entityId,
        payment_amount: event.accountingData.amount,
        payment_date: new Date().toISOString().split('T')[0],
        violation_number: event.accountingData.metadata?.violationNumber || '',
        customer_name: event.accountingData.metadata?.customerName || ''
      });

      if (error) throw error;

      await this.notifyAccountingUpdate({
        type: 'violation_accounting_created',
        entityId: event.accountingData.entityId,
        journalEntryId: journalEntry,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Violation Accounting Error:', error);
      throw error;
    }
  }

  private async notifyAccountingUpdate(update: {
    type: string;
    entityId: string;
    journalEntryId?: string;
    timestamp: Date;
  }): Promise<void> {
    // Real-time notification via Supabase Realtime
    const channel = supabase.channel('accounting-updates');
    
    await channel.send({
      type: 'broadcast',
      event: 'accounting_update',
      payload: update
    });

    // Send webhooks if configured
    for (const webhookUrl of this.webhookUrls) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      } catch (error) {
        console.error('🔗 Webhook Error:', error);
      }
    }
  }

  private async updateAccountBalances(accounts: { debitAccount: string; creditAccount: string }): Promise<void> {
    // Update account balances via real-time channel
    const channel = supabase.channel('account-balances');
    
    await channel.send({
      type: 'broadcast',
      event: 'balance_update',
      payload: {
        accounts: [accounts.debitAccount, accounts.creditAccount],
        timestamp: new Date()
      }
    });
  }

  private async createAuditEntry(auditData: {
    eventType: string;
    entityId: string;
    action: string;
    details: any;
    userId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('accounting_audit_trail')
      .insert({
        event_type: auditData.eventType,
        entity_type: auditData.eventType.split('_')[0],
        entity_id: auditData.entityId,
        action: auditData.action,
        old_values: null,
        new_values: auditData.details,
        user_id: auditData.userId,
        ip_address: 'system',
        user_agent: 'EventHandler'
      });

    if (error) {
      console.error('📋 Audit Trail Error:', error);
    }
  }

  addWebhook(url: string): void {
    if (!this.webhookUrls.includes(url)) {
      this.webhookUrls.push(url);
    }
  }

  removeWebhook(url: string): void {
    this.webhookUrls = this.webhookUrls.filter(u => u !== url);
  }

  getHandlers(): Record<string, EventHandler> {
    return {
      'CONTRACT_ACCOUNTING': this.handleContractAccounting.bind(this),
      'PAYMENT_ACCOUNTING': this.handlePaymentAccounting.bind(this),
      'INVOICE_ACCOUNTING': this.handleInvoiceAccounting.bind(this),
      'VIOLATION_ACCOUNTING': this.handleViolationAccounting.bind(this)
    };
  }
}