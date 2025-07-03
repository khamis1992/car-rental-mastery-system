import { useState, useCallback, useEffect, useRef } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load existing damages from database
  const loadDamages = useCallback(async (): Promise<DamageArea[]> => {
    if (!enabled || !contractId) return [];
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const field = type === 'pickup' ? 'pickup_damages' : 'return_damages';
      
      // Check if signal was aborted before making request
      if (signal.aborted) {
        console.log('🔄 Request aborted before execution');
        return [];
      }
      
      const { data, error } = await supabase
        .from('contracts')
        .select(field)
        .eq('id', contractId)
        .abortSignal(signal)
        .single();

      // Check again after the request
      if (signal.aborted) {
        console.log('🔄 Request was aborted during execution');
        return [];
      }

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('abort')) {
          console.log('🔄 Request cancelled due to abort');
          return [];
        }
        throw error;
      }

      const damages = data?.[field] as DamageArea[] || [];
      console.log(`📂 Loaded ${damages.length} existing ${type} damages from database`);
      
      // Only update state if not aborted
      if (!signal.aborted) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      return damages;
      
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Load request was cancelled:', error.message);
        return [];
      }
      
      console.error('❌ Error loading damages:', error);
      
      // Only set error state if component is still mounted and not aborted
      if (!signal.aborted) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'فشل في تحميل الأضرار المحفوظة' 
        }));
      }
      return [];
    }
  }, [contractId, type, enabled]);

  // Save damages to database
  const saveDamages = useCallback(async (damages: DamageArea[]): Promise<boolean> => {
    if (!enabled || !contractId) return true;
    
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

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('abort')) {
          console.log('🔄 Save request was cancelled');
          setState(prev => ({ ...prev, isSaving: false }));
          return false;
        }
        throw error;
      }
      
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));
      
      console.log(`✅ Auto-saved ${damages.length} ${type} damages successfully`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Error auto-saving damages:', error);
      
      // Don't show toast for aborted requests
      if (error.name !== 'AbortError' && !error.message?.includes('abort')) {
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
      } else {
        setState(prev => ({ ...prev, isSaving: false }));
      }
      
      return false;
    }
  }, [contractId, type, enabled, toast]);

  // Auto-save with debouncing
  const autoSave = useCallback(async (damages: DamageArea[]) => {
    if (!enabled || !contractId) return;
    
    // Cancel previous auto-save if still pending
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce auto-save by 1 second
    timeoutRef.current = setTimeout(async () => {
      // Check if still enabled and mounted before saving
      if (enabled && contractId) {
        await saveDamages(damages);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [saveDamages, enabled, contractId]);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🧹 Cleanup: Aborted pending requests');
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log('🧹 Cleanup: Cleared pending auto-save timeout');
      }
    };
  }, []);
  
  // Cleanup when contractId or type changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [contractId, type]);

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