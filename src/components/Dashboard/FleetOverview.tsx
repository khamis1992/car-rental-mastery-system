
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Car, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RealtimeIndicator } from "./RealtimeIndicator";

interface FleetOverviewProps {
  isUpdating?: boolean;
  isConnected?: boolean;
  lastUpdated?: Date | null;
}

const FleetOverview: React.FC<FleetOverviewProps> = ({
  isUpdating = false,
  isConnected = true,
  lastUpdated = null
}) => {
  const navigate = useNavigate();
  
  // مؤشرات الأسطول (يجب استبدالها بالبيانات الفعلية من الـ API)
  const fleetStats = {
    totalVehicles: 24,
    active: 18,
    maintenance: 3,
    available: 14,
    rented: 7,
  };
  
  const utilization = Math.round((fleetStats.rented / fleetStats.active) * 100);
  
  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row-reverse items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground rtl-title flex items-center gap-2">
          <Car className="h-5 w-5" />
          نظرة عامة على الأسطول
          {isUpdating && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
        {isConnected && (
          <RealtimeIndicator 
            isConnected={isConnected}
            isUpdating={isUpdating}
            lastUpdated={lastUpdated}
            size="sm"
          />
        )}
      </CardHeader>
      <CardContent className={`space-y-4 ${isUpdating ? 'animate-pulse' : ''}`}>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">معدل الاستخدام</span>
            <span className="font-medium">{utilization}%</span>
          </div>
          <Progress value={utilization} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="font-semibold text-xl">{fleetStats.active}</div>
            <div className="text-xs text-muted-foreground">مركبة نشطة</div>
          </div>
          <div className="bg-warning/10 p-3 rounded-lg">
            <div className="font-semibold text-xl">{fleetStats.maintenance}</div>
            <div className="text-xs text-muted-foreground">في الصيانة</div>
          </div>
          <div className="bg-success/10 p-3 rounded-lg">
            <div className="font-semibold text-xl">{fleetStats.available}</div>
            <div className="text-xs text-muted-foreground">متاحة للإيجار</div>
          </div>
          <div className="bg-secondary/10 p-3 rounded-lg">
            <div className="font-semibold text-xl">{fleetStats.rented}</div>
            <div className="text-xs text-muted-foreground">مؤجرة حالياً</div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={() => navigate('/vehicles')}
        >
          إدارة الأسطول
        </Button>
      </CardContent>
    </Card>
  );
};

export default FleetOverview;
