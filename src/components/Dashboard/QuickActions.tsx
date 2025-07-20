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
        <div className="grid gap-6">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 transition-all duration-300 hover:border-border cursor-pointer ${action.className}`}
              onClick={action.onClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-6 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="font-bold text-lg text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                    {action.title}
                  </div>
                  <div className="text-sm text-white/80 group-hover:text-white transition-colors duration-300">
                    {action.description}
                  </div>
                </div>
                
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;