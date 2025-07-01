import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, User, Calendar } from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      title: "عقد جديد",
      description: "إنشاء عقد تأجير جديد",
      icon: <Plus className="w-5 h-5" />,
      className: "btn-royal"
    },
    {
      title: "عميل جديد",
      description: "إضافة عميل للنظام",
      icon: <User className="w-5 h-5" />,
      className: "btn-emerald"
    },
    {
      title: "حجز سريع",
      description: "حجز سيارة بسرعة",
      icon: <Calendar className="w-5 h-5" />,
      className: "btn-purple"
    },
    {
      title: "تقرير يومي",
      description: "إنشاء تقرير اليوم",
      icon: <FileText className="w-5 h-5" />,
      className: "btn-orange"
    }
  ];

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all border-0 ${action.className}`}
            >
              {action.icon}
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;