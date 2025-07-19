import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ar } from 'date-fns/locale';

interface AutoReverseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date, reason: string) => void;
  entryNumber: string;
}

export default function AutoReverseDialog({
  isOpen,
  onClose,
  onConfirm,
  entryNumber
}: AutoReverseDialogProps) {
  const [reverseDate, setReverseDate] = useState<Date>();
  const [reason, setReason] = useState('عكس تلقائي');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleConfirm = () => {
    if (!reverseDate) return;
    onConfirm(reverseDate, reason);
    handleClose();
  };

  const handleClose = () => {
    setReverseDate(undefined);
    setReason('عكس تلقائي');
    setIsCalendarOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="rtl-title text-right">
            عكس القيد التلقائي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground text-right">
            رقم القيد: <span className="font-medium">{entryNumber}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reverse-date" className="rtl-label text-right">
              تاريخ العكس
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="reverse-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-right rtl-flex",
                    !reverseDate && "text-muted-foreground"
                  )}
                >
                  {reverseDate ? (
                    format(reverseDate, "dd/MM/yyyy", { locale: ar })
                  ) : (
                    "اختر تاريخ العكس"
                  )}
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reverseDate}
                  onSelect={(date) => {
                    setReverseDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={ar}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="rtl-label text-right">
              سبب العكس
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب عكس القيد..."
              className="text-right"
              rows={3}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-right">
            <p className="font-medium text-foreground mb-1">ملاحظة:</p>
            <p className="text-muted-foreground">
              سيتم إنشاء قيد عكسي تلقائياً في التاريخ المحدد مع عكس جميع مبالغ المدين والدائن.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button
            onClick={handleConfirm}
            disabled={!reverseDate}
            className="bg-primary hover:bg-primary/90"
          >
            تأكيد العكس التلقائي
          </Button>
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}