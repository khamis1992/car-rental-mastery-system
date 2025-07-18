import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

// استيراد المكونات المحسنة
import { EnhancedDialog, ConfirmDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { AccessibleField, AccessibleModal } from '@/components/ui/accessibility-enhancements';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

// بيانات تجريبية
const mockData = [
  {
    id: 1,
    name: 'شركة الخليج للتجارة',
    status: 'active',
    users: 25,
    email: 'info@gulf-trade.com',
    created_at: '2024-01-15',
  },
  {
    id: 2,
    name: 'مؤسسة النور للخدمات',
    status: 'pending',
    users: 12,
    email: 'contact@alnoor.com',
    created_at: '2024-01-20',
  },
  {
    id: 3,
    name: 'شركة الأمل المحدودة',
    status: 'suspended',
    users: 8,
    email: 'admin@alamal.com',
    created_at: '2024-01-25',
  }
];

export const UIImprovementsDemo: React.FC = () => {
  const [showEnhancedDialog, setShowEnhancedDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAccessibleModal, setShowAccessibleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(mockData);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { t, msg, formatNumber } = useTranslation();

  // تعريف أعمدة الجدول
  const columns = [
    {
      key: 'name',
      title: 'اسم الشركة',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      align: 'center' as const,
      render: (status: string) => {
        const statusInfo = formatStatus(status);
        return (
          <Badge variant={statusInfo.variant as any}>
            {statusInfo.text}
          </Badge>
        );
      }
    },
    {
      key: 'users',
      title: 'المستخدمين',
      align: 'center' as const,
      render: (count: number) => formatNumber(count)
    },
    {
      key: 'email',
      title: 'البريد الإلكتروني',
      render: (email: string) => (
        <span className="text-muted-foreground">{email}</span>
      )
    }
  ];

  // تعريف إجراءات الجدول
  const actions = [
    {
      label: 'عرض',
      icon: <Eye className="w-4 h-4" />,
      onClick: (item: any) => console.log('عرض:', item)
    },
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (item: any) => console.log('تحرير:', item)
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (item: any) => setShowConfirmDialog(true),
      variant: 'destructive' as const,
      separator: true
    }
  ];

  // محاكاة عمليات async
  const simulateLoading = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const simulateError = () => {
    setError('حدث خطأ في تحميل البيانات');
  };

  const clearError = () => {
    setError(null);
  };

  // معالجة النموذج
  const handleFormSubmit = async () => {
    // تحقق من البيانات
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'اسم الشركة مطلوب';
    if (!formData.email) errors.email = 'البريد الإلكتروني مطلوب';

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      await simulateLoading();
      setShowEnhancedDialog(false);
      setFormData({ name: '', email: '' });
    }
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">عرض تحسينات واجهة المستخدم</h1>
          <p className="text-muted-foreground">
            مكون تجريبي لعرض جميع التحسينات الجديدة في النظام
          </p>
        </div>

        {/* قسم الأزرار المحسنة */}
        <Card>
          <CardHeader>
            <CardTitle>الأزرار المحسنة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <EnhancedButton
                onClick={simulateLoading}
                loadingText="جاري التحميل..."
                successText="تم بنجاح"
                showToastOnSuccess
                icon={<RefreshCw className="w-4 h-4" />}
              >
                زر مع Loading
              </EnhancedButton>

              <ActionButton
                action="create"
                itemName="العنصر"
                onClick={() => setShowEnhancedDialog(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                إضافة جديد
              </ActionButton>

              <ActionButton
                action="delete"
                itemName="العنصر"
                onClick={() => setShowConfirmDialog(true)}
              >
                حذف مع تأكيد
              </ActionButton>

              <EnhancedButton
                onClick={simulateError}
                variant="outline"
                errorText="فشل!"
                showToastOnError
              >
                محاكاة خطأ
              </EnhancedButton>
            </div>
          </CardContent>
        </Card>

        {/* قسم حالات التحميل */}
        <Card>
          <CardHeader>
            <CardTitle>حالات التحميل ومعالجة الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Button onClick={() => setIsLoading(true)}>تفعيل التحميل</Button>
              <Button onClick={simulateError} variant="outline">إظهار خطأ</Button>
              <Button onClick={() => { setIsLoading(false); clearError(); }} variant="secondary">إعادة تعيين</Button>
            </div>

            <LoadingState
              loading={isLoading}
              error={error}
              isEmpty={data.length === 0}
              onRetry={clearError}
            >
              <div className="grid grid-cols-3 gap-4">
                {data.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                  </div>
                ))}
              </div>
            </LoadingState>
          </CardContent>
        </Card>

        {/* قسم الجدول المحسن */}
        <Card>
          <CardHeader>
            <CardTitle>الجدول المحسن</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={data}
              columns={columns}
              actions={actions}
              searchable
              searchPlaceholder="البحث في الشركات..."
              onRefresh={() => console.log('تحديث')}
              onExport={() => console.log('تصدير')}
              emptyMessage="لا توجد شركات للعرض"
              maxHeight="400px"
            />
          </CardContent>
        </Card>

        {/* أزرار المودالز */}
        <Card>
          <CardHeader>
            <CardTitle>المودالز المحسنة</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => setShowAccessibleModal(true)}>
              مودال محسن للوصول
            </Button>
            <Button onClick={() => setShowEnhancedDialog(true)} variant="outline">
              مودال عادي محسن
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Dialog */}
        <EnhancedDialog
          open={showEnhancedDialog}
          onOpenChange={setShowEnhancedDialog}
          title="إضافة شركة جديدة"
          description="املأ النموذج أدناه لإضافة شركة جديدة"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowEnhancedDialog(false)}
              >
                {t('cancel')}
              </Button>
              <ActionButton
                action="save"
                onClick={handleFormSubmit}
                showToastOnSuccess
              >
                {t('save')}
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <AccessibleField
              id="company-name"
              label="اسم الشركة"
              required
              error={formErrors.name}
              hint="أدخل الاسم الكامل للشركة"
            >
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: شركة الخليج للتجارة"
              />
            </AccessibleField>

            <AccessibleField
              id="company-email"
              label="البريد الإلكتروني"
              required
              error={formErrors.email}
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@company.com"
              />
            </AccessibleField>
          </div>
        </EnhancedDialog>

        {/* Accessible Modal */}
        <AccessibleModal
          isOpen={showAccessibleModal}
          onClose={() => setShowAccessibleModal(false)}
          title="مودال محسن للوصول"
          description="هذا المودال يدعم keyboard navigation وscreen readers"
        >
          <div className="space-y-4">
            <p>هذا المودال محسن لإمكانية الوصول ويتضمن:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Focus trap للتنقل بـ Tab</li>
              <li>إغلاق بـ Escape key</li>
              <li>ARIA labels مناسبة</li>
              <li>إعلانات للقارئات الشاشة</li>
            </ul>
            <div className="flex justify-end">
              <Button onClick={() => setShowAccessibleModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </AccessibleModal>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="تأكيد الحذف"
          description="هل أنت متأكد من حذف هذا العنصر؟ هذا الإجراء لا يمكن التراجع عنه."
          confirmText="حذف"
          cancelText="إلغاء"
          variant="destructive"
          onConfirm={async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowConfirmDialog(false);
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

export default UIImprovementsDemo; 