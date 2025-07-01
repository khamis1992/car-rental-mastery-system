import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Car, Calendar, DollarSign, MapPin, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { VehicleConditionComparison } from './VehicleConditionComparison';

interface ContractInfoSectionsProps {
  contract: any;
}

export const ContractInfoSections: React.FC<ContractInfoSectionsProps> = ({ contract }) => {
  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            معلومات العميل
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">اسم العميل</label>
            <p className="text-sm">{contract.customers?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
            <p className="text-sm">{contract.customers?.phone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
            <p className="text-sm">{contract.customers?.email || 'غير محدد'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">العنوان</label>
            <p className="text-sm">{contract.customers?.address || 'غير محدد'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">رقم الهوية</label>
            <p className="text-sm">{contract.customers?.national_id || 'غير محدد'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            معلومات المركبة
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">المركبة</label>
            <p className="text-sm">{contract.vehicles?.make} {contract.vehicles?.model}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">السنة</label>
            <p className="text-sm">{contract.vehicles?.year}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">رقم اللوحة</label>
            <p className="text-sm">{contract.vehicles?.license_plate}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">رقم المركبة</label>
            <p className="text-sm">{contract.vehicles?.vehicle_number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">اللون</label>
            <p className="text-sm">{contract.vehicles?.color}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تفاصيل العقد
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">تاريخ البداية</label>
            <p className="text-sm">{format(new Date(contract.start_date), 'PPP', { locale: ar })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">تاريخ النهاية</label>
            <p className="text-sm">{format(new Date(contract.end_date), 'PPP', { locale: ar })}</p>
          </div>
          {contract.actual_start_date && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">تاريخ البداية الفعلي</label>
              <p className="text-sm">{format(new Date(contract.actual_start_date), 'PPP', { locale: ar })}</p>
            </div>
          )}
          {contract.actual_end_date && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">تاريخ النهاية الفعلي</label>
              <p className="text-sm">{format(new Date(contract.actual_end_date), 'PPP', { locale: ar })}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">عدد الأيام</label>
            <p className="text-sm">{contract.rental_days} يوم</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">نوع العقد</label>
            <p className="text-sm">
              {contract.contract_type === 'daily' ? 'يومي' :
               contract.contract_type === 'weekly' ? 'أسبوعي' :
               contract.contract_type === 'monthly' ? 'شهري' : 'مخصص'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            التفاصيل المالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">السعر اليومي</label>
              <p className="text-sm">{contract.daily_rate.toFixed(3)} د.ك</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">المبلغ الإجمالي</label>
              <p className="text-sm">{contract.total_amount.toFixed(3)} د.ك</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">قيمة الخصم</label>
              <p className="text-sm">{(contract.discount_amount || 0).toFixed(3)} د.ك</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">قيمة الضريبة</label>
              <p className="text-sm">{(contract.tax_amount || 0).toFixed(3)} د.ك</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">التأمين</label>
              <p className="text-sm">{(contract.insurance_amount || 0).toFixed(3)} د.ك</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">التأمين المسترد</label>
              <p className="text-sm">{(contract.security_deposit || 0).toFixed(3)} د.ك</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>المبلغ النهائي:</span>
            <span>{contract.final_amount.toFixed(3)} د.ك</span>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      {(contract.pickup_location || contract.return_location) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              معلومات التسليم والاستلام
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.pickup_location && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">مكان التسليم</label>
                <p className="text-sm">{contract.pickup_location}</p>
              </div>
            )}
            {contract.return_location && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">مكان الاستلام</label>
                <p className="text-sm">{contract.return_location}</p>
              </div>
            )}
            {contract.pickup_mileage && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">قراءة العداد عند التسليم</label>
                <p className="text-sm">{contract.pickup_mileage} كم</p>
              </div>
            )}
            {contract.return_mileage && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">قراءة العداد عند الاستلام</label>
                <p className="text-sm">{contract.return_mileage} كم</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicle Condition Comparison */}
      {(contract.pickup_photos || contract.return_photos) && (
        <VehicleConditionComparison
          contractId={contract.id}
          vehicleInfo={{
            make: contract.vehicles?.make || '',
            model: contract.vehicles?.model || '',
            license_plate: contract.vehicles?.license_plate || '',
            year: contract.vehicles?.year || 0
          }}
          pickupData={{
            photos: contract.pickup_photos || [],
            notes: contract.pickup_condition_notes || '',
            mileage: contract.pickup_mileage,
            fuel_level: contract.fuel_level_pickup,
            date: contract.actual_start_date
          }}
          returnData={{
            photos: contract.return_photos || [],
            notes: contract.return_condition_notes || '',
            mileage: contract.return_mileage,
            fuel_level: contract.fuel_level_return,
            date: contract.actual_end_date
          }}
        />
      )}

      {/* Additional Information */}
      {(contract.special_conditions || contract.terms_and_conditions || contract.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              معلومات إضافية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contract.special_conditions && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">الشروط الخاصة</label>
                <p className="text-sm whitespace-pre-wrap">{contract.special_conditions}</p>
              </div>
            )}
            {contract.terms_and_conditions && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">الشروط والأحكام</label>
                <p className="text-sm whitespace-pre-wrap">{contract.terms_and_conditions}</p>
              </div>
            )}
            {contract.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quotation Reference */}
      {contract.quotations && (
        <Card>
          <CardHeader>
            <CardTitle>عرض السعر المرجعي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">رقم عرض السعر: {contract.quotations.quotation_number}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};