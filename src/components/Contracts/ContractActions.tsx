import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, CheckCircle, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { contractService } from '@/services/contractService';
import { contractDeletionService, RelatedRecords } from '@/services/contractDeletionService';

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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<any>(null);
  const [deleteOption, setDeleteOption] = useState<'cancel' | 'cascade' | 'soft'>('cancel');
  const [deleteReason, setDeleteReason] = useState('');
  const { toast } = useToast();

  const [completeData, setCompleteData] = useState({
    actualEndDate: new Date(),
    returnMileage: '',
    fuelLevelReturn: '',
    notes: '',
  });

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

  const checkRelatedRecords = async () => {
    try {
      const data = await contractDeletionService.checkRelatedRecords(contract.id);
      setRelatedRecords(data);
    } catch (error: any) {
      console.error('Error checking related records:', error);
      toast({
        title: 'خطأ في فحص البيانات المرتبطة',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = async () => {
    setShowDeleteDialog(true);
    setDeleteOption('cancel');
    setDeleteReason('');
    await checkRelatedRecords();
  };

  const handleDelete = async () => {
    if (deleteOption === 'cancel') return;
    
    setIsLoading(true);
    try {
      let result;
      
      if (deleteOption === 'soft') {
        // Mark as deleted instead of actually deleting
        result = await contractDeletionService.markContractDeleted(contract.id, deleteReason || undefined);
        
        toast({
          title: 'تم وسم العقد كمحذوف',
          description: `العقد ${contract.contract_number} تم وسمه كمحذوف`,
        });
      } else if (deleteOption === 'cascade') {
        // Delete contract and all related records
        result = await contractDeletionService.cascadeDeleteContract(contract.id);
        
        toast({
          title: 'تم حذف العقد والبيانات المرتبطة',
          description: `العقد ${contract.contract_number} وجميع البيانات المرتبطة تم حذفها نهائياً`,
        });
      }

      setShowDeleteDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطأ في العملية',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const { ContractHTMLPrintService } = await import('@/lib/contractHTMLPrintService');
      await ContractHTMLPrintService.printContract(contract.id, {
        includePhotos: true,
        photoQuality: 'medium'
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في الطباعة',
        description: error.message || 'فشل في طباعة العقد',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Print Contract */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrint}
        className="text-blue-600 hover:text-blue-700"
        title="طباعة العقد"
      >
        <Printer className="w-4 h-4" />
      </Button>

      {/* Delete Contract */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDeleteClick}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>حذف العقد</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Contract Info */}
              <div className="text-center">
                <Trash2 className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">إدارة حذف العقد</h3>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><span className="font-medium">العقد:</span> {contract.contract_number}</p>
                  <p><span className="font-medium">العميل:</span> {contract.customer_name}</p>
                  <p><span className="font-medium">المركبة:</span> {contract.vehicle_info}</p>
                </div>
              </div>

              {/* Related Records Info */}
              {relatedRecords && (
                <div className="space-y-4">
                  <h4 className="font-medium">البيانات المرتبطة بالعقد:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>الفواتير:</span>
                      <span className={relatedRecords.invoices > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                        {relatedRecords.invoices}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الرسوم الإضافية:</span>
                      <span className={relatedRecords.additional_charges > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                        {relatedRecords.additional_charges}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الحوادث:</span>
                      <span className={relatedRecords.incidents > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                        {relatedRecords.incidents}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>التمديدات:</span>
                      <span className={relatedRecords.extensions > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                        {relatedRecords.extensions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>التقييمات:</span>
                      <span className={relatedRecords.evaluations > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                        {relatedRecords.evaluations}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>إجمالي البيانات المرتبطة:</span>
                      <span className={relatedRecords.total_related > 0 ? 'text-orange-600' : 'text-muted-foreground'}>
                        {relatedRecords.total_related}
                      </span>
                    </div>
                  </div>

                  {relatedRecords.has_related_records && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800 font-medium">
                        ⚠️ تحذير: هناك بيانات مرتبطة بهذا العقد
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        يجب اختيار كيفية التعامل مع هذه البيانات
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delete Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">اختر الإجراء المطلوب:</Label>
                
                <RadioGroup value={deleteOption} onValueChange={(value: 'cancel' | 'cascade' | 'soft') => setDeleteOption(value)}>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="cancel" id="cancel" />
                    <Label htmlFor="cancel" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">إلغاء العملية</p>
                        <p className="text-sm text-muted-foreground">عدم حذف العقد والاحتفاظ به كما هو</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="soft" id="soft" />
                    <Label htmlFor="soft" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-blue-700">وسم العقد كمحذوف</p>
                        <p className="text-sm text-muted-foreground">تغيير حالة العقد إلى "ملغي" مع الاحتفاظ بجميع البيانات (موصى به)</p>
                      </div>
                    </Label>
                  </div>

                  {relatedRecords?.has_related_records && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="cascade" id="cascade" />
                      <Label htmlFor="cascade" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium text-red-700">حذف العقد وجميع البيانات المرتبطة</p>
                          <p className="text-sm text-muted-foreground">حذف نهائي للعقد والفواتير والرسوم وجميع البيانات المرتبطة (غير قابل للاستعادة)</p>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>

                {deleteOption === 'soft' && (
                  <div className="space-y-2">
                    <Label htmlFor="deleteReason">سبب الحذف (اختياري)</Label>
                    <Textarea
                      id="deleteReason"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="أدخل سبب وسم العقد كمحذوف..."
                      className="min-h-20"
                    />
                  </div>
                )}

                {deleteOption === 'cascade' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium mb-2">
                      ⚠️ تحذير شديد: حذف نهائي
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• سيتم حذف {relatedRecords?.invoices || 0} فاتورة نهائياً</li>
                      <li>• سيتم حذف {relatedRecords?.additional_charges || 0} رسم إضافي نهائياً</li>
                      <li>• سيتم حذف جميع البيانات المحاسبية المرتبطة</li>
                      <li>• لا يمكن استعادة هذه البيانات بعد الحذف</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إغلاق
            </Button>
            <Button 
              variant={deleteOption === 'cascade' ? 'destructive' : deleteOption === 'soft' ? 'default' : 'outline'}
              onClick={handleDelete} 
              disabled={isLoading || deleteOption === 'cancel'}
            >
              {isLoading ? 'جاري المعالجة...' : 
               deleteOption === 'cascade' ? 'حذف نهائي' :
               deleteOption === 'soft' ? 'وسم كمحذوف' : 'اختر إجراء'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};