import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Car, MapPin, FileText, Camera, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CompletedContractDetailsProps {
  contract: any;
}

export const CompletedContractDetails: React.FC<CompletedContractDetailsProps> = ({
  contract
}) => {
  const hasDamages = contract.return_damages && contract.return_damages.length > 0;
  const hasPhotos = contract.return_photos && contract.return_photos.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* تفاصيل العميل */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <User className="w-5 h-5" />
            بيانات العميل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">اسم العميل</p>
            <p className="font-medium">{contract.customers?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">رقم الهاتف</p>
            <p className="font-medium">{contract.customers?.phone}</p>
          </div>
          {contract.customers?.email && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium">{contract.customers.email}</p>
            </div>
          )}
          {contract.customers?.national_id && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الهوية الوطنية</p>
              <p className="font-medium">{contract.customers.national_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل المركبة */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Car className="w-5 h-5" />
            بيانات المركبة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">نوع المركبة</p>
            <p className="font-medium">{contract.vehicles?.make} {contract.vehicles?.model}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">رقم المركبة</p>
            <p className="font-medium">{contract.vehicles?.vehicle_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">رقم اللوحة</p>
            <p className="font-medium">{contract.vehicles?.license_plate}</p>
          </div>
          {contract.vehicles?.color && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">اللون</p>
              <p className="font-medium">{contract.vehicles.color}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل التسليم والاستلام */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            تفاصيل التسليم والاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">موقع التسليم</p>
              <p className="font-medium">{contract.pickup_location || 'غير محدد'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">موقع الاستلام</p>
              <p className="font-medium">{contract.return_location || 'غير محدد'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">عداد الكيلومترات عند التسليم</p>
              <p className="font-medium">{contract.pickup_mileage || 'غير مسجل'} كم</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">عداد الكيلومترات عند الاستلام</p>
              <p className="font-medium">{contract.return_mileage || 'غير مسجل'} كم</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">مستوى الوقود عند التسليم</p>
              <p className="font-medium">{contract.fuel_level_pickup || 'غير محدد'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">مستوى الوقود عند الاستلام</p>
              <p className="font-medium">{contract.fuel_level_return || 'غير محدد'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حالة المركبة والأضرار */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            حالة المركبة والأضرار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">حالة المركبة</span>
            <Badge variant={hasDamages ? 'destructive' : 'default'}>
              {hasDamages ? 'يوجد أضرار' : 'سليمة'}
            </Badge>
          </div>

          {hasDamages && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">الأضرار المسجلة:</p>
              <div className="space-y-2">
                {contract.return_damages.map((damage: any, index: number) => (
                  <div key={index} className="p-3 bg-destructive/10 rounded-lg text-right">
                    <p className="font-medium text-destructive">{damage.description}</p>
                    {damage.severity && (
                      <p className="text-xs text-muted-foreground">شدة الضرر: {damage.severity}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صور الاستلام</span>
            <Badge variant="outline">
              {hasPhotos ? `${contract.return_photos.length} صورة` : 'لا توجد صور'}
            </Badge>
          </div>

          {contract.return_condition_notes && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">ملاحظات الاستلام</p>
              <p className="text-sm bg-muted p-3 rounded-lg mt-1 text-right">
                {contract.return_condition_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الشروط والأحكام الخاصة */}
      {contract.special_conditions && (
        <Card className="card-elegant lg:col-span-2">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <FileText className="w-5 h-5" />
              الشروط والأحكام الخاصة
            </CardTitle>
          </CardHeader>
          <CardContent dir="rtl">
            <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap text-right">
              {contract.special_conditions}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};