import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, User, Calendar, Users, Calculator, BarChart3, MessageSquare, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: "عرض سعر جديد",
      description: "إنشاء عرض سعر جديد",
      icon: <Plus className="w-5 h-5" />,
      className: "btn-royal",
      onClick: () => navigate('/quotations')
    },
    {
      title: "إدارة العملاء",
      description: "عرض وإدارة العملاء",
      icon: <Users className="w-5 h-5" />,
      className: "btn-emerald",
      onClick: () => navigate('/customers')
    },
    {
      title: "الحضور والانصراف",
      description: "إدارة حضور الموظفين",
      icon: <Clock className="w-5 h-5" />,
      className: "btn-orange",
      onClick: () => navigate('/attendance')
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
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all border-0 ${action.className}`}
              onClick={action.onClick}
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