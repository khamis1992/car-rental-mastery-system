import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentContracts = () => {
  const navigate = useNavigate();
  
  const contracts: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-success text-success-foreground';
      case 'منتهي': return 'bg-muted text-muted-foreground';
      case 'متأخر': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          العقود الحديثة
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/contracts')}
          className="hover:scale-105 transition-transform"
        >
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          لا توجد عقود حديثة متاحة
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentContracts;