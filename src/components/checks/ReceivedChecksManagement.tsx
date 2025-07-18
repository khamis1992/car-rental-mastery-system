import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Receipt } from "lucide-react";

export function ReceivedChecksManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* الرأس والبحث */}
      <div className="flex items-center justify-between flex-row-reverse">
        <Button className="rtl-flex">
          <Plus className="h-4 w-4" />
          شيك مستلم جديد
        </Button>

        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الشيكات المستلمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* المحتوى */}
      <Card>
        <CardContent className="text-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد شيكات مستلمة</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بتسجيل شيك مستلم جديد لإدارة الشيكات المستلمة
          </p>
          <Button className="rtl-flex">
            <Plus className="h-4 w-4" />
            تسجيل شيك مستلم
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}