
import { supabase } from "@/integrations/supabase/client";
import { tenantIsolationMiddleware } from "@/middleware/TenantIsolationMiddleware";
import { AccountingIntegrationService } from "./BusinessServices/AccountingIntegrationService";

export interface VehicleSale {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  customer_id?: string;
  sale_number: string;
  sale_date: string;
  sale_price: number;
  book_value: number;
  gain_loss: number;
  payment_method: 'cash' | 'installment' | 'bank_transfer';
  payment_terms?: string;
  down_payment?: number;
  installment_amount?: number;
  installment_count?: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_id_number: string;
  buyer_address?: string;
  notes?: string;
  documents?: string[];
  status: 'draft' | 'completed' | 'cancelled';
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateVehicleSaleData {
  vehicle_id: string;
  customer_id?: string;
  sale_date: string;
  sale_price: number;
  payment_method: 'cash' | 'installment' | 'bank_transfer';
  payment_terms?: string;
  down_payment?: number;
  installment_amount?: number;
  installment_count?: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_id_number: string;
  buyer_address?: string;
  notes?: string;
}

export const vehicleSalesService = {
  async createVehicleSale(data: CreateVehicleSaleData): Promise<VehicleSale> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      // الحصول على بيانات السيارة
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', data.vehicle_id)
        .eq('tenant_id', tenantId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('لم يتم العثور على السيارة');
      }

      // حساب القيمة الدفترية والربح/الخسارة
      const bookValue = vehicle.purchase_price || 0;
      const gainLoss = data.sale_price - bookValue;

      // إنشاء رقم المبيعة
      const saleNumber = `SALE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // إنشاء سجل المبيعة
      const { data: sale, error: saleError } = await supabase
        .from('vehicle_sales')
        .insert({
          tenant_id: tenantId,
          vehicle_id: data.vehicle_id,
          customer_id: data.customer_id,
          sale_number: saleNumber,
          sale_date: data.sale_date,
          sale_price: data.sale_price,
          book_value: bookValue,
          gain_loss: gainLoss,
          payment_method: data.payment_method,
          payment_terms: data.payment_terms,
          down_payment: data.down_payment,
          installment_amount: data.installment_amount,
          installment_count: data.installment_count,
          buyer_name: data.buyer_name,
          buyer_phone: data.buyer_phone,
          buyer_id_number: data.buyer_id_number,
          buyer_address: data.buyer_address,
          notes: data.notes,
          status: 'draft'
        })
        .select()
        .single();

      if (saleError) {
        console.error('خطأ في إنشاء المبيعة:', saleError);
        throw saleError;
      }

      // إنشاء القيد المحاسبي
      const accountingService = new AccountingIntegrationService();
      const journalEntryId = await accountingService.createVehicleSaleAccountingEntry(
        sale.id,
        {
          vehicle_info: `${vehicle.make} ${vehicle.model} - ${vehicle.year}`,
          sale_price: data.sale_price,
          book_value: bookValue,
          gain_loss: gainLoss,
          buyer_name: data.buyer_name,
          payment_method: data.payment_method
        }
      );

      // تحديث المبيعة بمعرف القيد المحاسبي
      if (journalEntryId) {
        await supabase
          .from('vehicle_sales')
          .update({ journal_entry_id: journalEntryId })
          .eq('id', sale.id);
      }

      return sale;
    } catch (error) {
      console.error('خطأ في createVehicleSale:', error);
      throw error;
    }
  },

  async getVehicleSales(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    vehicle_id?: string;
  }): Promise<VehicleSale[]> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      let query = supabase
        .from('vehicle_sales')
        .select(`
          *,
          vehicle:vehicles(make, model, year, license_plate)
        `)
        .eq('tenant_id', tenantId)
        .order('sale_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('sale_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('sale_date', filters.date_to);
      }

      if (filters?.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب المبيعات:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في getVehicleSales:', error);
      return [];
    }
  },

  async getVehicleSaleById(id: string): Promise<VehicleSale | null> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('vehicle_sales')
        .select(`
          *,
          vehicle:vehicles(make, model, year, license_plate, purchase_price)
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('خطأ في جلب المبيعة:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('خطأ في getVehicleSaleById:', error);
      return null;
    }
  },

  async updateVehicleSaleStatus(id: string, status: VehicleSale['status']): Promise<VehicleSale> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('vehicle_sales')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث حالة المبيعة:', error);
        throw error;
      }

      // إذا تم اكتمال المبيعة، تحديث حالة السيارة
      if (status === 'completed') {
        await supabase
          .from('vehicles')
          .update({ status: 'sold' })
          .eq('id', data.vehicle_id);
      }

      return data;
    } catch (error) {
      console.error('خطأ في updateVehicleSaleStatus:', error);
      throw error;
    }
  },

  async deleteVehicleSale(id: string): Promise<void> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { error } = await supabase
        .from('vehicle_sales')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('خطأ في حذف المبيعة:', error);
        throw error;
      }
    } catch (error) {
      console.error('خطأ في deleteVehicleSale:', error);
      throw error;
    }
  },

  async getSalesStatistics(dateRange?: { from: string; to: string }): Promise<{
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    average_sale_price: number;
    sales_by_month: Array<{ month: string; count: number; revenue: number }>;
  }> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      let query = supabase
        .from('vehicle_sales')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed');

      if (dateRange) {
        query = query.gte('sale_date', dateRange.from).lte('sale_date', dateRange.to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب إحصائيات المبيعات:', error);
        throw error;
      }

      const totalSales = data.length;
      const totalRevenue = data.reduce((sum, sale) => sum + sale.sale_price, 0);
      const totalProfit = data.reduce((sum, sale) => sum + sale.gain_loss, 0);
      const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

      // إحصائيات شهرية
      const salesByMonth = data.reduce((acc: any, sale) => {
        const month = new Date(sale.sale_date).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { count: 0, revenue: 0 };
        }
        acc[month].count += 1;
        acc[month].revenue += sale.sale_price;
        return acc;
      }, {});

      const salesByMonthArray = Object.entries(salesByMonth).map(([month, stats]: [string, any]) => ({
        month,
        count: stats.count,
        revenue: stats.revenue
      }));

      return {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        average_sale_price: averageSalePrice,
        sales_by_month: salesByMonthArray
      };
    } catch (error) {
      console.error('خطأ في getSalesStatistics:', error);
      return {
        total_sales: 0,
        total_revenue: 0,
        total_profit: 0,
        average_sale_price: 0,
        sales_by_month: []
      };
    }
  }
};
