
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: "عرض سعر جديد",
      description: "إنشاء عرض سعر جديد",
      icon: <Plus className="w-6 h-6" />,
      bgColor: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200 hover:border-blue-300",
      onClick: () => navigate('/quotations')
    },
    {
      title: "إدارة العملاء",
      description: "عرض وإدارة العملاء",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      borderColor: "border-green-200 hover:border-green-300",
      onClick: () => navigate('/customers')
    },
    {
      title: "الحضور والانصراف",
      description: "إدارة حضور الموظفين",
      icon: <Clock className="w-6 h-6" />,
      bgColor: "bg-orange-50 hover:bg-orange-100",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200 hover:border-orange-300",
      onClick: () => navigate('/attendance')
    }
  ];

  return (
    <Card className="card-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="rtl-title text-lg font-semibold">
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${action.bgColor} ${action.borderColor} border`}
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-white shadow-sm ${action.iconColor}`}>
                    {action.icon}
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-foreground mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowLeft className={`w-5 h-5 ${action.iconColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
