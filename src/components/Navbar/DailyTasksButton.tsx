import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CheckSquare, 
  Square, 
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dailyTasksService, DailyTask } from '@/services/dailyTasksService';
import AddTaskDialog from './AddTaskDialog';
import { useAuth } from '@/contexts/AuthContext';

const DailyTasksButton = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const result = await dailyTasksService.getUserTasks();
      if (result.error) {
        throw result.error;
      }
      setTasks(result.data || []);
    } catch (error) {
      console.error('خطأ في جلب المهام:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب المهام",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const result = await dailyTasksService.updateTaskStatus(taskId, newStatus);
      if (result.error) {
        throw result.error;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));

      toast({
        title: "نجح",
        description: `تم ${newStatus === 'completed' ? 'إكمال' : 'إلغاء إكمال'} المهمة`
      });
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المهمة",
        variant: "destructive"
      });
    }
  };

  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Calendar className="w-3 h-3" />;
      default: return null;
    }
  };

  const canAddTasks = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2">
            <CheckSquare className="w-5 h-5" />
            {pendingTasks.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {pendingTasks.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-0" 
          align="end"
          side="bottom"
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-right">مهام اليوم</h3>
                <p className="text-sm text-muted-foreground text-right">
                  {completedTasks.length} من {tasks.length} مكتملة
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadTasks}
                  disabled={isLoading}
                  className="p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {canAddTasks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddDialog(true)}
                    className="p-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        
          <div className="max-h-96 overflow-y-auto">
            {/* المهام المعلقة */}
            {pendingTasks.length > 0 && (
              <div className="p-4 border-b">
                <h4 className="text-sm font-medium text-right mb-3 text-muted-foreground">
                  المهام المعلقة ({pendingTasks.length})
                </h4>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="mt-1"
                      >
                        <Square className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                      </button>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium leading-tight">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {task.due_time || 'غير محدد'}
                          </span>
                          <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المهام المكتملة */}
            {completedTasks.length > 0 && (
              <div className="p-4">
                <h4 className="text-sm font-medium text-right mb-3 text-muted-foreground">
                  المهام المكتملة ({completedTasks.length})
                </h4>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 opacity-60">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="mt-1"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </button>
                      <div className="flex-1 text-right">
                        <p className="text-sm line-through text-muted-foreground leading-tight">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {task.due_time || 'غير محدد'}
                          </span>
                          <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* رسالة عند عدم وجود مهام */}
            {tasks.length === 0 && (
              <div className="p-8 text-center">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  لا توجد مهام لهذا اليوم
                </p>
              </div>
            )}
          </div>

          {/* تقدم المهام */}
          {tasks.length > 0 && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>التقدم</span>
                <span>{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(completedTasks.length / tasks.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* نموذج إضافة مهمة جديدة */}
      <AddTaskDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={loadTasks}
      />
    </>
  );
};

export default DailyTasksButton;