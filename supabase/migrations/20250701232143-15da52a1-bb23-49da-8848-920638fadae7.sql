-- Create table for office locations
CREATE TABLE public.office_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "المديرون يمكنهم إدارة مواقع المكاتب"
ON public.office_locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية مواقع المكاتب"
ON public.office_locations
FOR SELECT
TO authenticated
USING (is_active = true);

-- Insert default Kuwait office location
INSERT INTO public.office_locations (name, address, latitude, longitude, radius)
VALUES ('المكتب الرئيسي', 'الكويت العاصمة', 29.3375, 47.9744, 100);

-- Create attendance settings table
CREATE TABLE public.attendance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_manual_override BOOLEAN NOT NULL DEFAULT false,
  require_location BOOLEAN NOT NULL DEFAULT true,
  max_distance_meters INTEGER NOT NULL DEFAULT 100,
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "المديرون يمكنهم إدارة إعدادات الحضور"
ON public.attendance_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية إعدادات الحضور"
ON public.attendance_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.attendance_settings (allow_manual_override, require_location, max_distance_meters, grace_period_minutes)
VALUES (false, true, 100, 15);

-- Update attendance table to include more location details
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS distance_from_office NUMERIC;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS override_reason TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS office_location_id UUID REFERENCES public.office_locations(id);