
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Users, 
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ModernQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "عرض سعر جديد",
      description: "إنشاء عرض سعر جديد",
      icon: Plus,
      bgColor: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      action: () => navigate('/quotes/new')
    },
    {
      title: "إدارة العملاء",
      description: "عرض وإدارة العملاء",
      icon: Users,
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      action: () => navigate('/customers')
    },
    {
      title: "الحجوز والبحوث",
      description: "إدارة حجوز المعدات",
      icon: Clock,
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      action: () => navigate('/reservations')
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="rtl-title text-center">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          
          return (
            <Button
              key={index}
              className={`w-full h-16 ${action.bgColor} ${action.hoverColor} text-white flex items-center justify-center gap-3 rounded-lg transition-colors`}
              onClick={action.action}
            >
              <IconComponent className="w-6 h-6" />
              <div className="text-center">
                <p className="font-medium text-sm leading-tight">{action.title}</p>
                <p className="text-xs opacity-90">
                  {action.description}
                </p>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
