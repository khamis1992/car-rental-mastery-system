import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Car, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CrossReference {
  related_module: string;
  related_id: string;
  relationship_type: string;
  notes?: string;
}

interface ModuleCrossReferenceProps {
  moduleType: string;
  entityId: string;
  className?: string;
}

const getModuleIcon = (moduleType: string) => {
  switch (moduleType) {
    case 'contracts':
      return <FileText className="w-4 h-4" />;
    case 'invoices':
      return <Receipt className="w-4 h-4" />;
    case 'assets':
      return <Car className="w-4 h-4" />;
    case 'journal_entries':
      return <FileText className="w-4 h-4" />;
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
};

const getModuleLabel = (moduleType: string) => {
  switch (moduleType) {
    case 'contracts':
      return 'العقود';
    case 'invoices':
      return 'الفواتير';
    case 'assets':
      return 'الأصول';
    case 'journal_entries':
      return 'القيود المحاسبية';
    default:
      return moduleType;
  }
};

const ModuleCrossReference: React.FC<ModuleCrossReferenceProps> = ({
  moduleType,
  entityId,
  className
}) => {
  const [references, setReferences] = useState<CrossReference[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCrossReferences();
  }, [moduleType, entityId]);

  const loadCrossReferences = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_related_modules', {
          module_name: moduleType,
          entity_id: entityId
        });

      if (error) {
        throw error;
      }

      setReferences(data || []);
    } catch (error) {
      console.error('Error loading cross references:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المراجع المرتبطة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">المراجع المرتبطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  if (references.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">المراجع المرتبطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">لا توجد مراجع مرتبطة</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-right">المراجع المرتبطة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {references.map((ref, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-row-reverse">
                {getModuleIcon(ref.related_module)}
                <div className="text-right">
                  <div className="font-medium">{getModuleLabel(ref.related_module)}</div>
                  <div className="text-sm text-muted-foreground">
                    {ref.related_id}
                  </div>
                  {ref.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {ref.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {ref.relationship_type}
                </Badge>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleCrossReference;