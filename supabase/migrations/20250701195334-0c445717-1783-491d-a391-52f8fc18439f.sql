-- Create storage buckets for vehicle condition photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-conditions', 'vehicle-conditions', true);

-- Create policies for vehicle condition photos storage
CREATE POLICY "Vehicle condition photos are viewable by authenticated users" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-conditions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff can upload vehicle condition photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-conditions' AND (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'receptionist'::user_role)
));

CREATE POLICY "Staff can update vehicle condition photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-conditions' AND (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'receptionist'::user_role)
));

-- Add vehicle condition photo fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN pickup_photos TEXT[],
ADD COLUMN return_photos TEXT[],
ADD COLUMN pickup_condition_notes TEXT,
ADD COLUMN return_condition_notes TEXT;