import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, FileText, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SuppliersService } from "@/services/suppliersService";
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";
import { SupplierDetailsDialog } from "@/components/suppliers/SupplierDetailsDialog";
import type { Supplier } from "@/types/suppliers";

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const queryClient = useQueryClient();

  // جلب البيانات
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: SuppliersService.getSuppliers,
  });

  const { data: stats } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: SuppliersService.getSupplierStats,
  });

  // تصفية الموردين
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone && supplier.phone.includes(searchTerm))
  );

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsDialog(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* العنوان والإحصائيات */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight rtl-title">إدارة الموردين</h2>
          <p className="text-muted-foreground">
            إدارة الموردين والحسابات الدائنة
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="rtl-flex">
          <Plus className="h-4 w-4" />
          مورد جديد
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">مورد نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">فاتورة غير مدفوعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المديونية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalPayables?.toFixed(3) || '0.000'} د.ك
            </div>
            <p className="text-xs text-muted-foreground">مبلغ مستحق للموردين</p>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الموردين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" className="rtl-flex">
          <Filter className="h-4 w-4" />
          تصفية
        </Button>
      </div>

      {/* قائمة الموردين */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">قائمة الموردين</CardTitle>
          <CardDescription>
            جميع الموردين المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">جاري تحميل البيانات...</div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد موردين مسجلين</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {supplier.supplier_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{supplier.supplier_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        كود: {supplier.supplier_code} • {supplier.supplier_type === 'company' ? 'شركة' : 'فرد'}
                      </p>
                      {supplier.phone && (
                        <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {supplier.current_balance?.toFixed(3) || '0.000'} د.ك
                      </p>
                      <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                    </div>
                    
                    <Badge 
                      variant={supplier.is_active ? "default" : "secondary"}
                    >
                      {supplier.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نوافذ الحوار */}
      <SupplierFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {selectedSupplier && (
        <SupplierDetailsDialog
          supplier={selectedSupplier}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
}