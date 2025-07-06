import React from 'react';
import { Shield, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleInsurance } from '@/repositories/interfaces/IVehicleInsuranceRepository';
import { getInsuranceTypeText, getInsuranceStatusColor, getInsuranceStatusText } from '@/lib/insuranceUtils';
import { formatDate } from '@/lib/utils';

interface VehicleInsuranceListProps {
  insurances: VehicleInsurance[];
  onAdd: () => void;
  onEdit: (insurance: VehicleInsurance) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  loading?: boolean;
}

export const VehicleInsuranceList: React.FC<VehicleInsuranceListProps> = ({
  insurances,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Shield className="w-5 h-5" />
            تأمينات المركبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            جاري التحميل...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Shield className="w-5 h-5" />
          تأمينات المركبة ({insurances.length})
        </CardTitle>
        <Button onClick={onAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة تأمين
        </Button>
      </CardHeader>
      <CardContent>
        {insurances.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد تأمينات مضافة لهذه المركبة</p>
            <Button onClick={onAdd} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة تأمين جديد
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insurances.map((insurance) => (
              <div
                key={insurance.id}
                className={`border rounded-lg p-4 ${
                  insurance.is_active ? 'bg-card' : 'bg-muted/50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">
                        {getInsuranceTypeText(insurance.insurance_type)}
                      </h4>
                      <Badge
                        variant={insurance.is_active ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {insurance.is_active ? (
                          <>
                            <Eye className="w-3 h-3" />
                            نشط
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            غير نشط
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {insurance.insurance_company && (
                        <div>
                          <span className="font-medium text-muted-foreground">شركة التأمين:</span>
                          <div className="text-foreground">{insurance.insurance_company}</div>
                        </div>
                      )}
                      
                      {insurance.policy_number && (
                        <div>
                          <span className="font-medium text-muted-foreground">رقم الوثيقة:</span>
                          <div className="text-foreground">{insurance.policy_number}</div>
                        </div>
                      )}
                      
                      {insurance.expiry_date && (
                        <div>
                          <span className="font-medium text-muted-foreground">تاريخ الانتهاء:</span>
                          <div className={`font-medium ${getInsuranceStatusColor(insurance.expiry_date)}`}>
                            {formatDate(insurance.expiry_date)}
                            <div className="text-xs">
                              {getInsuranceStatusText(insurance.expiry_date)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {insurance.premium_amount && insurance.premium_amount > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">قسط التأمين:</span>
                          <div className="text-foreground">{insurance.premium_amount} د.ك</div>
                        </div>
                      )}
                      
                      {insurance.coverage_amount && insurance.coverage_amount > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">مبلغ التغطية:</span>
                          <div className="text-foreground">{insurance.coverage_amount.toLocaleString()} د.ك</div>
                        </div>
                      )}
                      
                      {insurance.start_date && (
                        <div>
                          <span className="font-medium text-muted-foreground">تاريخ البداية:</span>
                          <div className="text-foreground">{formatDate(insurance.start_date)}</div>
                        </div>
                      )}
                    </div>
                    
                    {insurance.notes && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium text-muted-foreground">ملاحظات:</span>
                        <div className="text-foreground mt-1">{insurance.notes}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(insurance.id, !insurance.is_active)}
                      title={insurance.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                    >
                      {insurance.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(insurance)}
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(insurance.id)}
                      className="text-red-600 hover:text-red-700"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};