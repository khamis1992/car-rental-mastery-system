import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

// Types for accounting reports
export interface CustomerTransaction {
  id: string;
  customer_id: string;
  customer_name: string;
  contract_id: string;
  contract_number: string;
  transaction_date: string;
  transaction_type: 'invoice' | 'payment' | 'penalty' | 'discount';
  amount: number;
  balance: number;
  account_code: string;
  account_name: string;
  description: string;
  user_name: string;
  vehicle_plate?: string;
  branch_name?: string;
}

export interface CustomerAnalytics {
  customer_id: string;
  customer_name: string;
  total_revenue: number;
  contracts_count: number;
  average_rental_days: number;
  total_penalties: number;
  paid_penalties: number;
  collection_rate: number;
  total_invoices: number;
  total_payments: number;
  current_balance: number;
  most_rented_vehicle: string;
  most_used_branch: string;
  first_contract_date: string;
  last_activity_date: string;
}

export interface CustomerOverview {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  phone: string;
  email: string;
  contracts_count: number;
  current_balance: number;
  total_invoices: number;
  total_payments: number;
  collection_rate: number;
  penalties_count: number;
  status: 'active' | 'inactive' | 'overdue';
  last_payment_date: string;
  days_overdue: number;
}

export interface FixedAsset {
  id: string;
  asset_code: string;
  vehicle_type: string;
  plate_number: string;
  model: string;
  year: number;
  purchase_date: string;
  purchase_value: number;
  depreciation_rate: number;
  monthly_depreciation: number;
  accumulated_depreciation: number;
  book_value: number;
  status: 'active' | 'disposed' | 'maintenance';
  last_depreciation_date: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  reference: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  source_type: 'invoice' | 'payment' | 'penalty' | 'depreciation';
  source_id: string;
  user_id: string;
  tenant_id: string;
}

class AccountingReportsService {
  private tenant_id: string | null = null;

  constructor() {
    this.initializeTenant();
  }

  private async initializeTenant() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      this.tenant_id = data?.tenant_id || null;
    }
  }

  // 1. Customer Statement Report
  async getCustomerStatement(
    customerId: string,
    startDate?: string,
    endDate?: string,
    filters?: {
      vehicle_id?: string;
      branch_id?: string;
      transaction_type?: string;
    }
  ): Promise<CustomerTransaction[]> {
    if (!this.tenant_id) await this.initializeTenant();

    let query = supabase
      .from('contract_transactions')
      .select(`
        *,
        contracts!inner(
          id,
          contract_number,
          customer_id,
          vehicle_id,
          branch_id,
          customers!inner(
            id,
            name,
            code
          ),
          vehicles(
            plate_number,
            type
          ),
          branches(
            name
          )
        ),
        user_profiles(
          full_name
        )
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('contracts.customer_id', customerId)
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    if (filters?.vehicle_id) {
      query = query.eq('contracts.vehicle_id', filters.vehicle_id);
    }

    if (filters?.branch_id) {
      query = query.eq('contracts.branch_id', filters.branch_id);
    }

    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer statement:', error);
      throw error;
    }

    return data?.map((transaction: any) => ({
      id: transaction.id,
      customer_id: transaction.contracts.customer_id,
      customer_name: transaction.contracts.customers.name,
      contract_id: transaction.contract_id,
      contract_number: transaction.contracts.contract_number,
      transaction_date: transaction.transaction_date,
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      balance: transaction.balance,
      account_code: this.getAccountCodeByTransactionType(transaction.transaction_type),
      account_name: this.getAccountNameByTransactionType(transaction.transaction_type),
      description: transaction.description,
      user_name: transaction.user_profiles?.full_name || 'غير محدد',
      vehicle_plate: transaction.contracts.vehicles?.plate_number,
      branch_name: transaction.contracts.branches?.name
    })) || [];
  }

  // 2. Customer Analytics Report
  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    if (!this.tenant_id) await this.initializeTenant();

    // Get customer contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        customers!inner(name),
        vehicles(plate_number, type),
        branches(name)
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('customer_id', customerId);

    // Get customer transactions
    const { data: transactions } = await supabase
      .from('contract_transactions')
      .select(`
        *,
        contracts!inner(customer_id)
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('contracts.customer_id', customerId);

    if (!contracts || !transactions) {
      throw new Error('Failed to fetch customer data');
    }

    // Calculate analytics
    const totalRevenue = transactions
      .filter(t => t.transaction_type === 'invoice')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = transactions
      .filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInvoices = transactions
      .filter(t => t.transaction_type === 'invoice')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPenalties = transactions
      .filter(t => t.transaction_type === 'penalty')
      .reduce((sum, t) => sum + t.amount, 0);

    const paidPenalties = transactions
      .filter(t => t.transaction_type === 'penalty' && t.paid_amount > 0)
      .reduce((sum, t) => sum + t.paid_amount, 0);

    const collectionRate = totalInvoices > 0 ? (totalPayments / totalInvoices) * 100 : 0;

    // Calculate average rental days
    const totalRentalDays = contracts.reduce((sum, contract) => {
      if (contract.start_date && contract.end_date) {
        return sum + differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
      }
      return sum;
    }, 0);

    const averageRentalDays = contracts.length > 0 ? totalRentalDays / contracts.length : 0;

    // Find most rented vehicle
    const vehicleCount = contracts.reduce((acc: any, contract) => {
      const plateNumber = contract.vehicles?.plate_number || 'غير محدد';
      acc[plateNumber] = (acc[plateNumber] || 0) + 1;
      return acc;
    }, {});

    const mostRentedVehicle = Object.keys(vehicleCount).reduce((a, b) => 
      vehicleCount[a] > vehicleCount[b] ? a : b, 'غير محدد'
    );

    // Find most used branch
    const branchCount = contracts.reduce((acc: any, contract) => {
      const branchName = contract.branches?.name || 'غير محدد';
      acc[branchName] = (acc[branchName] || 0) + 1;
      return acc;
    }, {});

    const mostUsedBranch = Object.keys(branchCount).reduce((a, b) => 
      branchCount[a] > branchCount[b] ? a : b, 'غير محدد'
    );

    const currentBalance = transactions.reduce((sum, t) => {
      if (t.transaction_type === 'invoice' || t.transaction_type === 'penalty') {
        return sum + t.amount;
      } else if (t.transaction_type === 'payment') {
        return sum - t.amount;
      }
      return sum;
    }, 0);

    return {
      customer_id: customerId,
      customer_name: contracts[0]?.customers?.name || 'غير محدد',
      total_revenue: totalRevenue,
      contracts_count: contracts.length,
      average_rental_days: Math.round(averageRentalDays),
      total_penalties: totalPenalties,
      paid_penalties: paidPenalties,
      collection_rate: Math.round(collectionRate * 100) / 100,
      total_invoices: totalInvoices,
      total_payments: totalPayments,
      current_balance: currentBalance,
      most_rented_vehicle: mostRentedVehicle,
      most_used_branch: mostUsedBranch,
      first_contract_date: contracts.sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )[0]?.start_date || '',
      last_activity_date: transactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )[0]?.transaction_date || ''
    };
  }

  // 3. Customers Overview Report
  async getCustomersOverview(
    sortBy: 'balance' | 'collection' | 'contracts' | 'branch' = 'balance',
    filters?: {
      branch_id?: string;
      status?: string;
      overdue_days?: number;
    }
  ): Promise<CustomerOverview[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: customers } = await supabase
      .from('customers')
      .select(`
        *,
        contracts(
          id,
          contract_number,
          start_date,
          end_date,
          branch_id,
          branches(name),
          contract_transactions(
            transaction_type,
            amount,
            transaction_date
          )
        )
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');

    if (!customers) {
      throw new Error('Failed to fetch customers data');
    }

    const customersOverview = customers.map(customer => {
      const contracts = customer.contracts || [];
      const allTransactions = contracts.flatMap(contract => 
        contract.contract_transactions || []
      );

      const totalInvoices = allTransactions
        .filter(t => t.transaction_type === 'invoice')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalPayments = allTransactions
        .filter(t => t.transaction_type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = allTransactions.reduce((sum, t) => {
        if (t.transaction_type === 'invoice' || t.transaction_type === 'penalty') {
          return sum + t.amount;
        } else if (t.transaction_type === 'payment') {
          return sum - t.amount;
        }
        return sum;
      }, 0);

      const collectionRate = totalInvoices > 0 ? (totalPayments / totalInvoices) * 100 : 0;

      const penaltiesCount = allTransactions
        .filter(t => t.transaction_type === 'penalty').length;

      const lastPaymentDate = allTransactions
        .filter(t => t.transaction_type === 'payment')
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        [0]?.transaction_date || '';

      const daysOverdue = lastPaymentDate ? 
        differenceInDays(new Date(), new Date(lastPaymentDate)) : 0;

      let status: 'active' | 'inactive' | 'overdue' = 'active';
      if (daysOverdue > 30) {
        status = 'overdue';
      } else if (contracts.length === 0) {
        status = 'inactive';
      }

      return {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_code: customer.code,
        phone: customer.phone,
        email: customer.email,
        contracts_count: contracts.length,
        current_balance: currentBalance,
        total_invoices: totalInvoices,
        total_payments: totalPayments,
        collection_rate: Math.round(collectionRate * 100) / 100,
        penalties_count: penaltiesCount,
        status: status,
        last_payment_date: lastPaymentDate,
        days_overdue: daysOverdue
      };
    });

    // Apply filters
    let filteredCustomers = customersOverview;

    if (filters?.status) {
      filteredCustomers = filteredCustomers.filter(c => c.status === filters.status);
    }

    if (filters?.overdue_days) {
      filteredCustomers = filteredCustomers.filter(c => c.days_overdue >= filters.overdue_days);
    }

    // Sort customers
    switch (sortBy) {
      case 'balance':
        filteredCustomers.sort((a, b) => b.current_balance - a.current_balance);
        break;
      case 'collection':
        filteredCustomers.sort((a, b) => b.collection_rate - a.collection_rate);
        break;
      case 'contracts':
        filteredCustomers.sort((a, b) => b.contracts_count - a.contracts_count);
        break;
      default:
        filteredCustomers.sort((a, b) => a.customer_name.localeCompare(b.customer_name, 'ar'));
    }

    return filteredCustomers;
  }

  // 4. Fixed Assets Report
  async getFixedAssetsReport(): Promise<FixedAsset[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_depreciation(
          depreciation_rate,
          last_depreciation_date,
          accumulated_depreciation
        )
      `)
      .eq('tenant_id', this.tenant_id);

    if (!vehicles) {
      throw new Error('Failed to fetch vehicles data');
    }

    return vehicles.map(vehicle => {
      const purchaseValue = vehicle.purchase_price || 0;
      const depreciationRate = vehicle.vehicle_depreciation?.depreciation_rate || 10; // 10% default
      const monthlyDepreciation = (purchaseValue * depreciationRate) / 1200; // Monthly depreciation
      
      const purchaseDate = new Date(vehicle.purchase_date || vehicle.created_at);
      const monthsSincePurchase = differenceInDays(new Date(), purchaseDate) / 30;
      
      const accumulatedDepreciation = Math.min(
        monthlyDepreciation * monthsSincePurchase,
        purchaseValue * 0.8 // Max 80% depreciation
      );

      const bookValue = purchaseValue - accumulatedDepreciation;

      return {
        id: vehicle.id,
        asset_code: vehicle.code || `VEH-${vehicle.plate_number}`,
        vehicle_type: vehicle.type,
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        year: vehicle.year,
        purchase_date: vehicle.purchase_date || vehicle.created_at,
        purchase_value: purchaseValue,
        depreciation_rate: depreciationRate,
        monthly_depreciation: Math.round(monthlyDepreciation * 100) / 100,
        accumulated_depreciation: Math.round(accumulatedDepreciation * 100) / 100,
        book_value: Math.round(bookValue * 100) / 100,
        status: vehicle.status,
        last_depreciation_date: vehicle.vehicle_depreciation?.last_depreciation_date || 
          format(new Date(), 'yyyy-MM-dd')
      };
    });
  }

  // 5. Create Journal Entry
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'tenant_id'>): Promise<string> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{
        ...entry,
        tenant_id: this.tenant_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }

    return data.id;
  }

  // 6. Process Monthly Depreciation
  async processMonthlyDepreciation(): Promise<void> {
    const assets = await this.getFixedAssetsReport();
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = format(new Date(), 'yyyy-MM');

    for (const asset of assets) {
      // Check if depreciation already processed this month
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('source_type', 'depreciation')
        .eq('source_id', asset.id)
        .gte('entry_date', `${currentMonth}-01`)
        .lt('entry_date', `${currentMonth}-31`);

      if (existingEntry && existingEntry.length > 0) {
        continue; // Skip if already processed
      }

      // Create depreciation journal entry
      await this.createJournalEntry({
        entry_date: currentDate,
        reference: `DEP-${asset.asset_code}-${currentMonth}`,
        description: `إهلاك شهري - ${asset.plate_number}`,
        debit_account: '5130101', // مصروف إهلاك السيارات والباصات
        credit_account: '1210101', // مخصص إهلاك السيارات والباصات
        amount: asset.monthly_depreciation,
        source_type: 'depreciation',
        source_id: asset.id,
        user_id: (await supabase.auth.getUser()).data.user?.id || ''
      });

      // Update vehicle depreciation data
      await supabase
        .from('vehicle_depreciation')
        .upsert({
          vehicle_id: asset.id,
          last_depreciation_date: currentDate,
          accumulated_depreciation: asset.accumulated_depreciation + asset.monthly_depreciation,
          tenant_id: this.tenant_id
        });
    }
  }

  // Helper methods
  private getAccountCodeByTransactionType(type: string): string {
    switch (type) {
      case 'invoice':
        return '1130101'; // عملاء تجاريون شركات
      case 'payment':
        return '1110101'; // الصندوق النقدي الرئيسي
      case 'penalty':
        return '4310104'; // إيرادات أخرى
      default:
        return '1130101';
    }
  }

  private getAccountNameByTransactionType(type: string): string {
    switch (type) {
      case 'invoice':
        return 'عملاء تجاريون شركات';
      case 'payment':
        return 'الصندوق النقدي الرئيسي';
      case 'penalty':
        return 'إيرادات أخرى';
      default:
        return 'عملاء تجاريون شركات';
    }
  }

  // Dashboard summary data
  async getDashboardSummary() {
    if (!this.tenant_id) await this.initializeTenant();

    const currentMonth = format(new Date(), 'yyyy-MM');
    
    const [customersCount, monthlyRevenue, collectionRate, totalAssets] = await Promise.all([
      this.getCustomersCount(),
      this.getMonthlyRevenue(currentMonth),
      this.getOverallCollectionRate(),
      this.getTotalAssetsValue()
    ]);

    return {
      customersCount,
      monthlyRevenue,
      collectionRate,
      totalAssets
    };
  }

  private async getCustomersCount(): Promise<number> {
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');
    
    return count || 0;
  }

  private async getMonthlyRevenue(month: string): Promise<number> {
    const { data } = await supabase
      .from('contract_transactions')
      .select('amount')
      .eq('tenant_id', this.tenant_id)
      .eq('transaction_type', 'invoice')
      .gte('transaction_date', `${month}-01`)
      .lt('transaction_date', `${month}-31`);

    return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
  }

  private async getOverallCollectionRate(): Promise<number> {
    const { data } = await supabase
      .from('contract_transactions')
      .select('transaction_type, amount')
      .eq('tenant_id', this.tenant_id)
      .in('transaction_type', ['invoice', 'payment']);

    if (!data) return 0;

    const totalInvoices = data
      .filter(t => t.transaction_type === 'invoice')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = data
      .filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return totalInvoices > 0 ? (totalPayments / totalInvoices) * 100 : 0;
  }

  private async getTotalAssetsValue(): Promise<number> {
    const { data } = await supabase
      .from('vehicles')
      .select('purchase_price')
      .eq('tenant_id', this.tenant_id);

    return data?.reduce((sum, v) => sum + (v.purchase_price || 0), 0) || 0;
  }
}

export const accountingReportsService = new AccountingReportsService(); 