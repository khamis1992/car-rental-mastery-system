import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeLocation {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export interface AttendanceSettings {
  id: string;
  allow_manual_override: boolean;
  require_location: boolean;
  max_distance_meters: number;
  grace_period_minutes: number;
}

export const useAttendanceSettings = () => {
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficeLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOfficeLocations(data || []);
    } catch (err) {
      console.error('خطأ في جلب مواقع المكاتب:', err);
      setError('فشل في جلب مواقع المكاتب');
    }
  };

  const fetchAttendanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setAttendanceSettings(data);
    } catch (err) {
      console.error('خطأ في جلب إعدادات الحضور:', err);
      setError('فشل في جلب إعدادات الحضور');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOfficeLocations(), fetchAttendanceSettings()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getDefaultOfficeLocation = (): OfficeLocation | null => {
    return officeLocations.length > 0 ? officeLocations[0] : null;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // نصف قطر الأرض بالأمتار
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const isInOfficeRange = (userLat: number, userLng: number): { 
    isValid: boolean; 
    distance: number; 
    office: OfficeLocation | null;
  } => {
    if (!attendanceSettings?.require_location) {
      return { isValid: true, distance: 0, office: null };
    }

    for (const office of officeLocations) {
      const distance = calculateDistance(userLat, userLng, office.latitude, office.longitude);
      if (distance <= office.radius) {
        return { isValid: true, distance, office };
      }
    }

    const defaultOffice = getDefaultOfficeLocation();
    const distance = defaultOffice 
      ? calculateDistance(userLat, userLng, defaultOffice.latitude, defaultOffice.longitude)
      : 0;

    return { isValid: false, distance, office: defaultOffice };
  };

  return {
    officeLocations,
    attendanceSettings,
    loading,
    error,
    getDefaultOfficeLocation,
    isInOfficeRange,
    refetch: () => {
      fetchOfficeLocations();
      fetchAttendanceSettings();
    }
  };
};