import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FixedAsset, AssetMaintenance, AssetLocation, AssetMovement } from '@/repositories/interfaces/IFixedAssetRepository';
import { toast } from 'sonner';

export const useFixedAssets = () => {
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['fixed-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .select(`
          *,
          asset_categories!left(category_name),
          asset_locations!left(location_name),
          departments!left(department_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['asset-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_locations')
        .select('*')
        .eq('is_active', true)
        .order('location_name');
      
      if (error) throw error;
      return data as AssetLocation[];
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createAsset = useMutation({
    mutationFn: async (asset: any) => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .insert(asset)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم إضافة الأصل بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ في إضافة الأصل: ' + error.message);
    }
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم تحديث الأصل بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ في تحديث الأصل: ' + error.message);
    }
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fixed_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('تم حذف الأصل بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ في حذف الأصل: ' + error.message);
    }
  });

  return {
    assets,
    locations,
    categories,
    isLoading,
    createAsset,
    updateAsset,
    deleteAsset
  };
};

export const useAssetMaintenance = (assetId?: string) => {
  const queryClient = useQueryClient();

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['asset-maintenance', assetId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_maintenance')
        .select('*')
        .order('scheduled_date', { ascending: false });
      
      if (assetId) {
        query = query.eq('vehicle_id', assetId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AssetMaintenance[];
    },
    enabled: !!assetId || assetId === undefined
  });

  const { data: maintenanceCategories } = useQuery({
    queryKey: ['maintenance-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMaintenance = useMutation({
    mutationFn: async (maintenance: any) => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .insert(maintenance)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      toast.success('تم إضافة سجل الصيانة بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ في إضافة سجل الصيانة: ' + error.message);
    }
  });

  return {
    maintenanceRecords,
    maintenanceCategories,
    isLoading,
    createMaintenance
  };
};

export const useAssetMovements = (assetId?: string) => {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['asset-movements', assetId],
    queryFn: async () => {
      let query = supabase
        .from('asset_movement_history')
        .select(`
          *,
          from_location:asset_locations!from_location_id(location_name),
          to_location:asset_locations!to_location_id(location_name)
        `)
        .order('movement_date', { ascending: false });
      
      if (assetId) {
        query = query.eq('asset_id', assetId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AssetMovement[];
    },
    enabled: !!assetId || assetId === undefined
  });

  return {
    movements,
    isLoading
  };
};