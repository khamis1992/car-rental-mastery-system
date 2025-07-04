import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Clock, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { dailyTasksService, DailyTask } from "@/services/dailyTasksService";
import { useToast } from "@/hooks/use-toast";

const DailyTasksChecklist = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const result = await dailyTasksService.getUserTasks();
      if (result.error) {
        console.error('Error loading tasks:', result.error);
        // Load fallback tasks if no data is available
        setTasks([]);
      } else {
        setTasks(result.data || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const result = await dailyTasksService.updateTaskStatus(taskId, newStatus);
      if (result.error) {
        toast({
          title: "خطأ",
          description: "فشل في تحديث حالة المهمة",
          variant: "destructive",
        });
        return;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المهمة",
        variant: "destructive",
      });
    }
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
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            جاري تحميل المهام...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مهام لليوم
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`p-3 border rounded-lg transition-all hover:bg-muted/50 ${
                  task.status === 'completed' ? 'opacity-75 bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task.title}
                      </h4>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} bg-current`} />
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    {task.due_time && (
                      <p className="text-xs text-muted-foreground mt-1">
                        الوقت: {task.due_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rtl-header pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs hover-scale"
            onClick={loadTasks}
            disabled={loading}
          >
            تحديث
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