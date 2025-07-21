
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Building2, 
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'online' | 'mobile';
  is_active: boolean;
  processing_fee: number;
  min_amount: number;
  max_amount: number;
  settings: Record<string, any>;
  created_at: string;
}

const PaymentMethods: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as const,
    is_active: true,
    processing_fee: 0,
    min_amount: 0,
    max_amount: 0,
    settings: {},
  });

  // Mock data - replace with actual API calls
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'نقدي',
      type: 'cash',
      is_active: true,
      processing_fee: 0,
      min_amount: 0,
      max_amount: 10000,
      settings: {},
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'بطاقة ائتمان',
      type: 'card',
      is_active: true,
      processing_fee: 2.5,
      min_amount: 5,
      max_amount: 5000,
      settings: { gateway: 'stripe' },
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'تحويل بنكي',
      type: 'bank_transfer',
      is_active: true,
      processing_fee: 1,
      min_amount: 100,
      max_amount: 50000,
      settings: { account_number: '1234567890' },
      created_at: new Date().toISOString(),
    },
  ]);

  const handleCreate = async () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      ...formData,
      created_at: new Date().toISOString(),
    };

    setPaymentMethods(prev => [...prev, newMethod]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success('تم إضافة طريقة الدفع بنجاح');
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      is_active: method.is_active,
      processing_fee: method.processing_fee,
      min_amount: method.min_amount,
      max_amount: method.max_amount,
      settings: method.settings,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingMethod) return;

    const updatedMethod: PaymentMethod = {
      ...editingMethod,
      ...formData,
    };

    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === editingMethod.id ? updatedMethod : method
      )
    );
    setIsEditDialogOpen(false);
    setEditingMethod(null);
    resetForm();
    toast.success('تم تحديث طريقة الدفع بنجاح');
  };

  const handleDelete = async (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
    toast.success('تم حذف طريقة الدفع بنجاح');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      is_active: true,
      processing_fee: 0,
      min_amount: 0,
      max_amount: 0,
      settings: {},
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      cash: { label: 'نقدي', variant: 'default' as const },
      card: { label: 'بطاقة', variant: 'secondary' as const },
      bank_transfer: { label: 'تحويل بنكي', variant: 'outline' as const },
      online: { label: 'دفع إلكتروني', variant: 'default' as const },
      mobile: { label: 'محفظة إلكترونية', variant: 'secondary' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.cash;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'الاسم',
      accessorKey: 'name',
      cell: ({ row }: any) => {
        const method = row.original;
        return (
          <div className="flex items-center gap-2">
            {getTypeIcon(method.type)}
            <span className="font-medium">{method.name}</span>
          </div>
        );
      },
    },
    {
      header: 'النوع',
      accessorKey: 'type',
      cell: ({ row }: any) => getTypeBadge(row.getValue('type')),
    },
    {
      header: 'رسوم المعالجة (%)',
      accessorKey: 'processing_fee',
      cell: ({ row }: any) => {
        const fee = row.getValue('processing_fee');
        return fee ? `${fee}%` : 'مجاني';
      },
    },
    {
      header: 'الحد الأدنى',
      accessorKey: 'min_amount',
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue('min_amount'));
        return new Intl.NumberFormat('ar-KW', {
          style: 'currency',
          currency: 'KWD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      },
    },
    {
      header: 'الحد الأقصى',
      accessorKey: 'max_amount',
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue('max_amount'));
        return new Intl.NumberFormat('ar-KW', {
          style: 'currency',
          currency: 'KWD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      },
    },
    {
      header: 'الحالة',
      accessorKey: 'is_active',
      cell: ({ row }: any) => {
        const isActive = row.getValue('is_active');
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'نشط' : 'غير نشط'}
          </Badge>
        );
      },
    },
    {
      header: 'الإجراءات',
      id: 'actions',
      cell: ({ row }: any) => {
        const method = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(method)}
            >
              <Edit className="h-4 w-4 ml-1" />
              تعديل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(method.id)}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              حذف
            </Button>
          </div>
        );
      },
    },
  ];

  const activeCount = filteredMethods.filter(method => method.is_active).length;
  const inactiveCount = filteredMethods.filter(method => !method.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة طرق الدفع</h2>
          <p className="text-muted-foreground">
            إدارة وتكوين طرق الدفع المختلفة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة طريقة دفع
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>إضافة طريقة دفع جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))}
                      placeholder="اسم طريقة الدفع"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">النوع</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, type: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="card">بطاقة ائتمان</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="online">دفع إلكتروني</SelectItem>
                        <SelectItem value="mobile">محفظة إلكترونية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processing_fee">رسوم المعالجة (%)</Label>
                    <Input
                      id="processing_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.processing_fee}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        processing_fee: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_amount">الحد الأدنى (د.ك)</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.min_amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        min_amount: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_amount">الحد الأقصى (د.ك)</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.max_amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_amount: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_active">تفعيل طريقة الدفع</Label>
                      <p className="text-sm text-muted-foreground">
                        جعل طريقة الدفع متاحة للاستخدام
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleCreate}>
                    إضافة طريقة الدفع
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="البحث في طرق الدفع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطرق</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMethods.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النشطة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير النشطة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredMethods}
        isLoading={false}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تعديل طريقة الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">الاسم</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  placeholder="اسم طريقة الدفع"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_type">النوع</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="online">دفع إلكتروني</SelectItem>
                    <SelectItem value="mobile">محفظة إلكترونية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_processing_fee">رسوم المعالجة (%)</Label>
                <Input
                  id="edit_processing_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.processing_fee}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    processing_fee: parseFloat(e.target.value) 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_min_amount">الحد الأدنى (د.ك)</Label>
                <Input
                  id="edit_min_amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.min_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    min_amount: parseFloat(e.target.value) 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_max_amount">الحد الأقصى (د.ك)</Label>
                <Input
                  id="edit_max_amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.max_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_amount: parseFloat(e.target.value) 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="edit_is_active">تفعيل طريقة الدفع</Label>
                  <p className="text-sm text-muted-foreground">
                    جعل طريقة الدفع متاحة للاستخدام
                  </p>
                </div>
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button onClick={handleUpdate}>
                تحديث طريقة الدفع
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethods;
