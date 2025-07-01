import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { dailyTasksService, CreateTaskData } from '@/services/dailyTasksService';
import { 
  Plus, 
  Clock, 
  Users, 
  AlertTriangle, 
  User, 
  X,
  Loader2
} from 'lucide-react';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  department: string;
  position: string;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'medium',
    due_time: '',
    due_date: new Date().toISOString().split('T')[0],
    assigned_to_all: true,
    employee_ids: []
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { toast } = useToast();

  // جلب قائمة الموظفين
  useEffect(() => {
    if (isOpen && !formData.assigned_to_all) {
      loadEmployees();
    }
  }, [isOpen, formData.assigned_to_all]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const result = await dailyTasksService.getEmployees();
      if (result.error) {
        throw result.error;
      }
      setEmployees(result.data || []);
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب قائمة الموظفين",
        variant: "destructive"
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المهمة",
        variant: "destructive"
      });
      return;
    }

    if (!formData.assigned_to_all && selectedEmployees.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار موظف واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const taskData: CreateTaskData = {
        ...formData,
        employee_ids: formData.assigned_to_all ? undefined : selectedEmployees.map(emp => emp.id)
      };

      const result = await dailyTasksService.createTask(taskData);
      if (result.error) {
        throw result.error;
      }

      toast({
        title: "نجح",
        description: "تم إنشاء المهمة بنجاح"
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المهمة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_time: '',
      due_date: new Date().toISOString().split('T')[0],
      assigned_to_all: true,
      employee_ids: []
    });
    setSelectedEmployees([]);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && !selectedEmployees.find(emp => emp.id === employeeId)) {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
  };

  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employeeId));
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مهمة جديدة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* عنوان المهمة */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: مراجعة التقارير الشهرية"
              required
            />
          </div>

          {/* وصف المهمة */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="تفاصيل إضافية حول المهمة..."
              rows={3}
            />
          </div>

          {/* الأولوية والوقت */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon('high')}
                      عالية
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon('medium')}
                      متوسطة
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon('low')}
                      منخفضة
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">الوقت المحدد</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          {/* تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* تخصيص المهمة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assigned_to_all">تخصيص للجميع</Label>
                <p className="text-sm text-muted-foreground">
                  تخصيص المهمة لجميع الموظفين
                </p>
              </div>
              <Switch
                id="assigned_to_all"
                checked={formData.assigned_to_all}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, assigned_to_all: checked });
                  if (checked) {
                    setSelectedEmployees([]);
                  }
                }}
              />
            </div>

            {/* اختيار الموظفين المحددين */}
            {!formData.assigned_to_all && (
              <div className="space-y-3">
                <Label>اختيار الموظفين</Label>
                
                {/* قائمة اختيار الموظفين */}
                <Select onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موظف..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEmployees ? (
                      <div className="flex items-center gap-2 p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري التحميل...
                      </div>
                    ) : (
                      employees
                        .filter(emp => !selectedEmployees.find(selected => selected.id === emp.id))
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <div>
                                <p className="font-medium">
                                  {employee.first_name} {employee.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {employee.department} - {employee.position}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>

                {/* الموظفين المختارين */}
                {selectedEmployees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">الموظفين المختارين:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((employee) => (
                        <Badge
                          key={employee.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {employee.first_name} {employee.last_name}
                          <button
                            type="button"
                            onClick={() => removeEmployee(employee.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء المهمة
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;