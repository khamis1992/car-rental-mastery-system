
import { Check, Crown } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  code?: string;
}

interface PlanSelectionStepProps {
  selectedPlan: Plan | null;
}

export function PlanSelectionStep({ selectedPlan }: PlanSelectionStepProps) {
  if (!selectedPlan) return null;

  const features = [
    "إدارة العقود والفواتير",
    "نظام محاسبة متكامل",
    "إدارة الموارد البشرية",
    "تقارير تفصيلية",
    "دعم فني متخصص",
    "نسخ احتياطية يومية",
    "أمان SSL متقدم",
    "دعم اللغة العربية الكامل"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">مراجعة الباقة المختارة</h3>
        <p className="text-muted-foreground">
          تأكد من تفاصيل الباقة قبل إتمام عملية الإنشاء
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
        <div className="text-center mb-6">
          <h4 className="text-2xl font-bold text-primary mb-2">{selectedPlan.name}</h4>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold">{selectedPlan.price}</span>
            {selectedPlan.price !== "مخصص" && <span className="text-lg">د.ك</span>}
            <span className="text-muted-foreground">{selectedPlan.period}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-semibold mb-3">المميزات المشمولة:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h4 className="font-medium mb-2 text-yellow-800">فترة تجريبية مجانية</h4>
        <p className="text-sm text-yellow-700">
          احصل على فترة تجريبية مجانية لمدة 14 يوم لاستكشاف جميع المميزات قبل بدء الفوترة.
        </p>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>بالنقر على "إنشاء الشركة"، أنت توافق على شروط الخدمة وسياسة الخصوصية</p>
      </div>
    </div>
  );
}
