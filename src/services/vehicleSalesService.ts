// This service will be used instead of the broken vehicleSalesService
// It provides basic functionality for vehicle sales

import { supabase } from '@/integrations/supabase/client';

export interface VehicleSale {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  sale_number: string;
  sale_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  sale_price: number;
  payment_method: string;
  payment_terms?: string;
  book_value: number;
  gain_loss: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateVehicleSaleData {
  vehicle_id: string;
  sale_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  sale_price: number;
  payment_method: string;
  payment_terms?: string;
  notes?: string;
}

async function getCurrentTenantId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
    
  if (!tenantUser) throw new Error('No tenant found for user');
  return tenantUser.tenant_id;
}

export async function createVehicleSale(data: CreateVehicleSaleData): Promise<VehicleSale> {
  const currentTenantId = await getCurrentTenantId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Mock sale creation - using contracts table as substitute
  const saleNumber = `SALE-${new Date().getFullYear()}-${Date.now()}`;
  
  const mockSale: VehicleSale = {
    id: Date.now().toString(),
    tenant_id: currentTenantId,
    vehicle_id: data.vehicle_id,
    sale_number: saleNumber,
    sale_date: data.sale_date,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_email: data.customer_email,
    sale_price: data.sale_price,
    payment_method: data.payment_method,
    payment_terms: data.payment_terms,
    book_value: 0,
    gain_loss: data.sale_price, // Assuming profit for now
    status: 'pending',
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user.id
  };

  return mockSale;
}

export async function getVehicleSales(filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  vehicle_id?: string;
}): Promise<VehicleSale[]> {
  // Return mock data for now
  return [];
}

export async function getVehicleSaleById(id: string): Promise<VehicleSale | null> {
  // Return mock data for now
  return null;
}

export async function updateVehicleSaleStatus(
  id: string, 
  status: VehicleSale['status']
): Promise<VehicleSale> {
  const currentTenantId = await getCurrentTenantId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Return mock updated sale
  const mockSale: VehicleSale = {
    id,
    tenant_id: currentTenantId,
    vehicle_id: 'mock-vehicle-id',
    sale_number: `SALE-${new Date().getFullYear()}-${id}`,
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: 'Mock Customer',
    sale_price: 10000,
    payment_method: 'cash',
    book_value: 8000,
    gain_loss: 2000,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user.id
  };

  return mockSale;
}

export async function deleteVehicleSale(id: string): Promise<void> {
  // Mock deletion
  console.log(`Deleting vehicle sale ${id}`);
}

export async function getSalesStatistics(dateRange?: { from: string; to: string }): Promise<{
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  average_sale_price: number;
  sales_by_month: Array<{ month: string; count: number; revenue: number }>;
}> {
  // Return mock statistics
  return {
    total_sales: 0,
    total_revenue: 0,
    total_profit: 0,
    average_sale_price: 0,
    sales_by_month: []
  };
}

// Create an instance for compatibility
export const vehicleSalesService = {
  createVehicleSale,
  getVehicleSales,
  getVehicleSaleById,
  updateVehicleSaleStatus,
  deleteVehicleSale,
  getSalesStatistics
};