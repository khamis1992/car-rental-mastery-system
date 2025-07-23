import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Upload, QrCode, Barcode, X } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssetFormData {
  asset_name: string;
  asset_code: string;
  asset_category: string;
  purchase_cost: number;
  purchase_date: Date;
  useful_life_years: number;
  depreciation_method: string;
  depreciation_rate: number;
  residual_value: number;
  location_description: string;
  condition_status: string;
  assigned_employee_id?: string;
  warranty_end_date?: Date;
  insurance_policy_number?: string;
  insurance_expiry_date?: Date;
  maintenance_schedule: string;
  barcode?: string;
  qr_code?: string;
  tags: string[];
  notes?: string;
}

interface AssetFormDialogProps {
  asset?: any;
  trigger?: React.ReactNode;
}

export function AssetFormDialog({ asset, trigger }: AssetFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<AssetFormData>({
    asset_name: asset?.asset_name || "",
    asset_code: asset?.asset_code || "",
    asset_category: asset?.asset_category || "",
    purchase_cost: asset?.purchase_cost || 0,
    purchase_date: asset?.purchase_date ? new Date(asset.purchase_date) : new Date(),
    useful_life_years: asset?.useful_life_years || 5,
    depreciation_method: asset?.depreciation_method || "straight_line",
    depreciation_rate: asset?.depreciation_rate || 20,
    residual_value: asset?.residual_value || 0,
    location_description: asset?.location_description || "",
    condition_status: asset?.condition_status || "excellent",
    assigned_employee_id: asset?.assigned_employee_id || "",
    warranty_end_date: asset?.warranty_end_date ? new Date(asset.warranty_end_date) : undefined,
    insurance_policy_number: asset?.insurance_policy_number || "",
    insurance_expiry_date: asset?.insurance_expiry_date ? new Date(asset.insurance_expiry_date) : undefined,
    maintenance_schedule: asset?.maintenance_schedule || "annual",
    barcode: asset?.barcode || "",
    qr_code: asset?.qr_code || "",
    tags: asset?.tags || [],
    notes: asset?.notes || ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees for assignment dropdown
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data?.map(emp => ({
        ...emp,
        full_name: `${emp.first_name} ${emp.last_name}`
      }));
    }
  });

  const saveAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const assetData = {
        ...data,
        purchase_date: format(data.purchase_date, 'yyyy-MM-dd'),
        warranty_end_date: data.warranty_end_date ? format(data.warranty_end_date, 'yyyy-MM-dd') : null,
        insurance_expiry_date: data.insurance_expiry_date ? format(data.insurance_expiry_date, 'yyyy-MM-dd') : null,
        status: 'active',
        book_value: data.purchase_cost - (data.purchase_cost * (data.depreciation_rate / 100)),
        accumulated_depreciation: 0,
        tenant_id: 'default-tenant'
      };

      if (asset?.id) {
        const { data: updatedAsset, error } = await supabase
          .from('fixed_assets')
          .update(assetData)
          .eq('id', asset.id)
          .select()
          .single();
        
        if (error) throw error;
        return updatedAsset;
      } else {
        const { data: newAsset, error } = await supabase
          .from('fixed_assets')
          .insert(assetData)
          .select()
          .single();
        
        if (error) throw error;
        return newAsset;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: asset?.id ? "تم تحديث الأصل بنجاح" : "تم إضافة الأصل بنجاح"
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAssetMutation.mutate(formData);
  };

  const generateAssetCode = () => {
    const category = formData.asset_category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    setFormData(prev => ({ ...prev, asset_code: `${category}${timestamp}` }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة أصل جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-8 w-8 p-0 hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-right pr-8">
            {asset?.id ? "تحديث الأصل الثابت" : "إضافة أصل ثابت جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="additional">بيانات إضافية</TabsTrigger>
              <TabsTrigger value="maintenance">الصيانة والضمان</TabsTrigger>
              <TabsTrigger value="assignment">التعيين والموقع</TabsTrigger>
              <TabsTrigger value="financial">البيانات المالية</TabsTrigger>
              <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">البيانات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset_name" className="text-right">اسم الأصل</Label>
                      <Input
                        id="asset_name"
                        value={formData.asset_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))}
                        placeholder="اسم الأصل"
                        className="text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asset_code" className="text-right">كود الأصل</Label>
                      <div className="flex gap-2">
                        <Input
                          id="asset_code"
                          value={formData.asset_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, asset_code: e.target.value }))}
                          placeholder="كود الأصل"
                          className="text-right"
                          required
                        />
                        <Button type="button" variant="outline" onClick={generateAssetCode}>
                          توليد
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset_category" className="text-right">فئة الأصل</Label>
                      <Select value={formData.asset_category} onValueChange={(value) => setFormData(prev => ({ ...prev, asset_category: value }))}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر فئة الأصل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehicles">المركبات</SelectItem>
                          <SelectItem value="buildings">المباني</SelectItem>
                          <SelectItem value="equipment">المعدات</SelectItem>
                          <SelectItem value="furniture">الأثاث</SelectItem>
                          <SelectItem value="computer_hardware">الأجهزة الحاسوبية</SelectItem>
                          <SelectItem value="machinery">الآلات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition_status" className="text-right">حالة الأصل</Label>
                      <Select value={formData.condition_status} onValueChange={(value) => setFormData(prev => ({ ...prev, condition_status: value }))}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر حالة الأصل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">ممتازة</SelectItem>
                          <SelectItem value="good">جيدة</SelectItem>
                          <SelectItem value="fair">مقبولة</SelectItem>
                          <SelectItem value="poor">ضعيفة</SelectItem>
                          <SelectItem value="needs_repair">تحتاج إصلاح</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-right">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية عن الأصل"
                      className="text-right"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">البيانات المالية والإهلاك</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_cost" className="text-right">تكلفة الشراء (د.ك)</Label>
                      <Input
                        id="purchase_cost"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.purchase_cost}
                        onChange={(e) => setFormData(prev => ({ ...prev, purchase_cost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.000"
                        className="text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date" className="text-right">تاريخ الشراء</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-right">
                            {formData.purchase_date ? format(formData.purchase_date, 'yyyy/MM/dd') : "اختر التاريخ"}
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.purchase_date}
                            onSelect={(date) => date && setFormData(prev => ({ ...prev, purchase_date: date }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="useful_life_years" className="text-right">العمر الإنتاجي (سنوات)</Label>
                      <Input
                        id="useful_life_years"
                        type="number"
                        min="1"
                        value={formData.useful_life_years}
                        onChange={(e) => setFormData(prev => ({ ...prev, useful_life_years: parseInt(e.target.value) || 5 }))}
                        className="text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depreciation_rate" className="text-right">معدل الإهلاك (%)</Label>
                      <Input
                        id="depreciation_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.depreciation_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, depreciation_rate: parseFloat(e.target.value) || 0 }))}
                        className="text-right"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="residual_value" className="text-right">القيمة المتبقية (د.ك)</Label>
                      <Input
                        id="residual_value"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.residual_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, residual_value: parseFloat(e.target.value) || 0 }))}
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depreciation_method" className="text-right">طريقة الإهلاك</Label>
                    <Select value={formData.depreciation_method} onValueChange={(value) => setFormData(prev => ({ ...prev, depreciation_method: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر طريقة الإهلاك" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight_line">الخط المستقيم</SelectItem>
                        <SelectItem value="declining_balance">الرصيد المتناقص</SelectItem>
                        <SelectItem value="units_of_production">وحدات الإنتاج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">التعيين والموقع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assigned_employee" className="text-right">الموظف المعين</Label>
                      <Select value={formData.assigned_employee_id || "unassigned"} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_employee_id: value === "unassigned" ? undefined : value }))}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">غير معين</SelectItem>
                          {employees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location_description" className="text-right">وصف الموقع</Label>
                      <Input
                        id="location_description"
                        value={formData.location_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                        placeholder="موقع الأصل أو القسم"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="barcode" className="text-right">الباركود</Label>
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                          placeholder="رمز الباركود"
                          className="text-right"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <Barcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qr_code" className="text-right">رمز QR</Label>
                      <div className="flex gap-2">
                        <Input
                          id="qr_code"
                          value={formData.qr_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, qr_code: e.target.value }))}
                          placeholder="رمز QR"
                          className="text-right"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">الصيانة والضمان</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_schedule" className="text-right">جدولة الصيانة</Label>
                      <Select value={formData.maintenance_schedule} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_schedule: value }))}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر جدولة الصيانة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">شهرية</SelectItem>
                          <SelectItem value="quarterly">ربع سنوية</SelectItem>
                          <SelectItem value="semi_annual">نصف سنوية</SelectItem>
                          <SelectItem value="annual">سنوية</SelectItem>
                          <SelectItem value="biennial">كل سنتين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warranty_end_date" className="text-right">انتهاء الضمان</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-right">
                            {formData.warranty_end_date ? format(formData.warranty_end_date, 'yyyy/MM/dd') : "اختر التاريخ"}
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.warranty_end_date}
                            onSelect={(date) => setFormData(prev => ({ ...prev, warranty_end_date: date }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_policy_number" className="text-right">رقم بوليصة التأمين</Label>
                      <Input
                        id="insurance_policy_number"
                        value={formData.insurance_policy_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurance_policy_number: e.target.value }))}
                        placeholder="رقم بوليصة التأمين"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance_expiry_date" className="text-right">انتهاء التأمين</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-right">
                            {formData.insurance_expiry_date ? format(formData.insurance_expiry_date, 'yyyy/MM/dd') : "اختر التاريخ"}
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.insurance_expiry_date}
                            onSelect={(date) => setFormData(prev => ({ ...prev, insurance_expiry_date: date }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">بيانات إضافية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-right">الصور والمستندات</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">اسحب الملفات هنا أو انقر للرفع</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        اختيار الملفات
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right">العلامات (Tags)</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {tag}
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" type="button">
                        <Plus className="h-3 w-3 ml-1" />
                        إضافة علامة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={saveAssetMutation.isPending}
              className="px-8"
            >
              {saveAssetMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}