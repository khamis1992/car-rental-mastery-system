import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentContracts = () => {
  const navigate = useNavigate();
  
  const contracts = [
    {
      id: "C001",
      customerName: "محمد أحمد علي",
      carModel: "تويوتا كامري 2023",
      startDate: "2024-01-01",
      endDate: "2024-01-07",
      status: "نشط",
      amount: "12 د.ك"
    },
    {
      id: "C002", 
      customerName: "فاطمة سالم",
      carModel: "هونداي النترا 2022",
      startDate: "2024-01-02",
      endDate: "2024-01-05",
      status: "منتهي",
      amount: "8 د.ك"
    },
    {
      id: "C003",
      customerName: "خالد المطيري", 
      carModel: "نيسان ألتيما 2023",
      startDate: "2024-01-03",
      endDate: "2024-01-10",
      status: "نشط",
      amount: "15 د.ك"
    }
  ];

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
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{contract.customerName}</div>
                  <div className="text-sm text-muted-foreground">{contract.carModel}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {contract.startDate} - {contract.endDate}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground mb-1">{contract.amount}</div>
                <Badge className={getStatusColor(contract.status)}>
                  {contract.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentContracts;