import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleDiagramInteractive, type DamageArea } from './VehicleDiagramInteractive';
import { DamageDetailDialog } from './DamageDetailDialog';
import { VehicleConditionPhotos } from '../VehicleConditionPhotos';
import { Car, Camera, Map, List } from 'lucide-react';

interface VehicleConditionDiagramSectionProps {
  contractId: string;
  vehicleInfo: string;
  type: 'pickup' | 'return';
  damages: DamageArea[];
  onDamagesChange: (damages: DamageArea[]) => void;
  photos: string[];
  notes: string;
  onPhotosChange: (photos: string[]) => void;
  onNotesChange: (notes: string) => void;
  readonly?: boolean;
}

export const VehicleConditionDiagramSection: React.FC<VehicleConditionDiagramSectionProps> = ({
  contractId,
  vehicleInfo,
  type,
  damages,
  onDamagesChange,
  photos,
  notes,
  onPhotosChange,
  onNotesChange,
  readonly = false
}) => {
  const [selectedDamage, setSelectedDamage] = useState<DamageArea | null>(null);
  const [tempDamage, setTempDamage] = useState<DamageArea | null>(null);
  const [isNewDamage, setIsNewDamage] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram');

  const typeLabel = type === 'pickup' ? 'التسليم' : 'الاستلام';

  const handleDamageSelect = (damage: DamageArea) => {
    console.log('📝 Selecting damage for editing:', damage);
    setSelectedDamage(damage);
    setIsNewDamage(false);
    setTempDamage(null);
  };

  const handleDamageSave = (damage: DamageArea) => {
    console.log('💾 Saving damage:', damage, 'isNewDamage:', isNewDamage);
    
    // Validate damage before saving
    if (!damage.description?.trim()) {
      console.warn('⚠️ Attempting to save damage without description');
      return;
    }
    
    if (isNewDamage) {
      // Add new damage to the list
      console.log('➕ Adding new damage to list. Current damages:', damages.length);
      const updatedDamages = [...damages, damage];
      onDamagesChange(updatedDamages);
    } else {
      // Update existing damage
      console.log('✏️ Updating existing damage. Current damages:', damages.length);
      const updatedDamages = [...damages.filter(d => d.id !== damage.id), damage];
      onDamagesChange(updatedDamages);
    }
    
    // Reset state
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  const handleDamageDelete = (damageId: string) => {
    const updatedDamages = damages.filter(d => d.id !== damageId);
    onDamagesChange(updatedDamages);
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  const handleDamageCreate = (damage: DamageArea) => {
    console.log('🆕 Creating new damage (temporary):', damage);
    console.log('📊 Current damages before creation:', damages.length);
    
    // Only set temporary state - don't add to damages list yet
    setTempDamage(damage);
    setSelectedDamage(damage);
    setIsNewDamage(true);
  };

  const handleDialogClose = () => {
    console.log('❌ Dialog closed - resetting temporary states');
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          حالة المركبة عند {typeLabel} - {vehicleInfo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              المخطط التفاعلي
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              الصور والملاحظات
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              ملخص الحالة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="mt-6">
            <VehicleDiagramInteractive
              type={type}
              contractId={contractId}
              damages={damages} // Only show saved damages, not temporary ones
              onDamageCreate={handleDamageCreate}
              onDamageSelect={handleDamageSelect}
              readonly={readonly}
            />
            
            {/* Show temporary damage marker if exists */}
            {tempDamage && isNewDamage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">ضرر جديد في الانتظار</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    انقر "حفظ" في النافذة لإضافة الضرر
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <VehicleConditionPhotos
              contractId={contractId}
              vehicleInfo={vehicleInfo}
              type={type}
              existingPhotos={photos}
              existingNotes={notes}
              onPhotosChange={onPhotosChange}
              onNotesChange={onNotesChange}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <div className="space-y-4">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {damages.filter(d => d.severity === 'minor').length}
                  </div>
                  <div className="text-sm text-yellow-700">أضرار بسيطة</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {damages.filter(d => d.severity === 'major').length}
                  </div>
                  <div className="text-sm text-orange-700">أضرار متوسطة</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {damages.filter(d => d.severity === 'critical').length}
                  </div>
                  <div className="text-sm text-red-700">أضرار شديدة</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {photos.length}
                  </div>
                  <div className="text-sm text-blue-700">صور مرفقة</div>
                </div>
              </div>

              {/* Damage List */}
              {damages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">قائمة الأضرار المسجلة:</h4>
                  <div className="space-y-2">
                    {damages.map((damage) => (
                      <div
                        key={damage.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => handleDamageSelect(damage)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              damage.severity === 'minor' ? 'bg-yellow-400' :
                              damage.severity === 'major' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                          />
                          <span className="text-sm">
                            {damage.description || 'ضرر غير محدد'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {damage.photos && damage.photos.length > 0 && (
                            <Camera className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {damage.severity === 'minor' && 'بسيط'}
                            {damage.severity === 'major' && 'متوسط'}
                            {damage.severity === 'critical' && 'شديد'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Preview */}
              {notes && (
                <div>
                  <h4 className="font-medium mb-2">ملاحظات إضافية:</h4>
                  <div className="p-3 bg-muted/20 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {damages.length === 0 && photos.length === 0 && !notes && (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم تسجيل أي معلومات حول حالة المركبة</p>
                  <p className="text-sm">استخدم التبويبات أعلاه لإضافة الأضرار والصور</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Damage Detail Dialog */}
        {selectedDamage && (
          <DamageDetailDialog
            damage={selectedDamage}
            contractId={contractId}
            type={type}
            open={!!selectedDamage}
            onOpenChange={(open) => {
              if (!open) {
                handleDialogClose();
              }
            }}
            onSave={handleDamageSave}
            onDelete={isNewDamage ? undefined : handleDamageDelete}
            readonly={readonly}
          />
        )}
      </CardContent>
    </Card>
  );
};