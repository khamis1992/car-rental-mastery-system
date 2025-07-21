
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Building2,
  Globe
} from 'lucide-react';

type PaymentMethodType = 'cash' | 'card' | 'bank_transfer' | 'online' | 'mobile';

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
  configuration?: {
    account_number?: string;
    bank_name?: string;
    api_key?: string;
    merchant_id?: string;
    gateway_url?: string;
  };
  description?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethodFormData {
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
  configuration: {
    account_number?: string;
    bank_name?: string;
    api_key?: string;
    merchant_id?: string;
    gateway_url?: string;
  };
  description?: string;
}

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'الدفع النقدي',
      type: 'cash',
      is_active: true,
      description: 'الدفع المباشر نقداً',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'بطاقة ائتمانية',
      type: 'card',
      is_active: true,
      configuration: {
        merchant_id: 'MERCHANT_123',
        gateway_url: 'https://api.payment.com'
      },
      description: 'الدفع بالبطاقة الائتمانية',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ]);

  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    type: 'cash',
    is_active: true,
    configuration: {},
    description: ''
  });

  const { toast } = useToast();

  const getMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'online': return <Globe className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodTypeLabel = (type: PaymentMethodType) => {
    switch (type) {
      case 'cash': return 'نقدي';
      case 'card': return 'بطاقة ائتمانية';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'online': return 'دفع إلكتروني';
      case 'mobile': return 'دفع محمول';
      default: return type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMethod) {
      // Update existing method
      setPaymentMethods(prev => prev.map(method => 
        method.id === editingMethod.id 
          ? { ...method, ...formData, updated_at: new Date().toISOString() }
          : method
      ));
      toast({
        title: "تم تحديث طريقة الدفع",
        description: "تم تحديث طريقة الدفع بنجاح"
      });
      setEditingMethod(null);
    } else {
      // Add new method
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setPaymentMethods(prev => [...prev, newMethod]);
      toast({
        title: "تم إضافة طريقة دفع جديدة",
        description: "تم إضافة طريقة الدفع بنجاح"
      });
    }

    // Reset form
    setFormData({
      name: '',
      type: 'cash',
      is_active: true,
      configuration: {},
      description: ''
    });
    setIsAddingMethod(false);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      is_active: method.is_active,
      configuration: method.configuration || {},
      description: method.description || ''
    });
    setIsAddingMethod(true);
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
    toast({
      title: "تم حذف طريقة الدفع",
      description: "تم حذف طريقة الدفع بنجاح"
    });
  };

  const handleToggleActive = (id: string) => {
    setPaymentMethods(prev => prev.map(method => 
      method.id === id 
        ? { ...method, is_active: !method.is_active, updated_at: new Date().toISOString() }
        : method
    ));
  };

  const renderConfigurationFields = () => {
    switch (formData.type) {
      case 'card':
      case 'online':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="merchant_id">معرف التاجر</Label>
              <Input
                id="merchant_id"
                value={formData.configuration.merchant_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, merchant_id: e.target.value }
                })}
                placeholder="أدخل معرف التاجر"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway_url">رابط البوابة</Label>
              <Input
                id="gateway_url"
                value={formData.configuration.gateway_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, gateway_url: e.target.value }
                })}
                placeholder="https://api.payment.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">مفتاح API</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.configuration.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, api_key: e.target.value }
                })}
                placeholder="أدخل مفتاح API"
              />
            </div>
          </>
        );
      case 'bank_transfer':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bank_name">اسم البنك</Label>
              <Input
                id="bank_name"
                value={formData.configuration.bank_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, bank_name: e.target.value }
                })}
                placeholder="أدخل اسم البنك"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">رقم الحساب</Label>
              <Input
                id="account_number"
                value={formData.configuration.account_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, account_number: e.target.value }
                })}
                placeholder="أدخل رقم الحساب"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">طرق الدفع</h2>
          <p className="text-muted-foreground">
            إدارة طرق الدفع المتاحة للعملاء
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingMethod(true)}
          className="flex items-center gap-2 flex-row-reverse"
        >
          <Plus className="h-4 w-4" />
          إضافة طريقة دفع
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingMethod && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم طريقة الدفع</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم طريقة الدفع"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">نوع طريقة الدفع</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: PaymentMethodType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="card">بطاقة ائتمانية</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="online">دفع إلكتروني</SelectItem>
                      <SelectItem value="mobile">دفع محمول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {renderConfigurationFields()}

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل وصف طريقة الدفع"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 flex-row-reverse">
                <Label htmlFor="is_active">نشط</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingMethod ? 'تحديث' : 'إضافة'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsAddingMethod(false);
                    setEditingMethod(null);
                    setFormData({
                      name: '',
                      type: 'cash',
                      is_active: true,
                      configuration: {},
                      description: ''
                    });
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-row-reverse">
                  {getMethodIcon(method.type)}
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                </div>
                <Badge variant={method.is_active ? 'default' : 'secondary'}>
                  {method.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <CardDescription>{getMethodTypeLabel(method.type)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {method.description && (
                <p className="text-sm text-muted-foreground">{method.description}</p>
              )}
              
              {method.configuration && Object.keys(method.configuration).length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">إعدادات:</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {method.configuration.bank_name && (
                      <div>البنك: {method.configuration.bank_name}</div>
                    )}
                    {method.configuration.account_number && (
                      <div>الحساب: {method.configuration.account_number}</div>
                    )}
                    {method.configuration.merchant_id && (
                      <div>معرف التاجر: {method.configuration.merchant_id}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(method)}
                  className="flex items-center gap-1 flex-row-reverse"
                >
                  <Edit2 className="h-3 w-3" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(method.id)}
                >
                  {method.is_active ? 'إلغاء تفعيل' : 'تفعيل'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(method.id)}
                  className="flex items-center gap-1 flex-row-reverse"
                >
                  <Trash2 className="h-3 w-3" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
