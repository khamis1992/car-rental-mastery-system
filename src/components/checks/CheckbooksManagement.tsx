import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCheckbooks } from "@/hooks/useCheckbooks";
import { CheckbookForm } from "./CheckbookForm";

export function CheckbooksManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCheckbook, setEditingCheckbook] = useState(null);
  const { checkbooks, loading, deleteCheckbook } = useCheckbooks();

  const filteredCheckbooks = checkbooks.filter(checkbook =>
    checkbook.checkbook_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    checkbook.bank_account?.bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, remainingChecks: number) => {
    if (status === 'completed' || remainingChecks === 0) {
      return <Badge variant="secondary">مكتمل</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="destructive">ملغي</Badge>;
    } else if (remainingChecks <= 10) {
      return <Badge variant="destructive">شارف على الانتهاء</Badge>;
    } else {
      return <Badge variant="default">نشط</Badge>;
    }
  };

  const handleEdit = (checkbook: any) => {
    setEditingCheckbook(checkbook);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف دفتر الشيكات؟')) {
      await deleteCheckbook(id);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCheckbook(null);
  };

  if (loading) {
    return <div className="animate-pulse">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* الرأس والبحث */}
      <div className="flex items-center justify-between flex-row-reverse">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCheckbook(null)} className="rtl-flex">
              <Plus className="h-4 w-4" />
              دفتر شيكات جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="rtl-title">
                {editingCheckbook ? 'تعديل دفتر الشيكات' : 'دفتر شيكات جديد'}
              </DialogTitle>
            </DialogHeader>
            <CheckbookForm 
              checkbook={editingCheckbook} 
              onSuccess={closeDialog}
            />
          </DialogContent>
        </Dialog>

        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في دفاتر الشيكات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* قائمة دفاتر الشيكات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCheckbooks.map((checkbook) => (
          <Card key={checkbook.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-2 rtl-flex">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{checkbook.checkbook_number}</CardTitle>
                </div>
                {getStatusBadge(checkbook.status, checkbook.remaining_checks)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">البنك:</span>
                  <span className="font-medium">{checkbook.bank_account?.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الحساب:</span>
                  <span className="font-medium">{checkbook.bank_account?.account_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">نطاق الأرقام:</span>
                  <span className="font-medium">
                    {checkbook.start_check_number} - {checkbook.end_check_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي الشيكات:</span>
                  <span className="font-medium">{checkbook.total_checks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المستخدم:</span>
                  <span className="font-medium text-primary">{checkbook.used_checks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المتبقي:</span>
                  <span className={`font-medium ${
                    checkbook.remaining_checks <= 10 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {checkbook.remaining_checks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">تاريخ الإصدار:</span>
                  <span className="font-medium">
                    {new Date(checkbook.issue_date).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(checkbook.used_checks / checkbook.total_checks) * 100}%` 
                  }}
                />
              </div>

              {/* الأزرار */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(checkbook)}
                  className="flex-1 rtl-flex"
                >
                  <Edit2 className="h-4 w-4" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(checkbook.id)}
                  className="flex-1 rtl-flex"
                  disabled={checkbook.used_checks > 0}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </Button>
              </div>

              {checkbook.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>ملاحظات:</strong> {checkbook.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCheckbooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد دفاتر شيكات</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإنشاء دفتر شيكات جديد لإدارة الشيكات الصادرة
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCheckbook(null)} className="rtl-flex">
                  <Plus className="h-4 w-4" />
                  إنشاء دفتر شيكات
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="rtl-title">دفتر شيكات جديد</DialogTitle>
                </DialogHeader>
                <CheckbookForm onSuccess={closeDialog} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}