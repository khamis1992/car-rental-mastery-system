import { IRepository } from './IRepository';

export interface FixedAsset {
  id: string;
  tenant_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_en?: string;
  asset_type: 'building' | 'equipment' | 'vehicle' | 'furniture' | 'computer' | 'other';
  category_id?: string;
  location_id?: string;
  department_id?: string;
  employee_id?: string;
  purchase_date: string;
  purchase_cost: number;
  supplier_name?: string;
  invoice_number?: string;
  useful_life_years: number;
  depreciation_method: 'straight_line' | 'declining_balance';
  residual_value: number;
  current_book_value: number;
  accumulated_depreciation: number;
  current_location?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'active' | 'disposed' | 'under_maintenance' | 'retired';
  warranty_expiry?: string;
  insurance_details?: string;
  maintenance_schedule?: string;
  barcode?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  disposal_date?: string;
  disposal_reason?: string;
  disposal_amount?: number;
  notes?: string;
  photos?: string[];
  documents?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AssetMaintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  cost: number;
  mileage_at_service?: number;
  scheduled_date?: string;
  completed_date?: string;
  next_service_date?: string;
  service_provider?: string;
  invoice_number?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AssetLocation {
  id: string;
  location_code: string;
  location_name: string;
  address?: string;
  responsible_person?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  from_location_id?: string;
  to_location_id?: string;
  movement_date: string;
  movement_reason?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface MaintenanceCategory {
  id: string;
  category_name: string;
  default_frequency_months: number;
  is_critical: boolean;
  estimated_cost: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface IFixedAssetRepository extends IRepository<FixedAsset> {
  getByAssetCode(assetCode: string): Promise<FixedAsset | null>;
  getByCategory(categoryId: string): Promise<FixedAsset[]>;
  getByLocation(locationId: string): Promise<FixedAsset[]>;
  getByStatus(status: string): Promise<FixedAsset[]>;
  getByEmployee(employeeId: string): Promise<FixedAsset[]>;
  searchAssets(query: string): Promise<FixedAsset[]>;
  getDepreciationSchedule(assetId: string): Promise<any[]>;
  calculateCurrentValue(assetId: string): Promise<number>;
  generateAssetCode(): Promise<string>;
  getMaintenanceHistory(assetId: string): Promise<AssetMaintenance[]>;
  getMovementHistory(assetId: string): Promise<AssetMovement[]>;
  getAssetsByMaintenanceDue(days: number): Promise<FixedAsset[]>;
}