import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, AlertCircle, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceManagement } from '@/components/Attendance/AttendanceManagement';
import { attendanceService } from '@/services/attendanceService';

const Attendance = () => {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // تحديد مستوى الصلاحية
  const isAdmin = profile?.role === 'admin';
  const isHR = profile?.role === 'manager';
  const hasManagementAccess = isAdmin || isHR;

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // الحصول على الموقع الحالي
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('خطأ في الحصول على الموقع:', error);
        }
      );
    }
  }, []);

  const mockAttendanceData = [
    {
      id: '1',
      date: '2024-01-15',
      check_in_time: '08:00',
      check_out_time: '17:00',
      total_hours: 8.0,
      overtime_hours: 0,
      status: 'present'
    },
    {
      id: '2',
      date: '2024-01-14',
      check_in_time: '08:15',
      check_out_time: '17:30',
      total_hours: 8.25,
      overtime_hours: 0.25,
      status: 'late'
    },
    {
      id: '3',
      date: '2024-01-13',
      check_in_time: null,
      check_out_time: null,
      total_hours: 0,
      overtime_hours: 0,
      status: 'absent'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'حاضر', variant: 'default' as const, icon: CheckCircle },
      absent: { label: 'غائب', variant: 'destructive' as const, icon: XCircle },
      late: { label: 'متأخر', variant: 'secondary' as const, icon: AlertCircle },
      early_leave: { label: 'انصراف مبكر', variant: 'secondary' as const, icon: AlertCircle },
      sick: { label: 'إجازة مرضية', variant: 'outline' as const, icon: AlertCircle },
      vacation: { label: 'إجازة', variant: 'outline' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleCheckIn = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      setCheckInTime(new Date());
    } else {
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

  const calculateWorkingHours = () => {
    if (checkInTime) {
      const diffInHours = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      return diffInHours.toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      {/* Header Section */}
      <div className="bg-gradient-primary text-white p-6 shadow-elegant">
        <div className="container mx-auto">
          <div className="rtl-header">
            <div className="rtl-title text-white">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold text-white">نظام الحضور والانصراف</h1>
                <p className="text-white/80 mt-1">تسجيل الحضور ومتابعة ساعات العمل</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">

        {/* Statistics Cards */}
        {!isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-elegant text-center">
              <CardContent className="p-6">
                <div className="rtl-info-item justify-center mb-2">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
                <div className="text-2xl font-bold text-warning mb-1">12</div>
                <div className="text-sm text-muted-foreground">ساعات إضافية</div>
              </CardContent>
            </Card>

            <Card className="card-elegant text-center">
              <CardContent className="p-6">
                <div className="rtl-info-item justify-center mb-2">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">176</div>
                <div className="text-sm text-muted-foreground">ساعات العمل</div>
              </CardContent>
            </Card>

            <Card className="card-elegant text-center">
              <CardContent className="p-6">
                <div className="rtl-info-item justify-center mb-2">
                  <XCircle className="w-8 h-8 text-danger" />
                </div>
                <div className="text-2xl font-bold text-danger mb-1">1</div>
                <div className="text-sm text-muted-foreground">أيام الغياب</div>
              </CardContent>
            </Card>

            <Card className="card-elegant text-center">
              <CardContent className="p-6">
                <div className="rtl-info-item justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div className="text-2xl font-bold text-success mb-1">22</div>
                <div className="text-sm text-muted-foreground">أيام الحضور</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* عرض إدارة الحضور مباشرة للمدير */}
        {isAdmin ? (
          <AttendanceManagement />
        ) : (
          /* Employee Tabs Section */
          <Tabs defaultValue="today" className="space-y-6">
            <div className="rtl-header">
              <TabsList className="bg-muted">
                <TabsTrigger value="today" className="rtl-button">
                  <Clock className="w-4 h-4" />
                  اليوم
                </TabsTrigger>
                <TabsTrigger value="history" className="rtl-button">
                  <FileText className="w-4 h-4" />
                  السجل
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="today">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="rtl-title">
                    <Clock className="w-5 h-5" />
                    حضور اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isCheckedIn ? (
                    <div className="space-y-6">
                      <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                        <div className="rtl-header">
                          <Badge className="bg-success text-success-foreground">حاضر</Badge>
                          <div>
                            <h3 className="font-semibold text-success">تم تسجيل الحضور</h3>
                            <p className="text-sm text-success/80">
                              الوقت: {checkInTime && format(checkInTime, 'HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Card className="border-muted">
                        <CardContent className="p-6">
                          <h3 className="rtl-title mb-4">
                            <Users className="w-4 h-4" />
                            إحصائيات اليوم
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rtl-info-item">
                              <span className="font-semibold">{calculateWorkingHours()} ساعة</span>
                              <span className="text-muted-foreground">ساعات العمل</span>
                            </div>
                            <div className="rtl-info-item">
                              <span className="font-semibold text-success">حاضر</span>
                              <span className="text-muted-foreground">الحالة</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <div className="text-muted-foreground text-lg">
                        لم يتم تسجيل الحضور بعد
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="rtl-title">
                    <FileText className="w-5 h-5" />
                    سجل الحضور
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAttendanceData.map((record) => (
                      <Card key={record.id} className="border-muted hover:shadow-md transition-all">
                        <CardContent className="p-6">
                          <div className="rtl-header mb-4">
                            {getStatusBadge(record.status)}
                            <h3 className="font-semibold text-lg">
                              {format(new Date(record.date), 'dd MMMM yyyy', { locale: ar })}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="rtl-info-item">
                              <span className="font-semibold">{record.check_in_time || 'لم يسجل'}</span>
                              <span className="text-muted-foreground">الحضور</span>
                            </div>
                            <div className="rtl-info-item">
                              <span className="font-semibold">{record.check_out_time || 'لم يسجل'}</span>
                              <span className="text-muted-foreground">الانصراف</span>
                            </div>
                            <div className="rtl-info-item">
                              <span className="font-semibold">{record.total_hours} ساعة</span>
                              <span className="text-muted-foreground">ساعات العمل</span>
                            </div>
                            <div className="rtl-info-item">
                              <span className="font-semibold">{record.overtime_hours} ساعة</span>
                              <span className="text-muted-foreground">ساعات إضافية</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Attendance;