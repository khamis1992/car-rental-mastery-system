import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VehicleDiagramInteractive, type DamageArea } from './VehicleDiagramInteractive';
import { DamageDetailDialog } from './DamageDetailDialog';
import { 
  Car, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Camera,
  FileText
} from 'lucide-react';

interface VehicleConditionComparisonProps {
  contractId: string;
  pickupDamages: DamageArea[];
  returnDamages: DamageArea[];
  vehicleInfo: string;
  onGenerateReport?: () => void;
}

export const VehicleConditionComparison: React.FC<VehicleConditionComparisonProps> = ({
  contractId,
  pickupDamages = [],
  returnDamages = [],
  vehicleInfo,
  onGenerateReport
}) => {
  const [selectedDamage, setSelectedDamage] = useState<DamageArea | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  // تحليل التغييرات
  const newDamages = returnDamages.filter(
    returnDamage => !pickupDamages.some(
      pickupDamage => 
        Math.abs(returnDamage.x - pickupDamage.x) < 5 && 
        Math.abs(returnDamage.y - pickupDamage.y) < 5
    )
  );

  const unchangedDamages = returnDamages.filter(
    returnDamage => pickupDamages.some(
      pickupDamage => 
        Math.abs(returnDamage.x - pickupDamage.x) < 5 && 
        Math.abs(returnDamage.y - pickupDamage.y) < 5 &&
        returnDamage.severity === pickupDamage.severity
    )
  );

  const worsenedDamages = returnDamages.filter(
    returnDamage => pickupDamages.some(
      pickupDamage => 
        Math.abs(returnDamage.x - pickupDamage.x) < 5 && 
        Math.abs(returnDamage.y - pickupDamage.y) < 5 &&
        getSeverityWeight(returnDamage.severity) > getSeverityWeight(pickupDamage.severity)
    )
  );

  const improvedDamages = returnDamages.filter(
    returnDamage => pickupDamages.some(
      pickupDamage => 
        Math.abs(returnDamage.x - pickupDamage.x) < 5 && 
        Math.abs(returnDamage.y - pickupDamage.y) < 5 &&
        getSeverityWeight(returnDamage.severity) < getSeverityWeight(pickupDamage.severity)
    )
  );

  function getSeverityWeight(severity: DamageArea['severity']): number {
    switch (severity) {
      case 'minor': return 1;
      case 'major': return 2;
      case 'critical': return 3;
      default: return 0;
    }
  }

  const getSeverityIcon = (severity: DamageArea['severity']) => {
    switch (severity) {
      case 'minor': return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      case 'major': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              مقارنة حالة المركبة - {vehicleInfo}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('side-by-side')}
              >
                جنباً إلى جنب
              </Button>
              <Button
                variant={viewMode === 'overlay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overlay')}
              >
                متراكب
              </Button>
              {onGenerateReport && (
                <Button variant="outline" size="sm" onClick={onGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  تقرير مفصل
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{newDamages.length}</div>
              <div className="text-sm text-green-700">أضرار جديدة</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{worsenedDamages.length}</div>
              <div className="text-sm text-red-700">أضرار تفاقمت</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{improvedDamages.length}</div>
              <div className="text-sm text-blue-700">أضرار تحسنت</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{unchangedDamages.length}</div>
              <div className="text-sm text-gray-700">أضرار بدون تغيير</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VehicleDiagramInteractive
            type="pickup"
            contractId={contractId}
            damages={pickupDamages}
            readonly={true}
          />
          <VehicleDiagramInteractive
            type="return"
            contractId={contractId}
            damages={returnDamages}
            readonly={true}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>المخطط المتراكب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <svg
                viewBox="0 0 400 200"
                className="w-full h-64 border rounded-lg bg-muted/20"
              >
                {/* Car Body */}
                <rect
                  x="50"
                  y="60"
                  width="300"
                  height="80"
                  rx="15"
                  fill="#e5e7eb"
                  stroke="#6b7280"
                  strokeWidth="2"
                />
                {/* Vehicle parts (same as in VehicleDiagramInteractive) */}
                <rect x="40" y="75" width="20" height="50" rx="10" fill="#d1d5db" stroke="#6b7280" strokeWidth="2" />
                <rect x="340" y="75" width="20" height="50" rx="10" fill="#d1d5db" stroke="#6b7280" strokeWidth="2" />
                <rect x="80" y="65" width="240" height="70" rx="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.7" />
                <circle cx="100" cy="160" r="15" fill="#374151" stroke="#1f2937" strokeWidth="2" />
                <circle cx="300" cy="160" r="15" fill="#374151" stroke="#1f2937" strokeWidth="2" />
                <circle cx="100" cy="40" r="15" fill="#374151" stroke="#1f2937" strokeWidth="2" />
                <circle cx="300" cy="40" r="15" fill="#374151" stroke="#1f2937" strokeWidth="2" />

                {/* Pickup damages (outlined) */}
                {pickupDamages.map((damage, index) => (
                  <circle
                    key={`pickup-${index}`}
                    cx={(damage.x / 100) * 400}
                    cy={(damage.y / 100) * 200}
                    r="10"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="3"
                    strokeDasharray="4,2"
                    className="cursor-pointer"
                    onClick={() => setSelectedDamage(damage)}
                  />
                ))}

                {/* Return damages (filled) */}
                {returnDamages.map((damage, index) => {
                  const isNew = newDamages.includes(damage);
                  const isWorsened = worsenedDamages.includes(damage);
                  const isImproved = improvedDamages.includes(damage);
                  
                  let color = '#6b7280';
                  if (isNew) color = '#10b981';
                  else if (isWorsened) color = '#ef4444';
                  else if (isImproved) color = '#3b82f6';

                  return (
                    <circle
                      key={`return-${index}`}
                      cx={(damage.x / 100) * 400}
                      cy={(damage.y / 100) * 200}
                      r="8"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => setSelectedDamage(damage)}
                    />
                  );
                })}
              </svg>

              {/* Overlay Legend */}
              <div className="mt-4 p-3 border rounded-lg bg-muted/20">
                <h4 className="font-medium text-sm mb-2">مفتاح المقارنة:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-500 border-dashed rounded-full"></div>
                    <span>عند التسليم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>ضرر جديد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>تفاقم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>تحسن</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Changes List */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التغييرات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Damages */}
          {newDamages.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                أضرار جديدة ({newDamages.length})
              </h4>
              <div className="space-y-2">
                {newDamages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100"
                    onClick={() => setSelectedDamage(damage)}
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(damage.severity)}
                      <span className="text-sm">{damage.description || 'ضرر غير محدد'}</span>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      جديد
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worsened Damages */}
          {worsenedDamages.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                أضرار تفاقمت ({worsenedDamages.length})
              </h4>
              <div className="space-y-2">
                {worsenedDamages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200 cursor-pointer hover:bg-red-100"
                    onClick={() => setSelectedDamage(damage)}
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(damage.severity)}
                      <span className="text-sm">{damage.description || 'ضرر غير محدد'}</span>
                    </div>
                    <Badge variant="destructive">
                      تفاقم
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improved Damages */}
          {improvedDamages.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                أضرار تحسنت ({improvedDamages.length})
              </h4>
              <div className="space-y-2">
                {improvedDamages.map((damage) => (
                  <div
                    key={damage.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100"
                    onClick={() => setSelectedDamage(damage)}
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(damage.severity)}
                      <span className="text-sm">{damage.description || 'ضرر غير محدد'}</span>
                    </div>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      تحسن
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Changes */}
          {newDamages.length === 0 && worsenedDamages.length === 0 && improvedDamages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تغييرات في حالة المركبة</p>
              <p className="text-sm">المركبة في نفس الحالة كما كانت عند التسليم</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Damage Detail Dialog */}
      {selectedDamage && (
        <DamageDetailDialog
          damage={selectedDamage}
          contractId={contractId}
          type={returnDamages.includes(selectedDamage) ? 'return' : 'pickup'}
          open={!!selectedDamage}
          onOpenChange={(open) => !open && setSelectedDamage(null)}
          onSave={() => {}}
          readonly={true}
        />
      )}
    </div>
  );
};