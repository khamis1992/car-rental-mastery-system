import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Play, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { contractService } from '@/services/contractService';
import { supabase } from '@/integrations/supabase/client';

interface ContractActionsProps {
  contract: {
    id: string;
    status: string;
    contract_number: string;
    customer_name: string;
    vehicle_info: string;
  };
  onUpdate: () => void;
}

export const ContractActions: React.FC<ContractActionsProps> = ({ contract, onUpdate }) => {
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [activateData, setActivateData] = useState({
    actualStartDate: new Date(),
    pickupMileage: '',
  });

  const [completeData, setCompleteData] = useState({
    actualEndDate: new Date(),
    returnMileage: '',
    fuelLevelReturn: '',
    notes: '',
  });

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await contractService.activateContract(
        contract.id,
        format(activateData.actualStartDate, 'yyyy-MM-dd'),
        activateData.pickupMileage ? parseInt(activateData.pickupMileage) : undefined
      );

      toast({
        title: 'تم تفعيل العقد بنجاح',
        description: `العقد ${contract.contract_number} الآن نشط`,
      });

      setShowActivateDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطأ في تفعيل العقد',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await contractService.completeContract(
        contract.id,
        format(completeData.actualEndDate, 'yyyy-MM-dd'),
        completeData.returnMileage ? parseInt(completeData.returnMileage) : undefined,
        completeData.fuelLevelReturn || undefined
      );

      toast({
        title: 'تم إنهاء العقد بنجاح',
        description: `العقد ${contract.contract_number} تم إنهاؤه`,
      });

      setShowCompleteDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطأ في إنهاء العقد',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'cancelled') => {
    setIsLoading(true);
    try {
      await contractService.updateContractStatus(contract.id, newStatus);
      
      toast({
        title: 'تم تحديث حالة العقد',
        description: `العقد ${contract.contract_number} تم إلغاؤه`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديث حالة العقد',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // حذف العقد من قاعدة البيانات
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;
      
      toast({
        title: 'تم حذف العقد بنجاح',
        description: `العقد ${contract.contract_number} تم حذفه نهائياً`,
      });

      setShowDeleteDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطأ في حذف العقد',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Status-specific actions */}
      {contract.status === 'pending' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActivateDialog(true)}
          className="text-primary hover:text-primary"
        >
          <Play className="w-4 h-4" />
        </Button>
      )}

      {contract.status === 'active' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCompleteDialog(true)}
          className="text-green-600 hover:text-green-700"
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      )}

      {(contract.status === 'draft' || contract.status === 'pending' || contract.status === 'active') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusChange('cancelled')}
          className="text-red-600 hover:text-red-700"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      )}

      {/* Delete Contract */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Activate Contract Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفعيل العقد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>تاريخ البدء الفعلي</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !activateData.actualStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {activateData.actualStartDate ? (
                      format(activateData.actualStartDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر التاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={activateData.actualStartDate}
                    onSelect={(date) => setActivateData(prev => ({ ...prev, actualStartDate: date || new Date() }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="pickupMileage">قراءة العداد عند الاستلام (كم)</Label>
              <Input
                id="pickupMileage"
                type="number"
                value={activateData.pickupMileage}
                onChange={(e) => setActivateData(prev => ({ ...prev, pickupMileage: e.target.value }))}
                placeholder="أدخل قراءة العداد"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleActivate} disabled={isLoading}>
                {isLoading ? 'جاري التفعيل...' : 'تفعيل العقد'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Contract Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنهاء العقد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>تاريخ الإنهاء الفعلي</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !completeData.actualEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {completeData.actualEndDate ? (
                      format(completeData.actualEndDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر التاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={completeData.actualEndDate}
                    onSelect={(date) => setCompleteData(prev => ({ ...prev, actualEndDate: date || new Date() }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="returnMileage">قراءة العداد عند الإرجاع (كم)</Label>
              <Input
                id="returnMileage"
                type="number"
                value={completeData.returnMileage}
                onChange={(e) => setCompleteData(prev => ({ ...prev, returnMileage: e.target.value }))}
                placeholder="أدخل قراءة العداد"
              />
            </div>

            <div>
              <Label htmlFor="fuelLevelReturn">مستوى الوقود عند الإرجاع</Label>
              <Input
                id="fuelLevelReturn"
                value={completeData.fuelLevelReturn}
                onChange={(e) => setCompleteData(prev => ({ ...prev, fuelLevelReturn: e.target.value }))}
                placeholder="مثال: 1/2 تانك، فارغ، ممتلئ"
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={completeData.notes}
                onChange={(e) => setCompleteData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات حول حالة المركبة أو الإرجاع"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? 'جاري الإنهاء...' : 'إنهاء العقد'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف العقد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <Trash2 className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">هل أنت متأكد من حذف هذا العقد؟</h3>
              <p className="text-sm text-muted-foreground mb-2">
                العقد: <span className="font-medium">{contract.contract_number}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                العميل: <span className="font-medium">{contract.customer_name}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                المركبة: <span className="font-medium">{contract.vehicle_info}</span>
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
                </p>
                <p className="text-xs text-destructive mt-1">
                  سيتم حذف العقد وجميع البيانات المرتبطة به نهائياً
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحذف...' : 'حذف العقد'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};