
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';

interface DeleteVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteVehicleDialog: React.FC<DeleteVehicleDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false
}) => {
  if (!vehicle) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="rtl-title">تأكيد حذف المركبة</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            هل أنت متأكد من رغبتك في حذف المركبة التالية؟
            <br />
            <br />
            <strong>رقم المركبة:</strong> {vehicle.vehicle_number}
            <br />
            <strong>المركبة:</strong> {vehicle.make} {vehicle.model} ({vehicle.year})
            <br />
            <strong>رقم اللوحة:</strong> {vehicle.license_plate}
            <br />
            <br />
            <span className="text-destructive font-medium">
              ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات المرتبطة بهذه المركبة.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="rtl-flex">
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rtl-flex"
          >
            {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
