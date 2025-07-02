import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Eye, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { photoService } from '@/services/photoService';
import type { DamageArea } from './VehicleDiagramInteractive';

interface DamageDetailDialogProps {
  damage: DamageArea | null;
  contractId: string;
  type: 'pickup' | 'return';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (damage: DamageArea) => void;
  onDelete?: (damageId: string) => void;
  readonly?: boolean;
}

export const DamageDetailDialog: React.FC<DamageDetailDialogProps> = ({
  damage,
  contractId,
  type,
  open,
  onOpenChange,
  onSave,
  onDelete,
  readonly = false
}) => {
  const [editedDamage, setEditedDamage] = useState<DamageArea | null>(damage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedDamage(damage);
  }, [damage]);

  if (!damage || !editedDamage) return null;

  const handleSave = () => {
    if (!editedDamage.description.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وصف للضرر",
        variant: "destructive",
      });
      return;
    }

    onSave(editedDamage);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(damage.id);
    }
    onOpenChange(false);
  };

  const updateDamage = (field: keyof DamageArea, value: any) => {
    setEditedDamage(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedPhotos: string[] = [];

    try {
      for (const file of files) {
        const result = await photoService.uploadVehiclePhoto(file, {
          contractId,
          type,
          category: 'damage',
          description: `Damage: ${damage.id}`,
          timestamp: new Date().toISOString()
        });

        if (result.error) {
          throw new Error(result.error);
        }

        uploadedPhotos.push(result.url);
      }

      const currentPhotos = editedDamage.photos || [];
      const newPhotos = [...currentPhotos, ...uploadedPhotos];
      updateDamage('photos', newPhotos);

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

      const currentPhotos = editedDamage.photos || [];
      const newPhotos = currentPhotos.filter((_, i) => i !== index);
      updateDamage('photos', newPhotos);

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

  const getSeverityLabel = (severity: DamageArea['severity']) => {
    switch (severity) {
      case 'minor': return 'بسيط';
      case 'major': return 'متوسط';
      case 'critical': return 'شديد';
      default: return severity;
    }
  };

  const getSeverityColor = (severity: DamageArea['severity']) => {
    switch (severity) {
      case 'minor': return 'secondary';
      case 'major': return 'default';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            تفاصيل الضرر
            <Badge variant={getSeverityColor(editedDamage.severity)}>
              {getSeverityLabel(editedDamage.severity)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Damage Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">مستوى الضرر</Label>
              <Select
                value={editedDamage.severity}
                onValueChange={(value: DamageArea['severity']) => updateDamage('severity', value)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">بسيط</SelectItem>
                  <SelectItem value="major">متوسط</SelectItem>
                  <SelectItem value="critical">شديد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الموقع في المخطط</Label>
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                X: {editedDamage.x.toFixed(1)}% | Y: {editedDamage.y.toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">وصف الضرر</Label>
            <Textarea
              id="description"
              placeholder="اكتب وصفاً مفصلاً للضرر أو العيب..."
              value={editedDamage.description}
              onChange={(e) => updateDamage('description', e.target.value)}
              rows={3}
              disabled={readonly}
            />
          </div>

          {/* Photo Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>صور الضرر</Label>
              {!readonly && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? 'جاري الرفع...' : 'إضافة صور'}
                  </Button>
                </div>
              )}
            </div>

            {editedDamage.photos && editedDamage.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {editedDamage.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`ضرر ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      {!readonly && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePhoto(photo, index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(photo, '_blank')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد صور للضرر</p>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {editedDamage.timestamp && (
            <div className="text-xs text-muted-foreground">
              تم التسجيل: {new Date(editedDamage.timestamp).toLocaleString('ar-SA')}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {onDelete && !readonly && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف الضرر
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {readonly ? 'إغلاق' : 'إلغاء'}
              </Button>
              {!readonly && (
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};