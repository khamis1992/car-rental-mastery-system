import React from 'react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2, Shield } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { INSURANCE_TYPES } from '@/lib/insuranceUtils';
import { type VehicleFormData } from './types';

interface MultipleInsuranceSectionProps {
  control: Control<VehicleFormData>;
}

export const MultipleInsuranceSection: React.FC<MultipleInsuranceSectionProps> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'insurances',
  });

  const insurances = useWatch({
    control,
    name: 'insurances',
    defaultValue: []
  });

  const addInsurance = () => {
    append({
      insurance_type: 'comprehensive',
      insurance_company: '',
      policy_number: '',
      start_date: '',
      expiry_date: '',
      premium_amount: 0,
      coverage_amount: 0,
      deductible_amount: 0,
      notes: '',
    });
  };

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          التأمينات المتعددة ({fields.length})
        </h3>
        <Button
          type="button"
          onClick={addInsurance}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة تأمين
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-4">لم يتم إضافة أي تأمينات بعد</p>
          <Button
            type="button"
            onClick={addInsurance}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة تأمين جديد
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    التأمين رقم {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`insurances.${index}.insurance_type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">نوع التأمين *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع التأمين" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSURANCE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.labelAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.insurance_company`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">شركة التأمين</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم شركة التأمين" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.policy_number`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">رقم الوثيقة</FormLabel>
                        <FormControl>
                          <Input placeholder="رقم وثيقة التأمين" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.start_date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">تاريخ البداية</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.expiry_date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">تاريخ الانتهاء</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.premium_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">قسط التأمين (د.ك)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.coverage_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">مبلغ التغطية (د.ك)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`insurances.${index}.deductible_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">مبلغ التحمل (د.ك)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={control}
                    name={`insurances.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">ملاحظات</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أي ملاحظات إضافية حول هذا التأمين..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};