import React, { useState } from 'react';
import { Car, Fuel, Shield, DollarSign, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Vehicle } from '@/repositories/interfaces/IVehicleRepository';
import { formatDate } from '@/lib/utils';

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleDetailsDialog: React.FC<VehicleDetailsDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  if (!vehicle) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'متاحة',
        icon: <Check className="w-3 h-3" />
      },
      rented: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'مؤجرة',
        icon: <Car className="w-3 h-3" />
      },
      maintenance: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'صيانة',
        icon: <Car className="w-3 h-3" />
      },
      out_of_service: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'خارج الخدمة',
        icon: <X className="w-3 h-3" />
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={`${config.color} border gap-1 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string | number | null; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-medium">{label}:</span>
      </div>
      <span className="text-foreground font-semibold">{value || 'غير محدد'}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="rtl-title">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <Car className="w-6 h-6" />
            تفاصيل المركبة - {vehicle.vehicle_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basic" className="text-sm">
              <Car className="w-4 h-4 ml-2" />
              الأساسية
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-sm">
              <Car className="w-4 h-4 ml-2" />
              الفنية
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-sm">
              <Shield className="w-4 h-4 ml-2" />
              التأمين
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-sm">
              <DollarSign className="w-4 h-4 ml-2" />
              الأسعار
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] px-1">
            <TabsContent value="basic" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Car className="w-5 h-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    <InfoRow 
                      label="رقم المركبة" 
                      value={vehicle.vehicle_number} 
                      icon={<Car className="w-4 h-4" />} 
                    />
                    <InfoRow 
                      label="الماركة" 
                      value={vehicle.make} 
                    />
                    <InfoRow 
                      label="الموديل" 
                      value={vehicle.model} 
                    />
                    <InfoRow 
                      label="السنة" 
                      value={vehicle.year} 
                    />
                    <InfoRow 
                      label="اللون" 
                      value={vehicle.color} 
                    />
                    <InfoRow 
                      label="نوع المركبة" 
                      value={vehicle.vehicle_type} 
                    />
                    <InfoRow 
                      label="لوحة الترخيص" 
                      value={vehicle.license_plate} 
                    />
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">الحالة:</span>
                      </div>
                      {getStatusBadge(vehicle.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Car className="w-5 h-5" />
                    المعلومات الفنية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {vehicle.vin_number && (
                      <InfoRow 
                        label="رقم الهيكل" 
                        value={vehicle.vin_number} 
                      />
                    )}
                    {vehicle.engine_size && (
                      <InfoRow 
                        label="حجم المحرك" 
                        value={vehicle.engine_size} 
                      />
                    )}
                    <InfoRow 
                      label="نوع الوقود" 
                      value={vehicle.fuel_type} 
                      icon={<Fuel className="w-4 h-4" />} 
                    />
                    <InfoRow 
                      label="ناقل الحركة" 
                      value={vehicle.transmission} 
                      icon={<Car className="w-4 h-4" />} 
                    />
                    <InfoRow 
                      label="المسافة المقطوعة" 
                      value={`${vehicle.mileage.toLocaleString()} كم`} 
                    />
                  </div>
                  
                  {/* معلومات الصيانة */}
                  {(vehicle.last_maintenance_date || vehicle.next_maintenance_due) && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-semibold text-primary mb-3">معلومات الصيانة</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        {vehicle.last_maintenance_date && (
                          <InfoRow 
                            label="آخر صيانة" 
                            value={formatDate(vehicle.last_maintenance_date)} 
                          />
                        )}
                        {vehicle.next_maintenance_due && (
                          <InfoRow 
                            label="الصيانة القادمة" 
                            value={formatDate(vehicle.next_maintenance_due)} 
                          />
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Shield className="w-5 h-5" />
                    التأمين والترخيص
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {vehicle.insurance_company && (
                      <InfoRow 
                        label="شركة التأمين" 
                        value={vehicle.insurance_company} 
                        icon={<Shield className="w-4 h-4" />} 
                      />
                    )}
                    {vehicle.insurance_policy_number && (
                      <InfoRow 
                        label="رقم وثيقة التأمين" 
                        value={vehicle.insurance_policy_number} 
                      />
                    )}
                    {vehicle.insurance_expiry && (
                      <InfoRow 
                        label="انتهاء التأمين" 
                        value={formatDate(vehicle.insurance_expiry)} 
                      />
                    )}
                    {vehicle.registration_expiry && (
                      <InfoRow 
                        label="انتهاء الترخيص" 
                        value={formatDate(vehicle.registration_expiry)} 
                      />
                    )}
                  </div>

                  {vehicle.insurance_company && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="w-4 h-4" />
                        عرض المستندات
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <DollarSign className="w-5 h-5" />
                    أسعار الإيجار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">النوع</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">السعر</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-4 py-3 font-medium">السعر اليومي</td>
                          <td className="px-4 py-3 text-green-600 font-bold text-lg">
                            {vehicle.daily_rate} د.ك
                          </td>
                        </tr>
                        {vehicle.weekly_rate && (
                          <tr className="border-t bg-muted/25">
                            <td className="px-4 py-3 font-medium">السعر الأسبوعي</td>
                            <td className="px-4 py-3 text-green-600 font-bold text-lg">
                              {vehicle.weekly_rate} د.ك
                            </td>
                          </tr>
                        )}
                        {vehicle.monthly_rate && (
                          <tr className="border-t">
                            <td className="px-4 py-3 font-medium">السعر الشهري</td>
                            <td className="px-4 py-3 text-green-600 font-bold text-lg">
                              {vehicle.monthly_rate} د.ك
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* حسابات توفير للأسعار الأسبوعية والشهرية */}
                  {(vehicle.weekly_rate || vehicle.monthly_rate) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">توفير في الأسعار</h4>
                      <div className="space-y-1 text-sm">
                        {vehicle.weekly_rate && (
                          <div className="flex justify-between">
                            <span>توفير أسبوعي:</span>
                            <span className="font-semibold text-blue-600">
                              {((vehicle.daily_rate * 7) - vehicle.weekly_rate).toFixed(3)} د.ك
                            </span>
                          </div>
                        )}
                        {vehicle.monthly_rate && (
                          <div className="flex justify-between">
                            <span>توفير شهري:</span>
                            <span className="font-semibold text-blue-600">
                              {((vehicle.daily_rate * 30) - vehicle.monthly_rate).toFixed(3)} د.ك
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* ملاحظات */}
          {vehicle.notes && (
            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-primary">ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
                  {vehicle.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* معلومات النظام */}
          <Card className="shadow-sm mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>تاريخ الإنشاء:</span>
                  <span>{formatDate(vehicle.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>آخر تحديث:</span>
                  <span>{formatDate(vehicle.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};