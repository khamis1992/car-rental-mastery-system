import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Mail, 
  Phone, 
  User, 
  Building, 
  CreditCard,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddEmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  open,
  onOpenChange,
  onEmployeeAdded
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hireDate, setHireDate] = useState<Date>();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    position: '',
    department: '',
    salary: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_account_number: '',
    bank_name: '',
    address: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    const requiredFields = ['first_name', 'last_name', 'position', 'department', 'salary'];
    
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = true;
      }
    });

    if (!hireDate) {
      errors['hire_date'] = true;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors['email'] = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Generate employee number
      const { data: employeeNumberData } = await supabase.rpc('generate_employee_number');
      
      const employeeData = {
        employee_number: employeeNumberData,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        national_id: formData.national_id || null,
        position: formData.position,
        department: formData.department,
        department_id: formData.department || null,
        salary: parseFloat(formData.salary),
        hire_date: hireDate!.toISOString().split('T')[0],
        status: 'active' as const,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        bank_account_number: formData.bank_account_number || null,
        bank_name: formData.bank_name || null,
        address: formData.address || null
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'تم إضافة الموظف بنجاح',
        description: `تم إضافة ${formData.first_name} ${formData.last_name} إلى النظام`,
      });

      onEmployeeAdded(data as Employee);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        national_id: '',
        position: '',
        department: '',
        salary: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        bank_account_number: '',
        bank_name: '',
        address: ''
      });
      setHireDate(undefined);
      setFieldErrors({});
      setShowBankDetails(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'خطأ في إضافة الموظف',
        description: 'حدث خطأ أثناء إضافة الموظف، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (fieldName: string) => cn(
    "transition-all duration-200",
    fieldErrors[fieldName] && "border-destructive focus-visible:ring-destructive"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-background" dir="rtl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold text-right flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            إضافة موظف جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-1">
          {/* البيانات الأساسية */}
          <Card className="border-2 border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <User className="w-5 h-5" />
                البيانات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-1">
                    الاسم الأول
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={inputClassName('first_name')}
                    placeholder="أدخل الاسم الأول"
                  />
                  {fieldErrors.first_name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-1">
                    اسم العائلة
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={inputClassName('last_name')}
                    placeholder="أدخل اسم العائلة"
                  />
                  {fieldErrors.last_name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={inputClassName('email')}
                    placeholder="name@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      تنسيق البريد الإلكتروني غير صحيح
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+965 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_id">الرقم المدني</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    placeholder="123456789012"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    تاريخ التوظيف
                    <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !hireDate && "text-muted-foreground",
                          fieldErrors.hire_date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {hireDate ? format(hireDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={hireDate}
                        onSelect={setHireDate}
                        disabled={(date) => date > new Date()}
                        className="p-3 pointer-events-auto"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.hire_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  العنوان
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  placeholder="أدخل العنوان الكامل"
                />
              </div>
            </CardContent>
          </Card>

          {/* الوظيفة والراتب */}
          <Card className="border-2 border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                <Building className="w-5 h-5" />
                الوظيفة والراتب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-1">
                    المنصب
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={inputClassName('position')}
                    placeholder="مثال: مطور برمجيات"
                  />
                  {fieldErrors.position && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-1">
                    القسم
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger className={inputClassName('department')}>
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.department && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="flex items-center gap-1">
                    الراتب (د.ك)
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    className={inputClassName('salary')}
                    placeholder="1000.000"
                  />
                  {fieldErrors.salary && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      هذا الحقل مطلوب
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بيانات الاتصال والطوارئ */}
          <Card className="border-2 border-orange-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                بيانات الاتصال والطوارئ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">اسم جهة الاتصال الطارئ</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="اسم الشخص للاتصال في حالات الطوارئ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">رقم جهة الاتصال الطارئ</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="+965 12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بيانات البنك */}
          <Card className="border-2 border-green-200 shadow-sm">
            <CardHeader 
              className="pb-3 cursor-pointer" 
              onClick={() => setShowBankDetails(!showBankDetails)}
            >
              <CardTitle className="text-lg text-green-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  بيانات البنك (اختيارية)
                </div>
                {showBankDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showBankDetails && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">اسم البنك</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder="مثال: البنك الوطني الكويتي"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">رقم الحساب البنكي</Label>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                      placeholder="1234567890123456"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Separator />

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="min-w-[120px]"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px] bg-primary hover:bg-primary/90"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الموظف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};