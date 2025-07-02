import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViolationsList } from '@/components/Violations/ViolationsList';
import { ViolationForm } from '@/components/Violations/ViolationForm';
import { ViolationStats } from '@/components/Violations/ViolationStats';
import { ViolationTypesManagement } from '@/components/Violations/ViolationTypesManagement';
import { ViolationDetailsDialog } from '@/components/Violations/ViolationDetailsDialog';
import { violationService } from '@/services/violationService';
import { ViolationWithDetails, ViolationStats as ViolationStatsType } from '@/types/violation';
import { useToast } from '@/hooks/use-toast';

const TrafficViolations = () => {
  const [violations, setViolations] = useState<ViolationWithDetails[]>([]);
  const [stats, setStats] = useState<ViolationStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [violationFormOpen, setViolationFormOpen] = useState(false);
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
  const [violationDetailsOpen, setViolationDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('violations');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [violationsData, statsData] = await Promise.all([
        violationService.getViolations(),
        violationService.getViolationStats()
      ]);
      
      setViolations(violationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading violations data:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل بيانات المخالفات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViolationCreated = () => {
    loadData();
    setViolationFormOpen(false);
    toast({
      title: 'تم إنشاء المخالفة',
      description: 'تم إنشاء المخالفة المرورية بنجاح'
    });
  };

  const handleDetermineLiability = async (
    id: string, 
    liability: 'customer' | 'company' | 'shared',
    percentage: number,
    reason?: string
  ) => {
    try {
      await violationService.determineViolationLiability(id, liability, percentage, reason);
      loadData();
      toast({
        title: 'تم تحديد المسؤولية',
        description: 'تم تحديد مسؤولية المخالفة بنجاح'
      });
    } catch (error) {
      console.error('Error determining liability:', error);
      toast({
        title: 'خطأ في تحديد المسؤولية',
        description: 'حدث خطأ أثناء تحديد مسؤولية المخالفة',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsNotified = async (id: string) => {
    try {
      await violationService.markAsNotified(id);
      loadData();
      toast({
        title: 'تم تحديث الحالة',
        description: 'تم تحديث حالة المخالفة إلى "تم الإشعار"'
      });
    } catch (error) {
      console.error('Error marking as notified:', error);
      toast({
        title: 'خطأ في تحديث الحالة',
        description: 'حدث خطأ أثناء تحديث حالة المخالفة',
        variant: 'destructive'
      });
    }
  };

  const pendingViolations = violations.filter(v => 
    v.liability_determination === 'pending' || 
    (v.status === 'pending' && v.payment_status === 'unpaid')
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة المخالفات المرورية</h1>
          <p className="text-muted-foreground">إدارة المخالفات المرورية وتحديد المسؤولية والمتابعة</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setViolationFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            مخالفة جديدة
          </Button>
        </div>
      </div>

      {/* تنبيه المخالفات المعلقة */}
      {pendingViolations.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <h3 className="font-medium text-warning">مخالفات تحتاج متابعة</h3>
                <p className="text-sm text-muted-foreground">
                  يوجد {pendingViolations.length} مخالفة تحتاج إلى تحديد المسؤولية أو المتابعة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات سريعة */}
      {stats && <ViolationStats stats={stats} />}

      {/* علامات التبويب */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="text-right">التقارير</TabsTrigger>
          <TabsTrigger value="violation-types" className="text-right">أنواع المخالفات</TabsTrigger>
          <TabsTrigger value="violations" className="text-right">المخالفات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="violations" className="space-y-6">
          <ViolationsList
            violations={violations}
            onView={(id) => {
              setSelectedViolationId(id);
              setViolationDetailsOpen(true);
            }}
            onDetermineLiability={handleDetermineLiability}
            onMarkAsNotified={handleMarkAsNotified}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="violation-types" className="space-y-6">
          <ViolationTypesManagement onUpdate={loadData} />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقارير المخالفات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">قريباً... سيتم إضافة التقارير التفصيلية</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج إنشاء مخالفة */}
      <ViolationForm
        open={violationFormOpen}
        onOpenChange={setViolationFormOpen}
        onSuccess={handleViolationCreated}
      />

      {/* تفاصيل المخالفة */}
      <ViolationDetailsDialog
        violationId={selectedViolationId}
        open={violationDetailsOpen}
        onOpenChange={setViolationDetailsOpen}
        onUpdate={loadData}
      />
    </div>
  );
};

export default TrafficViolations;