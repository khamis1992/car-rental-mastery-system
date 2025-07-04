import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { serviceContainer } from "@/services/Container/ServiceContainer";
import { formatCurrencyKWD } from "@/lib/currency";

const RecentContracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const contractService = serviceContainer.getContractBusinessService();

  useEffect(() => {
    loadRecentContracts();
  }, []);

  const loadRecentContracts = async () => {
    try {
      setLoading(true);
      const data = await contractService.getRecentContracts(5);
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading recent contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'draft': return 'bg-secondary text-secondary-foreground';
      case 'cancelled': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'pending': return 'معلق';
      case 'draft': return 'مسودة';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const handlePrintContract = (contractId: string) => {
    const printUrl = `/contracts/print/${contractId}`;
    window.open(printUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
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
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            جاري تحميل العقود الحديثة...
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عقود حديثة متاحة
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contract.contract_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {contract.customer_name || 'عميل غير محدد'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-primary">
                      {formatCurrencyKWD(contract.final_amount)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={contract.status === 'active' ? 'default' : 'secondary'}
                        className={getStatusColor(contract.status)}
                      >
                        {getStatusText(contract.status)}
                      </Badge>
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintContract(contract.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentContracts;