import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { photoService } from '@/services/photoService';

interface VehicleConditionPhotosProps {
  contractId: string;
  vehicleInfo: string;
  type: 'pickup' | 'return';
  existingPhotos?: string[];
  existingNotes?: string;
  onPhotosChange: (photos: string[]) => void;
  onNotesChange: (notes: string) => void;
}

export const VehicleConditionPhotos: React.FC<VehicleConditionPhotosProps> = ({
  contractId,
  vehicleInfo,
  type,
  existingPhotos = [],
  existingNotes = '',
  onPhotosChange,
  onNotesChange
}) => {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [notes, setNotes] = useState(existingNotes);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedPhotos: string[] = [];

    try {
      for (const file of files) {
        const result = await photoService.uploadVehiclePhoto(file, {
          contractId,
          type,
          category: 'general',
          timestamp: new Date().toISOString()
        });

        if (result.error) {
          throw new Error(result.error);
        }

        uploadedPhotos.push(result.url);
      }

      const newPhotos = [...photos, ...uploadedPhotos];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);

      toast({
        title: "تم بنجاح",
        description: `تم رفع ${uploadedPhotos.length} صورة بنجاح`,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في رفع الصور",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (photoUrl: string, index: number) => {
    try {
      const success = await photoService.deleteVehiclePhoto(photoUrl);
      
      if (!success) {
        throw new Error('فشل في حذف الصورة من التخزين');
      }

      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);

      toast({
        title: "تم بنجاح",
        description: "تم حذف الصورة بنجاح",
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف الصورة",
        variant: "destructive",
      });
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  const typeLabel = type === 'pickup' ? 'التسليم' : 'الاستلام';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          حالة المركبة عند {typeLabel} - {vehicleInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Upload Section */}
        <div>
          <Label>صور حالة المركبة</Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full mb-4"
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploading ? 'جاري الرفع...' : 'التقاط/رفع صور'}
            </Button>
          </div>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`حالة المركبة ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(photo, index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(photo, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div>
          <Label htmlFor={`notes-${type}`}>ملاحظات حالة المركبة</Label>
          <Textarea
            id={`notes-${type}`}
            placeholder={`أدخل ملاحظات حول حالة المركبة عند ${typeLabel}...`}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            className="mt-2"
          />
        </div>

        {photos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم التقاط أي صور لحالة المركبة بعد</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};