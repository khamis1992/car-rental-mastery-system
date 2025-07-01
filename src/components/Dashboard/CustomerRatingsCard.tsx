import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { ratingService, RatingStats, TopCustomer } from "@/services/ratingService";

const CustomerRatingsCard = () => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingStats, customers] = await Promise.all([
          ratingService.getRatingStats(),
          ratingService.getTopCustomers(3)
        ]);
        setStats(ratingStats);
        setTopCustomers(customers);
      } catch (error) {
        console.error('Error fetching rating data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            تقييمات العملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          تقييمات العملاء
        </CardTitle>
        <Button variant="outline" size="sm">
          عرض التفاصيل
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">المتوسط العام</h4>
            <div className="flex items-center gap-1">
              {renderStars(stats?.averageCustomerRating || 0)}
            </div>
          </div>
          <div className="text-3xl font-bold text-center">
            {stats?.averageCustomerRating || 0}
            <span className="text-sm text-muted-foreground ml-1">من 5</span>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-1">
            {stats?.totalEvaluations || 0} تقييم
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          <h5 className="font-medium text-sm">توزيع التقييمات</h5>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats?.excellentRatings || 0}</div>
              <div className="text-xs text-muted-foreground">ممتاز</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats?.goodRatings || 0}</div>
              <div className="text-xs text-muted-foreground">جيد</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats?.poorRatings || 0}</div>
              <div className="text-xs text-muted-foreground">ضعيف</div>
            </div>
          </div>
        </div>

        {/* This Month's Performance */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm">هذا الشهر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars(stats?.thisMonthAverage || 0)}
            </div>
            <span className="font-semibold">{stats?.thisMonthAverage || 0}</span>
          </div>
        </div>

        {/* Top Customers */}
        <div className="space-y-3">
          <h5 className="font-medium text-sm flex items-center gap-2">
            <Award className="w-4 h-4" />
            أفضل العملاء
          </h5>
          {topCustomers.length > 0 ? (
            topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.totalContracts} عقد • {customer.totalRevenue.toFixed(0)} د.ك
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {renderStars(customer.averageRating)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.averageRating}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              لا توجد تقييمات متاحة
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerRatingsCard;