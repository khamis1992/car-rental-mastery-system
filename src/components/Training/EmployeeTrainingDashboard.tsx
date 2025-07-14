import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, Clock, Award, BookOpen } from 'lucide-react';
import { trainingSystemService, TrainingMaterial, EmployeeTrainingProgress } from '@/services/trainingSystemService';
import { useToast } from '@/hooks/use-toast';

export const EmployeeTrainingDashboard: React.FC = () => {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    setLoading(true);
    try {
      // جلب مواد التدريب
      const { data: materialsData } = await trainingSystemService.getTrainingMaterials();
      setMaterials(materialsData || []);

      // جلب الإحصائيات
      const { data: statsData } = await trainingSystemService.getTrainingStatistics();
      setStatistics(statsData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات التدريب:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async (materialId: string) => {
    try {
      // الحصول على معرف الموظف (مؤقتاً نستخدم قيمة افتراضية)
      const employeeId = 'temp-employee-id';
      
      const { error } = await trainingSystemService.startTrainingMaterial(employeeId, materialId);
      if (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في بدء التدريب',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم البدء',
        description: 'تم بدء التدريب بنجاح',
      });

      loadTrainingData();
    } catch (error) {
      console.error('خطأ في بدء التدريب:', error);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'quiz': return <Award className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات التدريب */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{statistics.total_courses}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الدورات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{statistics.completed}</p>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{statistics.in_progress}</p>
                  <p className="text-sm text-muted-foreground">قيد التقدم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(statistics.average_score)}%</p>
                  <p className="text-sm text-muted-foreground">متوسط النتائج</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* مواد التدريب المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle>مواد التدريب المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(material.content_type)}
                          <h3 className="font-medium text-sm">{material.title}</h3>
                        </div>
                        {material.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">
                            إجباري
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {material.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDifficultyColor(material.difficulty_level)}`}></div>
                          <span className="text-xs text-muted-foreground">
                            {material.difficulty_level === 'beginner' ? 'مبتدئ' : 
                             material.difficulty_level === 'intermediate' ? 'متوسط' : 'متقدم'}
                          </span>
                        </div>
                        
                        {material.duration_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {material.duration_minutes} دقيقة
                          </span>
                        )}
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {material.category}
                      </Badge>

                      <Button
                        size="sm"
                        onClick={() => startTraining(material.id)}
                        className="w-full"
                      >
                        <Play className="w-3 h-3 mr-2" />
                        بدء التدريب
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد مواد تدريبية</h3>
              <p className="text-sm text-muted-foreground">
                ستظهر مواد التدريب المتاحة هنا عند إضافتها
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};