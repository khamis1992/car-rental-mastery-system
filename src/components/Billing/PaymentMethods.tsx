import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard,
  Building,
  Plus,
  Edit,
  Trash2,
  Check
} from "lucide-react";

const PaymentMethods: React.FC = () => {
  const paymentMethods = [
    {
      id: 1,
      type: "تحويل بنكي",
      details: "البنك الأهلي الكويتي - حساب رقم ****1234",
      isDefault: true,
      isActive: true,
      lastUsed: "2024-01-15"
    },
    {
      id: 2,
      type: "بطاقة ائتمان",
      details: "Visa ****4567",
      isDefault: false,
      isActive: true,
      lastUsed: "2024-01-10"
    },
    {
      id: 3,
      type: "حوالة بنكية",
      details: "بنك الكويت الوطني - SWIFT: NBOKKWKW",
      isDefault: false,
      isActive: true,
      lastUsed: "2024-01-05"
    }
  ];

  const transactions = [
    {
      id: 1,
      tenant: "شركة البشائر الخليجية",
      amount: "500 د.ك",
      method: "تحويل بنكي",
      status: "مكتمل",
      date: "2024-01-15",
      statusColor: "bg-success"
    },
    {
      id: 2,
      tenant: "مؤسسة النقل الحديث",
      amount: "300 د.ك",
      method: "بطاقة ائتمان",
      status: "قيد المعالجة",
      date: "2024-01-14",
      statusColor: "bg-warning"
    },
    {
      id: 3,
      tenant: "شركة التوصيل السريع",
      amount: "150 د.ك",
      method: "تحويل بنكي",
      status: "مكتمل",
      date: "2024-01-13",
      statusColor: "bg-success"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>طرق الدفع المقبولة</CardTitle>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            إضافة طريقة دفع
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="border-muted">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {method.type === "بطاقة ائتمان" ? (
                          <CreditCard className="w-8 h-8 text-primary" />
                        ) : (
                          <Building className="w-8 h-8 text-primary" />
                        )}
                        <div>
                          <h3 className="font-semibold">{method.type}</h3>
                          {method.isDefault && (
                            <Badge className="text-xs bg-primary">افتراضي</Badge>
                          )}
                        </div>
                      </div>
                      {method.isActive && (
                        <Check className="w-5 h-5 text-success" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{method.details}</p>
                    <p className="text-xs text-muted-foreground">
                      آخر استخدام: {method.lastUsed}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>تعليمات الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">التحويل البنكي</h3>
              <div className="space-y-2 text-sm">
                <p><strong>اسم البنك:</strong> البنك الأهلي الكويتي</p>
                <p><strong>رقم الحساب:</strong> 1234567890</p>
                <p><strong>IBAN:</strong> KW12ABCD1234567890</p>
                <p><strong>SWIFT Code:</strong> ABCDKWKW</p>
                <p><strong>اسم المستفيد:</strong> شركة إدارة الأساطيل</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">البطاقات الائتمانية</h3>
              <div className="space-y-2 text-sm">
                <p>• Visa</p>
                <p>• Mastercard</p>
                <p>• American Express</p>
                <p>• K-Net (للعملاء المحليين)</p>
                <p className="text-muted-foreground">رسوم المعالجة: 2.5%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>المعاملات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary p-3 rounded-xl">
                        <CreditCard className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{transaction.tenant}</h4>
                        <p className="text-sm text-muted-foreground">{transaction.method}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-semibold">{transaction.amount}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                      
                      <Badge className={`text-white ${transaction.statusColor}`}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethods;