import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, AlertTriangle, CheckCircle, Camera, X } from 'lucide-react';

export interface DamageArea {
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
  onDamagesChange: (damages: DamageArea[]) => void;
  readonly?: boolean;
}

export const VehicleDiagramInteractive: React.FC<VehicleDiagramInteractiveProps> = ({
  type,
  contractId,
  damages = [],
  onDamagesChange,
  readonly = false
}) => {
  const [selectedDamage, setSelectedDamage] = useState<DamageArea | null>(null);
  const [isAddingDamage, setIsAddingDamage] = useState(false);

  const typeLabel = type === 'pickup' ? 'التسليم' : 'الاستلام';

  const handleDiagramClick = (event: React.MouseEvent<SVGElement>) => {
    if (readonly || !isAddingDamage) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamage: DamageArea = {
      id: `damage-${Date.now()}`,
      x,
      y,
      severity: 'minor',
      description: '',
      photos: [],
      timestamp: new Date().toISOString()
    };

    setSelectedDamage(newDamage);
  };

  const saveDamage = (damage: DamageArea) => {
    const updatedDamages = [...damages.filter(d => d.id !== damage.id), damage];
    onDamagesChange(updatedDamages);
    setSelectedDamage(null);
    setIsAddingDamage(false);
  };

  const removeDamage = (damageId: string) => {
    const updatedDamages = damages.filter(d => d.id !== damageId);
    onDamagesChange(updatedDamages);
    setSelectedDamage(null);
  };

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
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            مخطط المركبة التفاعلي - {typeLabel}
          </div>
          {!readonly && (
            <Button
              variant={isAddingDamage ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsAddingDamage(!isAddingDamage)}
            >
              {isAddingDamage ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  إلغاء
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  إضافة ضرر
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox="0 0 400 200"
            className={`w-full h-80 border rounded-lg bg-muted/20 ${
              isAddingDamage && !readonly ? 'cursor-crosshair' : ''
            }`}
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
            <text x="200" y="25" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              يمين
            </text>
            <text x="200" y="185" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              يسار
            </text>
            <text x="25" y="105" textAnchor="middle" className="text-xs fill-gray-600 font-medium">
              المقدمة
            </text>

            {/* Damage Markers */}
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
                    setSelectedDamage(damage);
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

          {/* Instructions */}
          {isAddingDamage && !readonly && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                انقر على أي مكان في المخطط لإضافة ضرر أو عيب في المركبة
              </p>
            </div>
          )}

          {/* Damage Summary */}
          {damages.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">الأضرار المسجلة ({damages.length}):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {damages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedDamage(damage)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={damage.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {damage.severity === 'minor' && 'بسيط'}
                        {damage.severity === 'major' && 'متوسط'}
                        {damage.severity === 'critical' && 'شديد'}
                      </Badge>
                      <span className="text-sm truncate">
                        {damage.description || 'ضرر غير محدد'}
                      </span>
                    </div>
                    {damage.photos && damage.photos.length > 0 && (
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 p-3 border rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm mb-2">مفتاح الألوان:</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>ضرر بسيط</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>ضرر متوسط</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>ضرر شديد</span>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Detail Modal would be handled by parent component */}
      </CardContent>
    </Card>
  );
};