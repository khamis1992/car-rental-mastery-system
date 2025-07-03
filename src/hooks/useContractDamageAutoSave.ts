import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DamageArea } from '@/components/Contracts/VehicleDiagram/VehicleDiagramInteractive';

interface UseContractDamageAutoSaveProps {
  contractId: string;
  type: 'pickup' | 'return';
  enabled?: boolean;
}

interface AutoSaveState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const useContractDamageAutoSave = ({ 
  contractId, 
  type, 
  enabled = true 
}: UseContractDamageAutoSaveProps) => {
  const [state, setState] = useState<AutoSaveState>({
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    error: null
  });
  
  const { toast } = useToast();

  // Load existing damages from database
  const loadDamages = useCallback(async (): Promise<DamageArea[]> => {
    if (!enabled) return [];
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const field = type === 'pickup' ? 'pickup_damages' : 'return_damages';
      
      const { data, error } = await supabase
        .from('contracts')
        .select(field)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      const damages = data?.[field] as DamageArea[] || [];
      console.log(`📂 Loaded ${damages.length} existing ${type} damages from database`);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return damages;
      
    } catch (error) {
      console.error('❌ Error loading damages:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'فشل في تحميل الأضرار المحفوظة' 
      }));
      return [];
    }
  }, [contractId, type, enabled]);

  // Save damages to database
  const saveDamages = useCallback(async (damages: DamageArea[]): Promise<boolean> => {
    if (!enabled) return true;
    
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      const field = type === 'pickup' ? 'pickup_damages' : 'return_damages';
      
      const { error } = await supabase
        .from('contracts')
        .update({
          [field]: JSON.parse(JSON.stringify(damages)), // Convert to Json
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
      
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));
      
      console.log(`✅ Auto-saved ${damages.length} ${type} damages successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Error auto-saving damages:', error);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: 'فشل في حفظ الأضرار تلقائياً' 
      }));
      
      toast({
        title: "خطأ في الحفظ التلقائي",
        description: "فشل في حفظ الأضرار. سيتم المحاولة مرة أخرى عند إجراء التغيير التالي.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [contractId, type, enabled, toast]);

  // Auto-save with debouncing
  const autoSave = useCallback(async (damages: DamageArea[]) => {
    if (!enabled) return;
    
    // Debounce auto-save by 1 second
    const timeoutId = setTimeout(async () => {
      await saveDamages(damages);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [saveDamages, enabled]);

  // Clear error after some time
  useEffect(() => {
    if (state.error) {
      const timeout = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [state.error]);

  return {
    ...state,
    loadDamages,
    saveDamages,
    autoSave,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
};