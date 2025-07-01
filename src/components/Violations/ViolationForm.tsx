import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { violationService } from '@/services/violationService';
import { supabase } from '@/integrations/supabase/client';
import { ViolationType } from '@/types/violation';
import { useToast } from '@/hooks/use-toast';

interface ViolationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  name: string;
  customer_number: string;
  phone: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_number: string;
}

interface Contract {
  id: string;
  contract_number: string;
  customer_id: string;
  vehicle_id: string;
}

export const ViolationForm: React.FC<ViolationFormProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    violation_type_id: '',
    violation_date: new Date().toISOString().split('T')[0],
    violation_time: '',
    location: '',
    description: '',
    official_violation_number: '',
    issuing_authority: '',
    officer_name: '',
    fine_amount: 0,
    processing_fee: 0,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCustomerId && selectedVehicleId) {
      loadActiveContract();
    }
  }, [selectedCustomerId, selectedVehicleId]);

  const loadInitialData = async () => {
    try {
      const [violationTypesData, customersData, vehiclesData] = await Promise.all([
        violationService.getViolationTypes(),
        supabase.from('customers').select('id, name, customer_number, phone').eq('status', 'active'),
        supabase.from('vehicles').select('id, license_plate, make, model, vehicle_number').eq('status', 'available')
      ]);

      setViolationTypes(violationTypesData);
      setCustomers(customersData.data || []);
      setVehicles(vehiclesData.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل البيانات المطلوبة',
        variant: 'destructive'
      });
    }
  };

  const loadActiveContract = async () => {
    try {
      const { data } = await supabase
        .from('contracts')
        .select('id, contract_number, customer_id, vehicle_id')
        .eq('customer_id', selectedCustomerId)
        .eq('vehicle_id', selectedVehicleId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setSelectedContractId(data[0].id);
        setContracts(data);
      } else {
        setSelectedContractId('');
        setContracts([]);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const handleViolationTypeChange = (violationTypeId: string) => {
    const violationType = violationTypes.find(vt => vt.id === violationTypeId);
    if (violationType) {
      setFormData(prev => ({
        ...prev,
        violation_type_id: violationTypeId,
        fine_amount: violationType.base_fine_amount
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !selectedVehicleId || !formData.violation_type_id) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      await violationService.createViolation({
        ...formData,
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId,
        contract_id: selectedContractId || undefined,
        total_amount: formData.fine_amount + formData.processing_fee
      });

      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating violation:', error);
      toast({
        title: 'خطأ في إنشاء المخالفة',
        description: 'حدث خطأ أثناء إنشاء المخالفة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      violation_type_id: '',
      violation_date: new Date().toISOString().split('T')[0],
      violation_time: '',
      location: '',
      description: '',
      official_violation_number: '',
      issuing_authority: '',
      officer_name: '',
      fine_amount: 0,
      processing_fee: 0,
      notes: ''
    });
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setSelectedContractId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مخالفة مرورية جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات أساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">العميل *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.customer_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle">المركبة *</Label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="violation_type">نوع المخالفة *</Label>
                  <Select value={formData.violation_type_id} onValueChange={handleViolationTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المخالفة" />
                    </SelectTrigger>
                    <SelectContent>
                      {violationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.violation_name_ar} - {type.base_fine_amount.toFixed(3)} د.ك
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {contracts.length > 0 && (
                  <div>
                    <Label htmlFor="contract">العقد المرتبط</Label>
                    <Input
                      value={contracts[0]?.contract_number || ''}
                      disabled
                      placeholder="لا يوجد عقد نشط"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل المخالفة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل المخالفة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="violation_date">تاريخ المخالفة *</Label>
                  <Input
                    id="violation_date"
                    type="date"
                    value={formData.violation_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, violation_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="violation_time">وقت المخالفة</Label>
                  <Input
                    id="violation_time"
                    type="time"
                    value={formData.violation_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, violation_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location">المكان</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="مكان المخالفة"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف المخالفة</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف تفصيلي للمخالفة"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* معلومات الجهة المصدرة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الجهة المصدرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="official_violation_number">رقم المخالفة الرسمي</Label>
                  <Input
                    id="official_violation_number"
                    value={formData.official_violation_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, official_violation_number: e.target.value }))}
                    placeholder="رقم المخالفة من الجهة المصدرة"
                  />
                </div>

                <div>
                  <Label htmlFor="issuing_authority">الجهة المصدرة</Label>
                  <Input
                    id="issuing_authority"
                    value={formData.issuing_authority}
                    onChange={(e) => setFormData(prev => ({ ...prev, issuing_authority: e.target.value }))}
                    placeholder="اسم الجهة المصدرة"
                  />
                </div>

                <div>
                  <Label htmlFor="officer_name">اسم الضابط</Label>
                  <Input
                    id="officer_name"
                    value={formData.officer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, officer_name: e.target.value }))}
                    placeholder="اسم الضابط المصدر للمخالفة"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المعلومات المالية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات المالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fine_amount">مبلغ الغرامة (د.ك) *</Label>
                  <Input
                    id="fine_amount"
                    type="number"
                    step="0.001"
                    value={formData.fine_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, fine_amount: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="processing_fee">رسوم المعالجة (د.ك)</Label>
                  <Input
                    id="processing_fee"
                    type="number"
                    step="0.001"
                    value={formData.processing_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, processing_fee: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label>المبلغ الإجمالي (د.ك)</Label>
                  <Input
                    value={(formData.fine_amount + formData.processing_fee).toFixed(3)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملاحظات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملاحظات إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية حول المخالفة"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ المخالفة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};