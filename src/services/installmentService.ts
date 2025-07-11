import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InstallmentPlan = Database["public"]["Tables"]["installment_plans"]["Row"];
type InstallmentPlanInsert = Database["public"]["Tables"]["installment_plans"]["Insert"];
type Installment = Database["public"]["Tables"]["installments"]["Row"];
type InstallmentAlert = Database["public"]["Tables"]["installment_alerts"]["Row"];
type InstallmentPayment = Database["public"]["Tables"]["installment_payments"]["Row"];
type InstallmentPaymentInsert = Database["public"]["Tables"]["installment_payments"]["Insert"];

export const installmentService = {
  // خطط الأقساط
  async getInstallmentPlans() {
    const { data, error } = await supabase
      .from("installment_plans")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getInstallmentPlan(id: string) {
    const { data, error } = await supabase
      .from("installment_plans")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createInstallmentPlan(plan: Omit<InstallmentPlanInsert, 'plan_number'>) {
    // توليد رقم الخطة
    const { data: planNumber } = await supabase.rpc("generate_installment_plan_number");
    
    const { data, error } = await supabase
      .from("installment_plans")
      .insert({ ...plan, plan_number: planNumber })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInstallmentPlan(id: string, updates: Partial<InstallmentPlan>) {
    const { data, error } = await supabase
      .from("installment_plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteInstallmentPlan(id: string) {
    const { error } = await supabase
      .from("installment_plans")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // الأقساط
  async getInstallments(planId?: string) {
    let query = supabase
      .from("installments")
      .select(`
        *,
        installment_plan:installment_plans(*)
      `)
      .order("due_date", { ascending: true });

    if (planId) {
      query = query.eq("installment_plan_id", planId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getInstallment(id: string) {
    const { data, error } = await supabase
      .from("installments")
      .select(`
        *,
        installment_plan:installment_plans(*),
        installment_payments(*)
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInstallment(id: string, updates: Partial<Installment>) {
    const { data, error } = await supabase
      .from("installments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getOverdueInstallments() {
    const { data, error } = await supabase
      .from("installments")
      .select(`
        *,
        installment_plan:installment_plans(*)
      `)
      .eq("status", "overdue")
      .order("days_overdue", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getUpcomingInstallments(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
      .from("installments")
      .select(`
        *,
        installment_plan:installment_plans(*)
      `)
      .eq("status", "pending")
      .lte("due_date", futureDate.toISOString().split('T')[0])
      .order("due_date", { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // المدفوعات
  async createInstallmentPayment(payment: InstallmentPaymentInsert) {
    const { data, error } = await supabase
      .from("installment_payments")
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;

    // تحديث حالة القسط
    await this.updateInstallmentStatus(payment.installment_id);
    
    return data;
  },

  async getInstallmentPayments(installmentId: string) {
    const { data, error } = await supabase
      .from("installment_payments")
      .select("*")
      .eq("installment_id", installmentId)
      .order("payment_date", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateInstallmentStatus(installmentId: string) {
    // حساب إجمالي المدفوعات
    const { data: payments } = await supabase
      .from("installment_payments")
      .select("payment_amount")
      .eq("installment_id", installmentId);

    const totalPaid = payments?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;

    // الحصول على بيانات القسط
    const { data: installment } = await supabase
      .from("installments")
      .select("total_amount, due_date")
      .eq("id", installmentId)
      .single();

    if (!installment) return;

    let status = "pending";
    if (totalPaid >= installment.total_amount) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    } else if (new Date(installment.due_date) < new Date()) {
      status = "overdue";
    }

    await supabase
      .from("installments")
      .update({ 
        paid_amount: totalPaid,
        status,
        payment_date: totalPaid >= installment.total_amount ? new Date().toISOString().split('T')[0] : null
      })
      .eq("id", installmentId);
  },

  // التنبيهات
  async getInstallmentAlerts(unreadOnly: boolean = false) {
    let query = supabase
      .from("installment_alerts")
      .select(`
        *,
        installment:installments(
          *,
          installment_plan:installment_plans(*)
        )
      `)
      .order("sent_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markAlertAsRead(id: string) {
    const { error } = await supabase
      .from("installment_alerts")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("id", id);
    
    if (error) throw error;
  },

  async markAllAlertsAsRead() {
    const { error } = await supabase
      .from("installment_alerts")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("is_read", false);
    
    if (error) throw error;
  },

  // إحصائيات
  async getInstallmentSummary() {
    const { data, error } = await supabase.rpc("calculate_installment_summary", {
      tenant_id_param: "00000000-0000-0000-0000-000000000000" // يجب الحصول على tenant_id الصحيح
    });
    
    if (error) throw error;
    return data;
  },

  // تحديث الأقساط المتأخرة
  async updateOverdueInstallments() {
    const { error } = await supabase.rpc("update_overdue_installments");
    if (error) throw error;
  },

  // إنشاء تنبيهات تلقائية
  async createAutomaticAlerts() {
    const { error } = await supabase.rpc("create_installment_alerts");
    if (error) throw error;
  },

  // تقارير
  async getCashFlowReport(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from("installments")
      .select(`
        due_date,
        total_amount,
        paid_amount,
        remaining_amount,
        status,
        installment_plan:installment_plans(supplier_name, plan_name)
      `)
      .gte("due_date", startDate)
      .lte("due_date", endDate)
      .order("due_date", { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getSupplierReport() {
    const { data, error } = await supabase
      .from("installment_plans")
      .select(`
        supplier_name,
        total_amount,
        remaining_amount,
        status,
        installments(total_amount, paid_amount, status)
      `);
    
    if (error) throw error;
    
    // تجميع البيانات حسب المورد
    const supplierData = data?.reduce((acc, plan) => {
      const supplier = plan.supplier_name;
      if (!acc[supplier]) {
        acc[supplier] = {
          supplier_name: supplier,
          total_contracts: 0,
          total_amount: 0,
          paid_amount: 0,
          pending_amount: 0,
          overdue_amount: 0
        };
      }
      
      acc[supplier].total_contracts += 1;
      acc[supplier].total_amount += plan.total_amount || 0;
      
      plan.installments?.forEach(installment => {
        acc[supplier].paid_amount += installment.paid_amount || 0;
        if (installment.status === 'pending') {
          acc[supplier].pending_amount += (installment.total_amount - (installment.paid_amount || 0));
        } else if (installment.status === 'overdue') {
          acc[supplier].overdue_amount += (installment.total_amount - (installment.paid_amount || 0));
        }
      });
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(supplierData || {});
  }
};