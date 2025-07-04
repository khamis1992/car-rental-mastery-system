import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VehicleDiagramInteractive, type DamageArea } from './VehicleDiagramInteractive';
import { DamageDetailDialog } from './DamageDetailDialog';
import { VehicleConditionPhotos } from '../VehicleConditionPhotos';
import { Car, Camera, Map, List, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  const [activeTab, setActiveTab] = useState('summary');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  // Log data changes for debugging
  React.useEffect(() => {
    console.log('🔄 VehicleConditionDiagramSection: Data updated:', {
      type,
      damagesCount: damages?.length || 0,
      photosCount: photos?.length || 0,
      notesLength: notes?.length || 0,
      damages: damages?.map(d => ({ id: d.id, description: d.description })) || []
    });
  }, [damages, photos, notes, type]);

  const typeLabel = type === 'pickup' ? 'التسليم' : 'الاستلام';

  const handleDamageSelect = (damage: DamageArea) => {
    console.log('📝 Selecting damage for editing:', damage);
    setSelectedDamage(damage);
    setIsNewDamage(false);
    setTempDamage(null);
  };

  // Auto-save damages to database
  const saveDamagesToDatabase = useCallback(async (damagesToSave: DamageArea[]) => {
    if (readonly) return;
    
    setSaveStatus('saving');
    console.log('💾 Auto-saving damages to database:', damagesToSave.length, 'damages');
    
    try {
      const field = type === 'pickup' ? 'pickup_damages' : 'return_damages';
      
      const { error } = await supabase
        .from('contracts')
        .update({
          [field]: JSON.parse(JSON.stringify(damagesToSave)), // Convert to Json
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      console.log('✅ Damages auto-saved successfully');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error auto-saving damages:', error);
      setSaveStatus('error');
      
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الأضرار تلقائياً. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  }, [contractId, type, readonly, toast]);

  const handleDamageSave = async (damage: DamageArea) => {
    console.log('💾 Saving damage:', damage, 'isNewDamage:', isNewDamage);
    
    let updatedDamages: DamageArea[];
    
    if (isNewDamage) {
      // Add new damage to the list
      console.log('➕ Adding new damage to list. Current damages:', damages.length);
      updatedDamages = [...damages, damage];
    } else {
      // Update existing damage
      console.log('✏️ Updating existing damage. Current damages:', damages.length);
      updatedDamages = [...damages.filter(d => d.id !== damage.id), damage];
    }
    
    // Update local state
    onDamagesChange(updatedDamages);
    
    // Auto-save to database
    await saveDamagesToDatabase(updatedDamages);
    
    // Reset state
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  const handleDamageDelete = async (damageId: string) => {
    const updatedDamages = damages.filter(d => d.id !== damageId);
    onDamagesChange(updatedDamages);
    
    // Auto-save to database
    await saveDamagesToDatabase(updatedDamages);
    
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  const handleDamageCreate = (damage: DamageArea) => {
    console.log('🆕 VehicleConditionDiagramSection: handleDamageCreate called with:', damage);
    console.log('📊 Current damages before creation:', damages.length);
    console.log('📊 Current state - selectedDamage:', selectedDamage?.id, 'tempDamage:', tempDamage?.id, 'isNewDamage:', isNewDamage);
    
    try {
      // Only set temporary state - don't add to damages list yet
      setTempDamage(damage);
      setSelectedDamage(damage);
      setIsNewDamage(true);
      console.log('✅ State updated successfully - dialog should open now');
    } catch (error) {
      console.error('❌ Error in handleDamageCreate:', error);
    }
  };

  const handleDialogClose = () => {
    console.log('❌ Dialog closed - resetting temporary states');
    setSelectedDamage(null);
    setTempDamage(null);
    setIsNewDamage(false);
  };

  // Save status indicator component
  const SaveStatusIndicator = () => {
    if (readonly) return null;
    
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">جاري الحفظ...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">تم الحفظ</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                {lastSaved.toLocaleTimeString('ar-KW')}
              </span>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">خطأ في الحفظ</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            حالة المركبة عند {typeLabel} - {vehicleInfo}
          </div>
          <SaveStatusIndicator />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Auto-save status alert */}
        {saveStatus === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              فشل في حفظ الأضرار تلقائياً. سيتم المحاولة مرة أخرى عند إجراء التغيير التالي.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="flex items-center gap-2 flex-row-reverse">
              <List className="w-4 h-4" />
              ملخص الحالة
            </TabsTrigger>
            <TabsTrigger value="diagram" className="flex items-center gap-2 flex-row-reverse">
              <Map className="w-4 h-4" />
              المخطط التفاعلي
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 flex-row-reverse">
              <Camera className="w-4 h-4" />
              الصور والملاحظات
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
        </Tabs>

        {/* Damage Detail Dialog */}
        {selectedDamage && (
          <DamageDetailDialog
            damage={selectedDamage}
            contractId={contractId}
            type={type}
            open={!!selectedDamage}
            onOpenChange={(open) => {
              console.log('🚪 Dialog onOpenChange called with:', open);
              if (!open) {
                console.log('🚪 Dialog closing - calling handleDialogClose');
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