import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Clock, Target } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'contracts' | 'vehicles' | 'payments' | 'maintenance' | 'reports';
}

const DailyTasksChecklist = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "مراجعة العقود المنتهية",
      description: "مراجعة العقود التي تنتهي اليوم ومتابعة الإرجاع",
      completed: false,
      priority: "high",
      category: "contracts"
    },
    {
      id: "2",
      title: "فحص المركبات المرجعة",
      description: "فحص حالة المركبات وتوثيق أي أضرار",
      completed: true,
      priority: "high",
      category: "vehicles"
    },
    {
      id: "3",
      title: "متابعة المدفوعات المتأخرة",
      description: "الاتصال بالعملاء للمدفوعات المستحقة",
      completed: false,
      priority: "medium",
      category: "payments"
    },
    {
      id: "4",
      title: "تحديث جدول الصيانة",
      description: "مراجعة المركبات التي تحتاج صيانة دورية",
      completed: false,
      priority: "medium",
      category: "maintenance"
    },
    {
      id: "5",
      title: "إعداد تقرير يومي",
      description: "إعداد تقرير مبيعات وحجوزات اليوم",
      completed: false,
      priority: "low",
      category: "reports"
    }
  ]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const completionPercentage = Math.round((completedTasks / tasks.length) * 100);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    // يمكن إضافة أيقونات مختلفة حسب الفئة
    return <CheckSquare className="w-4 h-4" />;
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="space-y-3">
        <div className="rtl-header">
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {completedTasks}/{tasks.length}
            </div>
            <div className="text-xs text-muted-foreground">مكتملة</div>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground rtl-title">
            <span>مهام اليوم</span>
            <Target className="w-5 h-5" />
          </CardTitle>
        </div>
        
        <div className="space-y-2">
          <div className="rtl-header text-sm">
            <span className="font-medium text-foreground">{completionPercentage}%</span>
            <span className="text-muted-foreground">التقدم اليومي</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-2">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={`p-3 border rounded-lg transition-all hover:bg-muted/50 ${
                task.completed ? 'opacity-75 bg-muted/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${
                      task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {task.title}
                    </h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} bg-current`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rtl-header pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs hover-scale"
          >
            إضافة مهمة
          </Button>
          <div className="rtl-flex text-xs text-muted-foreground">
            <span>آخر تحديث: الآن</span>
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTasksChecklist;