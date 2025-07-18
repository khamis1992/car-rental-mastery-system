import { supabase } from "@/integrations/supabase/client";
import type { ExpenseCategory, CreateExpenseCategoryForm } from "@/types/expense";

export class ExpenseCategoryService {
  // جلب جميع فئات المصروفات
  static async getAll(tenantId?: string): Promise<any[]> {
    let query = supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_code');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('خطأ في جلب فئات المصروفات:', error);
      throw new Error(`فشل في جلب فئات المصروفات: ${error.message}`);
    }

    return data || [];
  }

  // جلب فئة مصروفات محددة
  static async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('خطأ في جلب فئة المصروفات:', error);
      return null;
    }

    return data;
  }

  // جلب الفئات الرئيسية فقط
  static async getMainCategories(tenantId?: string): Promise<any[]> {
    let query = supabase
      .from('expense_categories')
      .select('*')
      .is('parent_category_id', null)
      .eq('is_active', true)
      .order('category_code');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('خطأ في جلب الفئات الرئيسية:', error);
      throw new Error(`فشل في جلب الفئات الرئيسية: ${error.message}`);
    }

    return data || [];
  }

  // إنشاء فئة مصروفات جديدة
  static async create(category: CreateExpenseCategoryForm & { tenant_id: string }): Promise<any> {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('خطأ في إنشاء فئة المصروفات:', error);
      throw new Error(`فشل في إنشاء فئة المصروفات: ${error.message}`);
    }

    return data;
  }

  // تحديث فئة مصروفات
  static async update(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('expense_categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث فئة المصروفات:', error);
      throw new Error(`فشل في تحديث فئة المصروفات: ${error.message}`);
    }

    return data;
  }

  // حذف فئة مصروفات (إلغاء تفعيل)
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expense_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('خطأ في حذف فئة المصروفات:', error);
      throw new Error(`فشل في حذف فئة المصروفات: ${error.message}`);
    }
  }

  // البحث في الفئات
  static async search(searchTerm: string, tenantId?: string): Promise<any[]> {
    let query = supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    query = query.or(`category_name_ar.ilike.%${searchTerm}%,category_name_en.ilike.%${searchTerm}%,category_code.ilike.%${searchTerm}%`);

    const { data, error } = await query.order('category_code');

    if (error) {
      console.error('خطأ في البحث عن الفئات:', error);
      throw new Error(`فشل في البحث عن الفئات: ${error.message}`);
    }

    return data || [];
  }
}