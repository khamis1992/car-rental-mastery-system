import { supabase } from '@/integrations/supabase/client';

// أنواع البيانات للتدريب
export interface TrainingMaterial {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'document' | 'quiz' | 'interactive';
  content_url?: string;
  content_data?: any;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  prerequisites?: string[];
  learning_objectives?: string[];
  is_mandatory: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface EmployeeTrainingProgress {
  id: string;
  employee_id: string;
  material_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  score?: number;
  attempts_count: number;
  time_spent_minutes: number;
  last_accessed_at?: string;
  notes?: string;
}

export const trainingSystemService = {
  // جلب جميع مواد التدريب
  async getTrainingMaterials(category?: string) {
    try {
      let query = supabase
        .from('training_materials')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return { data: data as TrainingMaterial[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // جلب تقدم الموظف في التدريب
  async getEmployeeProgress(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('employee_training_progress')
        .select(`
          *,
          training_materials (
            id,
            title,
            description,
            content_type,
            duration_minutes,
            difficulty_level,
            category,
            is_mandatory
          )
        `)
        .eq('employee_id', employeeId)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // بدء مادة تدريبية
  async startTrainingMaterial(employeeId: string, materialId: string) {
    try {
      const { data, error } = await supabase
        .from('employee_training_progress')
        .upsert({
          employee_id: employeeId,
          material_id: materialId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          attempts_count: 1
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // تحديث تقدم التدريب
  async updateProgress(
    employeeId: string, 
    materialId: string, 
    progressPercentage: number,
    timeSpentMinutes: number = 0
  ) {
    try {
      const updateData: any = {
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString(),
        time_spent_minutes: timeSpentMinutes
      };

      if (progressPercentage >= 100) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('employee_training_progress')
        .update(updateData)
        .eq('employee_id', employeeId)
        .eq('material_id', materialId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // تسجيل نتيجة اختبار
  async recordQuizScore(
    employeeId: string, 
    materialId: string, 
    score: number, 
    passed: boolean
  ) {
    try {
      const status = passed ? 'completed' : 'failed';
      
      const { data, error } = await supabase
        .from('employee_training_progress')
        .update({
          score,
          status,
          progress_percentage: passed ? 100 : 0,
          completed_at: passed ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('material_id', materialId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // جلب الإحصائيات العامة للتدريب
  async getTrainingStatistics(employeeId?: string) {
    try {
      let query = supabase
        .from('employee_training_progress')
        .select('status, score, time_spent_minutes');

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total_courses: data.length,
        completed: data.filter(p => p.status === 'completed').length,
        in_progress: data.filter(p => p.status === 'in_progress').length,
        not_started: data.filter(p => p.status === 'not_started').length,
        average_score: data.filter(p => p.score).reduce((sum, p) => sum + (p.score || 0), 0) / data.filter(p => p.score).length || 0,
        total_time_spent: data.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0)
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // إنشاء مادة تدريبية جديدة (للمديرين)
  async createTrainingMaterial(materialData: Omit<TrainingMaterial, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('training_materials')
        .insert([{
          ...materialData,
          tenant_id: 'current' // سيتم ضبطه تلقائياً بواسطة RLS
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // جلب فئات التدريب المتاحة
  async getTrainingCategories() {
    try {
      const { data, error } = await supabase
        .from('training_materials')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;
      
      const categories = [...new Set(data.map(item => item.category))];
      return { data: categories, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};