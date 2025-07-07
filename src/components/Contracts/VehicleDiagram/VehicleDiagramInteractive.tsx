import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, AlertTriangle, CheckCircle, Camera, X, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateDamage, validateDamageList } from './DamageValidation';
import { DamageGuidanceHelper } from './DamageGuidanceHelper';

export interface DamageArea {
  [key: string]: any; // Index signature for Json compatibility
  id: string;
  x: number;
  y: number;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  photos?: string[];
  timestamp?: string;
}

interface VehicleDiagramInteractiveProps {
  type: 'pickup' | 'return';
  contractId: string;
  damages: DamageArea[];
  onDamageCreate?: (damage: DamageArea) => void;
  onDamageSelect?: (damage: DamageArea) => void;
  readonly?: boolean;
}

export const VehicleDiagramInteractive: React.FC<VehicleDiagramInteractiveProps> = ({
  type,
  contractId,
  damages = [],
  onDamageCreate,
  onDamageSelect,
  readonly = false
}) => {
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Debug effect to track isAddingDamage changes
  React.useEffect(() => {
    console.log('🎯 isAddingDamage state changed to:', isAddingDamage);
  }, [isAddingDamage]);

  const typeLabel = type === 'pickup' ? 'التسليم' : 'الاستلام';

  const handleDiagramClick = useCallback((event: React.MouseEvent<SVGElement>) => {
    console.log('🖱️ Diagram clicked. readonly:', readonly, 'isAddingDamage:', isAddingDamage);
    
    // Prevent default behavior and stop propagation to avoid navigation
    event.preventDefault();
    event.stopPropagation();
    
    if (readonly || !isAddingDamage) {
      console.log('⏹️ Click ignored - readonly or not in adding mode');
      return;
    }

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    console.log('📍 Click coordinates:', { x, y });

    // Validate click position
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      console.warn('❌ Click outside diagram bounds');
      toast({
        title: "خطأ",
        description: "يرجى النقر داخل حدود مخطط المركبة",
        variant: "destructive",
      });
      return;
    }

    // Check for nearby damages to avoid duplicates
    const nearbyDamage = damages.find(damage => {
      const distance = Math.sqrt(Math.pow(damage.x - x, 2) + Math.pow(damage.y - y, 2));
      return distance < 5; // Less than 5% distance
    });

    if (nearbyDamage) {
      console.warn('⚠️ Nearby damage found, preventing duplicate');
      toast({
        title: "تنبيه",
        description: "يوجد ضرر قريب من هذا الموقع. يرجى اختيار موقع آخر أو تعديل الضرر الموجود.",
        variant: "destructive",
      });
      return;
    }

    const newDamage: DamageArea = {
      id: `damage-${Date.now()}`,
      x,
      y,
      severity: 'minor',
      description: '',
      photos: [],
      timestamp: new Date().toISOString()
    };

    console.log('🎯 Creating temporary damage (NOT adding to list yet):', newDamage);

    try {
      // Create temporary damage and notify parent
      if (onDamageCreate) {
        console.log('📞 Calling onDamageCreate with damage:', newDamage);
        onDamageCreate(newDamage);
        console.log('✅ onDamageCreate completed successfully');
      } else {
        console.warn('⚠️ onDamageCreate callback not provided');
      }
      setIsAddingDamage(false); // Auto-disable adding mode
    } catch (error) {
      console.error('❌ Error in handleDiagramClick:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الضرر",
        variant: "destructive",
      });
    }
  }, [readonly, isAddingDamage, damages, toast, onDamageCreate]);

  // Remove the saveDamage and removeDamage functions since they're not needed
  // Damages are now only saved through the parent component via dialog

  const getSeverityColor = (severity: DamageArea['severity']) => {
    switch (severity) {
      case 'minor': return '#fbbf24';
      case 'major': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: DamageArea['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {!readonly && (
            <div className="flex gap-2">
              <Button
                variant={isAddingDamage ? "destructive" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔄 Toggling add damage mode. Current:', isAddingDamage);
                  setIsAddingDamage(!isAddingDamage);
                }}
                disabled={isSaving}
              >
                {isAddingDamage ? (
                  <>
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 ml-2" />
                    إضافة ضرر
                  </>
                )}
              </Button>
              {damages.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const validation = validateDamageList(damages);
                    if (validation.errors.length > 0) {
                      toast({
                        title: "أخطاء في التحقق",
                        description: validation.errors.join(', '),
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "التحقق مكتمل",
                        description: `تم التحقق من ${damages.length} ضرر بنجاح`,
                      });
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  التحقق من البيانات
                </Button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            مخطط المركبة التفاعلي - {typeLabel}
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>أخطاء في البيانات:</strong>
                <ul className="list-disc list-inside mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Guidance Helper */}
          <DamageGuidanceHelper 
            isAddingDamage={isAddingDamage}
            totalDamages={damages.length}
            hasPhotos={damages.some(d => d.photos && d.photos.length > 0)}
            readonly={readonly}
          />

          <div className="relative">
            <svg
              viewBox="0 0 400 220"
              className={`w-full h-80 border rounded-lg bg-muted/20 transition-all duration-200 ${
                isAddingDamage && !readonly ? 'cursor-crosshair ring-2 ring-blue-500 ring-opacity-50' : ''
              } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleDiagramClick}
            >
            {/* Vehicle Diagram Image */}
            <image
              href="/lovable-uploads/cf0ef0ce-1c56-4da0-b065-8c130f4f182f.png"
              x="0"
              y="0"
              width="400"
              height="200"
              preserveAspectRatio="xMidYMid meet"
              opacity="0.9"
            />
            
            {/* Labels */}
            <text x="375" y="105" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              المؤخرة
            </text>
            <text x="200" y="15" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              يمين
            </text>
            <text x="200" y="205" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              يسار
            </text>
            <text x="25" y="105" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              المقدمة
            </text>

            {/* Damage Markers - only render saved damages */}
            {damages.map((damage) => (
              <g key={damage.id}>
                <circle
                  cx={(damage.x / 100) * 400}
                  cy={(damage.y / 100) * 200}
                  r="8"
                  fill={getSeverityColor(damage.severity)}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDamageSelect && !readonly) {
                      onDamageSelect(damage);
                    }
                  }}
                />
                <foreignObject
                  x={(damage.x / 100) * 400 - 6}
                  y={(damage.y / 100) * 200 - 6}
                  width="12"
                  height="12"
                  className="pointer-events-none"
                >
                  <div className="text-white text-xs flex items-center justify-center">
                    {getSeverityIcon(damage.severity)}
                  </div>
                </foreignObject>
              </g>
            ))}
            </svg>
          </div>

          {/* Enhanced Damage Summary */}
          {damages.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">الأضرار المسجلة ({damages.length})</h4>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {damages.filter(d => d.severity === 'minor').length} بسيط
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    {damages.filter(d => d.severity === 'major').length} متوسط
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    {damages.filter(d => d.severity === 'critical').length} شديد
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {damages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (onDamageSelect && !readonly) {
                        onDamageSelect(damage);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          damage.severity === 'minor' ? 'bg-yellow-400' :
                          damage.severity === 'major' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                      />
                      <span className="text-sm truncate">
                        {damage.description || 'ضرر غير محدد'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {damage.photos && damage.photos.length > 0 && (
                        <Badge variant="outline" className="text-xs px-1">
                          {damage.photos.length} <Camera className="w-3 h-3 ml-1" />
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Legend */}
          <div className="mt-4 p-3 border rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm mb-2 text-right">دليل الاستخدام:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="space-y-1 text-muted-foreground order-2 md:order-1">
                <p className="text-right">• انقر على أي ضرر لعرض التفاصيل</p>
                <p className="text-right">• استخدم زر "إضافة ضرر" لتسجيل ضرر جديد</p>
                <p className="text-right">• يُنصح بإضافة صور للأضرار الشديدة</p>
              </div>
              <div className="space-y-1 order-1 md:order-2">
                <div className="flex items-center gap-1 justify-end">
                  <span>ضرر بسيط (خدوش سطحية)</span>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span>ضرر متوسط (تلف في الطلاء)</span>
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span>ضرر شديد (تلف هيكلي)</span>
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Detail Modal would be handled by parent component */}
      </CardContent>
    </Card>
  );
};