import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';

const editEmployeeSchema = z.object({
  first_name: z.string().min(1, 'الاسم الأول مطلوب'),
  last_name: z.string().min(1, 'الاسم الأخير مطلوب'),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().min(1, 'المنصب مطلوب'),
  department: z.string().min(1, 'القسم مطلوب'),
  department_id: z.string().optional(),
  salary: z.number().min(0, 'الراتب يجب أن يكون رقم موجب'),
  status: z.enum(['active', 'inactive', 'terminated']),
  national_id: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEmployeeUpdated: (updatedEmployee: Employee) => void;
}

export const EditEmployeeForm: React.FC<EditEmployeeFormProps> = ({
  open,
  onOpenChange,
  employee,
  onEmployeeUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      department_id: '',
      salary: 0,
      status: 'active',
      national_id: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      bank_name: '',
      bank_account_number: '',
    }
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (employee && open) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position,
        department: employee.department,
        department_id: employee.department_id || '',
        salary: employee.salary,
        status: employee.status,
        national_id: employee.national_id || '',
        address: employee.address || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        bank_name: employee.bank_name || '',
        bank_account_number: employee.bank_account_number || '',
      });
    }
  }, [employee, open, form]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('is_active', true)
        .order('department_name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const onSubmit = async (data: EditEmployeeFormData) => {
    if (!employee) return;

    setLoading(true);
    try {
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || null,
          phone: data.phone || null,
          position: data.position,
          department: data.department,
          department_id: data.department_id || null,
          salary: data.salary,
          status: data.status,
          national_id: data.national_id || null,
          address: data.address || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          bank_name: data.bank_name || null,
          bank_account_number: data.bank_account_number || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id)
        .select(`
          *,
          department:department_id (
            department_name
          )
        `)
        .single();

      if (error) throw error;

      onEmployeeUpdated(updatedEmployee as Employee);
      onOpenChange(false);
      
      toast({
        title: 'تم تحديث الموظف بنجاح',
        description: 'تم حفظ التغييرات على بيانات الموظف',
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'خطأ في تحديث الموظف',
        description: 'حدث خطأ أثناء حفظ التغييرات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            تعديل بيانات الموظف
          </DialogTitle>
          <DialogDescription className="text-right">
            قم بتحديث المعلومات الشخصية والوظيفية للموظف
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* المعلومات الشخصية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">المعلومات الشخصية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأخير *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم المدني</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                          <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* المعلومات الوظيفية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">المعلومات الوظيفية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنصب *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القسم</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.department_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الراتب (د.ك) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* جهة الاتصال الطارئ */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">جهة الاتصال الطارئ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم جهة الاتصال</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هاتف جهة الاتصال</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* المعلومات البنكية */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">المعلومات البنكية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم البنك</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الحساب البنكي</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};