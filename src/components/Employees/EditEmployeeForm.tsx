import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { User, Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as Kuwait phone number (+965 xxxx xxxx)
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
  };

  const handleViewProfile = () => {
    if (!employee) return;
    
    toast({
      title: 'البطاقة الشخصية للموظف',
      description: `${employee.first_name} ${employee.last_name} - ${employee.position}`,
    });
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
        title: '✅ تم تحديث بيانات الموظف بنجاح',
        description: 'تم حفظ جميع التغييرات بنجاح',
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleViewProfile}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              عرض البطاقة الشخصية
            </Button>
            <div className="text-right">
              <DialogTitle className="text-2xl font-bold text-gray-800">
                تعديل بيانات الموظف
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                قم بتحديث المعلومات الشخصية والوظيفية للموظف
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 🧍‍♂️ بطاقة المعلومات الشخصية */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                <CardHeader className="bg-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <User className="w-6 h-6" />
                    🧍‍♂️ المعلومات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">الاسم الأول *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">الاسم الأخير *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel"
                              placeholder="+965 xxxx xxxx"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                field.onChange(formatted);
                              }}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">الرقم المدني</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">الحالة *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500">
                                <SelectValue placeholder="اختر الحالة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
                              <SelectItem value="active" className="flex items-center gap-2">
                                🟢 نشط
                              </SelectItem>
                              <SelectItem value="inactive" className="flex items-center gap-2">
                                🟡 غير نشط
                              </SelectItem>
                              <SelectItem value="terminated" className="flex items-center gap-2">
                                🔴 منتهي الخدمة
                              </SelectItem>
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
                        <FormLabel className="font-semibold text-gray-700">العنوان</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="مثال: الكويت، محافظة الجهراء، منطقة تيماء، قطعة 4، شارع 12، منزل 15"
                            rows={3}
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* جهة الاتصال الطارئ */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                      جهة الاتصال الطارئ
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">اسم جهة الاتصال</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
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
                            <FormLabel className="font-semibold text-gray-700">رقم هاتف جهة الاتصال</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel"
                                {...field}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  field.onChange(formatted);
                                }}
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 💼 بطاقة المعلومات الوظيفية */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
                <CardHeader className="bg-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Briefcase className="w-6 h-6" />
                    💼 المعلومات الوظيفية
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">المنصب *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
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
                          <FormLabel className="font-semibold text-gray-700">القسم</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-green-500">
                                <SelectValue placeholder="اختر القسم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-gray-300 shadow-lg z-50">
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
                          <FormLabel className="font-semibold text-gray-700">الراتب (د.ك) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* المعلومات البنكية */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                      المعلومات البنكية
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">اسم البنك</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
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
                            <FormLabel className="font-semibold text-gray-700">رقم الحساب البنكي</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};