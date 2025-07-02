import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { InvoiceFormData } from '@/types/invoice';

// NOTE: This component now uses the Repository Pattern via serviceContainer

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contracts: any[];
  customers: any[];
  preselectedContractId?: string;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  contracts,
  customers,
  preselectedContractId,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const invoiceService = serviceContainer.getInvoiceBusinessService();
  const [formData, setFormData] = useState<InvoiceFormData>({
    contract_id: preselectedContractId || '',
    customer_id: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoice_type: 'rental',
    tax_amount: 0,
    discount_amount: 0,
    payment_terms: 'استحقاق خلال 30 يوم',
    notes: '',
    terms_and_conditions: '',
    items: [{
      description: '',
      item_type: 'rental',
      quantity: 1,
      unit_price: 0,
    }]
  });

  React.useEffect(() => {
    if (preselectedContractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === preselectedContractId);
      if (contract) {
        setFormData(prev => ({
          ...prev,
          contract_id: preselectedContractId,
          customer_id: contract.customer_id,
          items: [{
            description: `إيجار ${contract.vehicle_info} لمدة ${contract.rental_days} يوم`,
            item_type: 'rental',
            quantity: contract.rental_days,
            unit_price: contract.daily_rate,
            start_date: contract.start_date,
            end_date: contract.end_date,
            daily_rate: contract.daily_rate,
          }]
        }));
      }
    }
  }, [preselectedContractId, contracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await invoiceService.createInvoice(formData);
      
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        contract_id: '',
        customer_id: '',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoice_type: 'rental',
        tax_amount: 0,
        discount_amount: 0,
        payment_terms: 'استحقاق خلال 30 يوم',
        notes: '',
        terms_and_conditions: '',
        items: [{
          description: '',
          item_type: 'rental',
          quantity: 1,
          unit_price: 0,
        }]
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        item_type: 'other',
        quantity: 1,
        unit_price: 0,
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (formData.tax_amount || 0) - (formData.discount_amount || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_id">العقد</Label>
                <Select 
                  value={formData.contract_id} 
                  onValueChange={(value) => {
                    const contract = contracts.find(c => c.id === value);
                    setFormData(prev => ({
                      ...prev,
                      contract_id: value,
                      customer_id: contract?.customer_id || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العقد" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contract_number} - {contract.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoice_type">نوع الفاتورة</Label>
                <Select 
                  value={formData.invoice_type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, invoice_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">إيجار</SelectItem>
                    <SelectItem value="additional">رسوم إضافية</SelectItem>
                    <SelectItem value="penalty">غرامة</SelectItem>
                    <SelectItem value="extension">تمديد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">شروط الدفع</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="استحقاق خلال 30 يوم"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>بنود الفاتورة</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة بند
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">البند {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        variant="ghost" 
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>الوصف</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="وصف البند"
                        required
                      />
                    </div>

                    <div>
                      <Label>النوع</Label>
                      <Select 
                        value={item.item_type} 
                        onValueChange={(value) => updateItem(index, 'item_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rental">إيجار</SelectItem>
                          <SelectItem value="fuel">وقود</SelectItem>
                          <SelectItem value="cleaning">تنظيف</SelectItem>
                          <SelectItem value="damage">أضرار</SelectItem>
                          <SelectItem value="extension">تمديد</SelectItem>
                          <SelectItem value="penalty">غرامة</SelectItem>
                          <SelectItem value="insurance">تأمين</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div>
                      <Label>السعر</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-medium">
                      المجموع: {(item.quantity * item.unit_price).toFixed(3)} د.ك
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>المجاميع</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax_amount">الضريبة</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.001"
                  value={formData.tax_amount || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="discount_amount">الخصم</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.001"
                  value={formData.discount_amount || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{calculateSubtotal().toFixed(3)} د.ك</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>المجموع الكلي:</span>
                  <span>{calculateTotal().toFixed(3)} د.ك</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية"
                />
              </div>

              <div>
                <Label htmlFor="terms_and_conditions">الشروط والأحكام</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={formData.terms_and_conditions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                  placeholder="الشروط والأحكام"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};