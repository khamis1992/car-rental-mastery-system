import { supabase } from '@/integrations/supabase/client';

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_time?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to_all: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  employee_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_time?: string;
  due_date: string;
  assigned_to_all: boolean;
  employee_ids?: string[];
}

export const dailyTasksService = {
  // جلب المهام للمستخدم الحالي
  async getUserTasks(date?: string) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_tasks')
        .select(`
          *,
          task_assignments (
            id,
            status,
            completed_at,
            notes,
            employee:employees (
              id,
              first_name,
              last_name,
              employee_number
            )
          )
        `)
        .eq('due_date', targetDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب المهام:', error);
      return { data: null, error: error as Error };
    }
  },

  // جلب جميع الموظفين
  async getEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number, department, position')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
      return { data: null, error: error as Error };
    }
  },

  // إنشاء مهمة جديدة
  async createTask(taskData: CreateTaskData) {
    try {
      const { data: task, error: taskError } = await supabase
        .from('daily_tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_time: taskData.due_time,
          due_date: taskData.due_date,
          assigned_to_all: taskData.assigned_to_all
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // إذا كانت المهمة مخصصة لموظفين محددين
      if (!taskData.assigned_to_all && taskData.employee_ids && taskData.employee_ids.length > 0) {
        const assignments = taskData.employee_ids.map(employeeId => ({
          task_id: task.id,
          employee_id: employeeId
        }));

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      return { data: task, error: null };
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error);
      return { data: null, error: error as Error };
    }
  },

  // تحديث حالة المهمة
  async updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed') {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
      return { data: null, error: error as Error };
    }
  },

  // تحديث حالة تخصيص المهمة للموظف
  async updateAssignmentStatus(assignmentId: string, status: 'pending' | 'in_progress' | 'completed', notes?: string) {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في تحديث حالة تخصيص المهمة:', error);
      return { data: null, error: error as Error };
    }
  },

  // حذف مهمة
  async deleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error);
      return { success: false, error: error as Error };
    }
  }
};