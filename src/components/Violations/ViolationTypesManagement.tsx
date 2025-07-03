import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Search } from 'lucide-react';
import { violationService } from '@/services/violationService';
import { ViolationType } from '@/types/violation';
import { useToast } from '@/hooks/use-toast';

interface ViolationTypesManagementProps {
  onUpdate: () => void;
}

export const ViolationTypesManagement: React.FC<ViolationTypesManagementProps> = ({ onUpdate }) => {
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ViolationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    violation_code: '',
    violation_name_ar: '',
    violation_name_en: '',
    description: '',
    base_fine_amount: 0,
    points: 0,
    category: 'general' as 'speed' | 'parking' | 'traffic_light' | 'general',
    severity_level: 'minor' as 'minor' | 'moderate' | 'major' | 'severe'
  });

  useEffect(() => {
    loadViolationTypes();
  }, []);

  const loadViolationTypes = async () => {
    try {
      setLoading(true);
      const data = await violationService.getViolationTypes();
      setViolationTypes(data);
    } catch (error) {
      console.error('Error loading violation types:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل أنواع المخالفات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      violation_code: '',
      violation_name_ar: '',
      violation_name_en: '',
      description: '',
      base_fine_amount: 0,
      points: 0,
      category: 'general',
      severity_level: 'minor'
    });
    setEditingType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingType) {
        await violationService.updateViolationType(editingType.id, formData);
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث نوع المخالفة بنجاح'
        });
      } else {
        await violationService.createViolationType(formData);
        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء نوع المخالفة بنجاح'
        });
      }
      
      loadViolationTypes();
      onUpdate();
      setFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving violation type:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ نوع المخالفة',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (violationType: ViolationType) => {
    setEditingType(violationType);
    setFormData({
      violation_code: violationType.violation_code,
      violation_name_ar: violationType.violation_name_ar,
      violation_name_en: violationType.violation_name_en || '',
      description: violationType.description || '',
      base_fine_amount: violationType.base_fine_amount,
      points: violationType.points,
      category: violationType.category,
      severity_level: violationType.severity_level
    });
    setFormOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      speed: { label: 'السرعة', variant: 'destructive' as const },
      parking: { label: 'الوقوف', variant: 'secondary' as const },
      traffic_light: { label: 'الإشارات', variant: 'default' as const },
      general: { label: 'عامة', variant: 'outline' as const },
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      minor: { label: 'بسيطة', variant: 'outline' as const },
      moderate: { label: 'متوسطة', variant: 'secondary' as const },
      major: { label: 'كبيرة', variant: 'destructive' as const },
      severe: { label: 'خطيرة', variant: 'destructive' as const },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.minor;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  const filteredTypes = violationTypes.filter(type => {
    const matchesSearch = searchTerm === '' || 
      type.violation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.violation_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.violation_name_en && type.violation_name_en.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === '' || categoryFilter === 'all' || type.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة نوع مخالفة
            </Button>
            <CardTitle className="text-right">إدارة أنواع المخالفات</CardTitle>
          </div>
          
          {/* فلاتر البحث */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالكود أو الاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="speed">السرعة</SelectItem>
                <SelectItem value="parking">الوقوف</SelectItem>
                <SelectItem value="traffic_light">الإشارات</SelectItem>
                <SelectItem value="general">عامة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الإجراءات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>النقاط</TableHead>
                  <TableHead>الغرامة الأساسية</TableHead>
                  <TableHead>درجة الخطورة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>اسم المخالفة</TableHead>
                  <TableHead>الكود</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد أنواع مخالفات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>{type.points}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(type.base_fine_amount)}</TableCell>
                      <TableCell>{getSeverityBadge(type.severity_level)}</TableCell>
                      <TableCell>{getCategoryBadge(type.category)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{type.violation_name_ar}</div>
                          {type.violation_name_en && (
                            <div className="text-sm text-muted-foreground">{type.violation_name_en}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{type.violation_code}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل نوع المخالفة */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'تعديل نوع المخالفة' : 'إضافة نوع مخالفة جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="violation_code">كود المخالفة *</Label>
                <Input
                  id="violation_code"
                  value={formData.violation_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, violation_code: e.target.value }))}
                  placeholder="مثال: SP001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="violation_name_ar">اسم المخالفة بالعربية *</Label>
                <Input
                  id="violation_name_ar"
                  value={formData.violation_name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, violation_name_ar: e.target.value }))}
                  placeholder="اسم المخالفة"
                  required
                />
              </div>

              <div>
                <Label htmlFor="violation_name_en">اسم المخالفة بالإنجليزية</Label>
                <Input
                  id="violation_name_en"
                  value={formData.violation_name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, violation_name_en: e.target.value }))}
                  placeholder="Violation Name"
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as 'speed' | 'parking' | 'traffic_light' | 'general' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed">السرعة</SelectItem>
                    <SelectItem value="parking">الوقوف</SelectItem>
                    <SelectItem value="traffic_light">الإشارات</SelectItem>
                    <SelectItem value="general">عامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity_level">درجة الخطورة *</Label>
              <Select value={formData.severity_level} onValueChange={(value) => setFormData(prev => ({ ...prev, severity_level: value as 'minor' | 'moderate' | 'major' | 'severe' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">بسيطة</SelectItem>
                    <SelectItem value="moderate">متوسطة</SelectItem>
                    <SelectItem value="major">كبيرة</SelectItem>
                    <SelectItem value="severe">خطيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="base_fine_amount">الغرامة الأساسية (د.ك) *</Label>
                <Input
                  id="base_fine_amount"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.base_fine_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_fine_amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="points">النقاط</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف تفصيلي للمخالفة"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingType ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};