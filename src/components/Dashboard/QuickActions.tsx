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
      <CardContent className="p-6">
        <div className="space-y-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`w-full p-6 rounded-2xl text-white hover:scale-[1.02] transition-all duration-200 flex flex-col items-center gap-3 shadow-lg ${action.className}`}
              onClick={action.onClick}
            >
              <div className="text-2xl">
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg mb-1">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;