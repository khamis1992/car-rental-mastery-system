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
    <div className="min-h-screen bg-background font-['Tajawal']" dir="rtl">
      {/* العنوان مع خلفية زرقاء داكنة */}
      <div className="bg-[#1E3A8A] text-white p-6 shadow-lg">
      <div className="container mx-auto flex items-center justify-start">
        <div className="text-left flex items-center gap-4">
          <Calendar className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-3xl font-bold">نظام الحضور والانصراف</h1>
            <p className="text-blue-100 mt-1">تسجيل الحضور ومتابعة ساعات العمل</p>
          </div>
        </div>
      </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* قسم الساعة الرئيسي */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg rounded-lg">
            <CardContent className="p-8 text-center space-y-6">
              {/* الساعة الرقمية */}
              <div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {format(currentTime, 'HH:mm:ss', { locale: ar })}
                </div>
                <div className="text-xl text-muted-foreground">
                  {format(currentTime, 'dd MMMM yyyy', { locale: ar })}
                </div>
              </div>

              {/* حالة الموقع */}
              <div className="flex items-center justify-center gap-2">
                {location ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✅</span>
                    <span className="font-medium">الموقع متاح</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <span>❌</span>
                    <span className="font-medium">الموقع غير متاح</span>
                  </div>
                )}
              </div>

              {/* زر تسجيل الحضور */}
              <div className="space-y-4">
                {isCheckedIn ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      وقت الحضور: {checkInTime && format(checkInTime, 'HH:mm', { locale: ar })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ساعات العمل: {calculateWorkingHours()} ساعة
                    </div>
                    <Button 
                      onClick={handleCheckIn}
                      variant="destructive"
                      size="lg"
                      className="w-full py-4 text-lg rounded-lg"
                    >
                      <Clock className="w-6 h-6 ml-2" />
                      تسجيل الانصراف
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleCheckIn}
                    size="lg"
                    className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
                    disabled={!location}
                  >
                    <Clock className="w-6 h-6 ml-2" />
                    تسجيل الحضور
                  </Button>
                )}
              </div>

              {!location && (
                <div className="text-sm text-destructive bg-red-50 p-3 rounded-lg">
                  يجب السماح بالوصول للموقع لتسجيل الحضور
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* قسم المقاييس - 4 كروت متساوية العرض */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md rounded-lg border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm text-muted-foreground">ساعات إضافية</p>
                  <p className="text-3xl font-bold text-orange-600">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-lg border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm text-muted-foreground">ساعات العمل</p>
                  <p className="text-3xl font-bold text-blue-600">176</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-lg border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm text-muted-foreground">أيام الغياب</p>
                  <p className="text-3xl font-bold text-red-600">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-lg border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm text-muted-foreground">أيام الحضور</p>
                  <p className="text-3xl font-bold text-green-600">22</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قسم التبويبات مع محاذاة لليمين */}
        <Tabs defaultValue={isAdmin ? "management" : "today"} className="space-y-6">
          <div className="flex justify-end">
            <TabsList className="bg-gray-100 p-1 rounded-full">
              {isAdmin && (
                <TabsTrigger 
                  value="management" 
                  className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 ml-2" />
                  إدارة الحضور
                </TabsTrigger>
              )}
              {!isAdmin && (
                <>
                  <TabsTrigger 
                    value="history" 
                    className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    السجل
                  </TabsTrigger>
                  <TabsTrigger 
                    value="today" 
                    className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    اليوم
                  </TabsTrigger>
                </>
              )}
          </TabsList>
          </div>

          {/* تبويب إدارة الحضور - للمديرين فقط */}
          {isAdmin && (
            <TabsContent value="management">
              <AttendanceManagement />
            </TabsContent>
          )}

          {!isAdmin && (
            <TabsContent value="today">
            <Card className="shadow-lg rounded-lg">
              <CardHeader className="text-right">
                <CardTitle className="text-xl">حضور اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                {isCheckedIn ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 border border-green-200 rounded-lg bg-green-50">
                      <Badge variant="default" className="bg-green-600">حاضر</Badge>
                      <div className="text-right">
                        <h3 className="font-semibold text-green-800">تم تسجيل الحضور</h3>
                        <p className="text-sm text-green-600">
                          الوقت: {checkInTime && format(checkInTime, 'HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold mb-4 text-right">إحصائيات اليوم</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="text-right">
                          <span className="text-muted-foreground">ساعات العمل:</span>
                          <span className="mr-2 font-semibold">{calculateWorkingHours()} ساعة</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">الحالة:</span>
                          <span className="mr-2 text-green-600 font-semibold">حاضر</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground text-lg">
                      لم يتم تسجيل الحضور بعد
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {!isAdmin && (
            <TabsContent value="history">
            <Card className="shadow-lg rounded-lg">
              <CardHeader>
                <CardTitle className="text-right">سجل الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAttendanceData.map((record) => (
                    <div key={record.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-4 mb-4 justify-end">
                            {getStatusBadge(record.status)}
                            <h3 className="font-semibold text-lg">
                              {format(new Date(record.date), 'dd MMMM yyyy', { locale: ar })}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-right">
                            <div>
                              <span className="font-medium text-muted-foreground">الحضور:</span>
                              <div className="font-semibold">{record.check_in_time || 'لم يسجل'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">الانصراف:</span>
                              <div className="font-semibold">{record.check_out_time || 'لم يسجل'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">ساعات العمل:</span>
                              <div className="font-semibold">{record.total_hours} ساعة</div>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">ساعات إضافية:</span>
                              <div className="font-semibold">{record.overtime_hours} ساعة</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Attendance;