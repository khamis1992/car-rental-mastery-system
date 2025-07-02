import React, { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Package, Hash, Layers } from 'lucide-react';
import { type VehicleFormData } from './types';
import { supabase } from '@/integrations/supabase/client';

interface AssetInfoSectionProps {
  control: Control<VehicleFormData>;
}

interface AssetHierarchy {
  code: string;
  name_ar: string;
  name_en: string;
  level: number;
}

export const AssetInfoSection: React.FC<AssetInfoSectionProps> = ({ control }) => {
  const [assetCode, setAssetCode] = useState<string>('');
  const [hierarchyPath, setHierarchyPath] = useState<string>('');
  
  // مراقبة تغييرات نوع المركبة والماركة والموديل
  const vehicleType = useWatch({ control, name: 'vehicle_type' });
  const make = useWatch({ control, name: 'make' });
  const model = useWatch({ control, name: 'model' });

  // دالة لتحديد رمز التسلسل الهرمي
  const getHierarchyCode = (type: string): string => {
    switch (type) {
      case 'sedan': return '111';
      case 'suv': return '112';
      case 'hatchback': return '113';
      case 'van': return '121';
      case 'pickup': return '122';
      case 'coupe': return '131';
      case 'luxury': return '132';
      default: return '111';
    }
  };

  // دالة لبناء مسار التسلسل الهرمي
  const buildHierarchyPath = async (code: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('asset_code_hierarchy')
        .select('code, name_ar, parent_code')
        .eq('code', code)
        .single();

      if (error || !data) return '';

      const path = [data.name_ar];
      
      // البحث عن المستويات العليا
      let currentCode = data.parent_code;
      while (currentCode) {
        const { data: parentData } = await supabase
          .from('asset_code_hierarchy')
          .select('name_ar, parent_code')
          .eq('code', currentCode)
          .single();
        
        if (parentData) {
          path.unshift(parentData.name_ar);
          currentCode = parentData.parent_code;
        } else {
          break;
        }
      }

      return path.join(' > ');
    } catch (error) {
      console.error('خطأ في بناء مسار التسلسل الهرمي:', error);
      return '';
    }
  };

  // تحديث رمز الأصل عند تغيير البيانات
  useEffect(() => {
    const updateAssetCode = async () => {
      if (vehicleType && make && model) {
        try {
          const hierarchyCode = getHierarchyCode(vehicleType);
          
          // الحصول على الرقم التسلسلي التالي
          const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select('asset_sequence_number')
            .eq('asset_code_hierarchy', hierarchyCode)
            .order('asset_sequence_number', { ascending: false })
            .limit(1);

          if (error) {
            console.error('خطأ في الحصول على الرقم التسلسلي:', error);
            return;
          }

          const nextSequence = vehicles && vehicles.length > 0 
            ? (vehicles[0].asset_sequence_number || 0) + 1 
            : 1;
          
          const fullAssetCode = `${hierarchyCode}-${String(nextSequence).padStart(4, '0')}`;
          setAssetCode(fullAssetCode);

          // بناء مسار التسلسل الهرمي
          const path = await buildHierarchyPath(hierarchyCode);
          setHierarchyPath(path);
        } catch (error) {
          console.error('خطأ في تحديث رمز الأصل:', error);
        }
      } else {
        setAssetCode('');
        setHierarchyPath('');
      }
    };

    updateAssetCode();
  }, [vehicleType, make, model]);

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        معلومات الأصل
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* رمز الأصل الهرمي */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">رمز الأصل الهرمي</label>
          <div className="relative">
            <Hash className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="سيتم التوليد تلقائياً"
              className="h-12 pr-10 bg-background/60 border-border/60"
              value={assetCode}
              readOnly
            />
          </div>
        </div>

        {/* مسار التسلسل الهرمي */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">التصنيف الهرمي</label>
          <div className="relative">
            <Layers className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="سيتم التحديد تلقائياً"
              className="h-12 pr-10 bg-background/60 border-border/60"
              value={hierarchyPath}
              readOnly
            />
          </div>
          {hierarchyPath && (
            <p className="text-xs text-muted-foreground">
              يتم تحديد التصنيف بناءً على نوع المركبة المختار
            </p>
          )}
        </div>
      </div>

      {assetCode && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-medium text-primary">معاينة رمز الأصل:</span>
            <span className="font-mono text-foreground">{assetCode}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            الرمز مؤقت وسيتم تأكيده عند حفظ المركبة
          </p>
        </div>
      )}
    </div>
  );
};