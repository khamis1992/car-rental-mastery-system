import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Send } from "lucide-react";

export function PaidChecksManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* الرأس والبحث */}
      <div className="flex items-center justify-between flex-row-reverse">
        <Button className="rtl-flex">
          <Plus className="h-4 w-4" />
          شيك جديد
        </Button>

        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الشيكات المدفوعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* المحتوى */}
      <Card>
        <CardContent className="text-center py-12">
          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد شيكات مدفوعة</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإنشاء شيك جديد لإدارة الشيكات المدفوعة
          </p>
          <Button className="rtl-flex">
            <Plus className="h-4 w-4" />
            إنشاء شيك جديد
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}