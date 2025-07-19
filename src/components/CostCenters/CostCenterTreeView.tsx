import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  Edit2,
  Plus,
  Target
} from 'lucide-react';
import { CostCenter, CostCenterService } from '@/services/BusinessServices/CostCenterService';
import { toast } from 'sonner';
import CostCenterForm from './CostCenterForm';
import { cn } from '@/lib/utils';

interface CostCenterTreeNode extends CostCenter {
  children: CostCenterTreeNode[];
  level: number;
}

interface CostCenterTreeViewProps {
  costCenters: CostCenter[];
  onRefresh: () => void;
  isLoading: boolean;
}

const CostCenterTreeView = ({ costCenters, onRefresh, isLoading }: CostCenterTreeViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [parentForNewCenter, setParentForNewCenter] = useState<string | null>(null);
  
  const costCenterService = new CostCenterService();

  // بناء الشجرة الهرمية
  const treeData = useMemo(() => {
    const nodeMap = new Map<string, CostCenterTreeNode>();
    const rootNodes: CostCenterTreeNode[] = [];

    // تحويل مراكز التكلفة إلى عقد شجرة
    costCenters.forEach(cc => {
      const node: CostCenterTreeNode = {
        ...cc,
        children: [],
        level: cc.level || 1
      };
      nodeMap.set(cc.id, node);
    });

    // بناء العلاقات الهرمية
    costCenters.forEach(cc => {
      const node = nodeMap.get(cc.id);
      if (!node) return;

      if (cc.parent_id && nodeMap.has(cc.parent_id)) {
        const parent = nodeMap.get(cc.parent_id)!;
        parent.children.push(node);
        parent.children.sort((a, b) => a.cost_center_name.localeCompare(b.cost_center_name, 'ar'));
      } else {
        rootNodes.push(node);
      }
    });

    rootNodes.sort((a, b) => a.cost_center_name.localeCompare(b.cost_center_name, 'ar'));
    return rootNodes;
  }, [costCenters]);

  // تصفية العقد بناءً على البحث
  const filterNodes = (nodes: CostCenterTreeNode[], searchTerm: string): CostCenterTreeNode[] => {
    if (!searchTerm) return nodes;

    return nodes.filter(node => {
      const matchesSearch = 
        node.cost_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.cost_center_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasMatchingChildren = filterNodes(node.children, searchTerm).length > 0;
      
      if (matchesSearch || hasMatchingChildren) {
        // إذا كان العقد أو أطفاله يطابقون البحث، قم بتوسيعه
        setExpandedNodes(prev => new Set([...prev, node.id]));
        return true;
      }
      return false;
    }).map(node => ({
      ...node,
      children: filterNodes(node.children, searchTerm)
    }));
  };

  const filteredTreeData = useMemo(() => {
    return filterNodes(treeData, searchTerm);
  }, [treeData, searchTerm]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const selectNode = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const getCostCenterTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      operational: 'تشغيلي',
      administrative: 'إداري',
      revenue: 'إيرادات',
      support: 'دعم'
    };
    return types[type] || type;
  };

  const getCostCenterTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      operational: 'bg-blue-100 text-blue-800',
      administrative: 'bg-green-100 text-green-800',
      revenue: 'bg-purple-100 text-purple-800',
      support: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateUtilization = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleAddSubCenter = (parentId: string) => {
    setParentForNewCenter(parentId);
    setShowAddForm(true);
  };

  const renderTreeNode = (node: CostCenterTreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children.length > 0;
    const utilization = calculateUtilization(node.actual_spent, node.budget_amount);
    const isOverBudget = node.actual_spent > node.budget_amount;

    return (
      <div key={node.id} className="select-none">
        {/* العقدة الرئيسية */}
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 hover:shadow-md rtl-flex",
            "cursor-pointer",
            depth > 0 && "mr-6 border-r-2 border-r-primary/20",
            isSelected && "bg-primary/10 border-primary/30",
            !isSelected && "hover:bg-muted/50"
          )}
          style={{ marginRight: `${depth * 24}px` }}
          onClick={() => selectNode(node.id)}
        >
          {/* مؤشر التوسع */}
          <div className="flex items-center gap-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-6" />}
          </div>

          {/* أيقونة نوع مركز التكلفة */}
          <div className="flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>

          {/* معلومات مركز التكلفة */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 rtl-flex">
              <span className="font-medium text-right truncate rtl-title">
                {node.cost_center_name}
              </span>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getCostCenterTypeColor(node.cost_center_type))}
              >
                {getCostCenterTypeLabel(node.cost_center_type)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground rtl-flex">
              <span className="font-mono">{node.cost_center_code}</span>
              {hasChildren && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.children.length}
                </span>
              )}
            </div>
          </div>

          {/* مؤشرات الميزانية */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="font-medium">
                {node.budget_amount.toLocaleString()} د.ك
              </div>
              <div className="text-xs text-muted-foreground">الميزانية</div>
            </div>
            <div className="text-right">
              <div className={cn("font-medium", isOverBudget && "text-red-600")}>
                {node.actual_spent.toLocaleString()} د.ك
              </div>
              <div className="text-xs text-muted-foreground">المصروف</div>
            </div>
            <div className="w-20">
              <Progress value={utilization} className="h-2" />
              <div className={cn("text-xs text-center mt-1", getUtilizationColor(utilization))}>
                {utilization.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCostCenter(node);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleAddSubCenter(node.id);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* العقد الفرعية */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: CostCenterTreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse text-lg">جاري التحميل...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Building2 className="h-5 w-5" />
            العرض الشجري لمراكز التكلفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* أدوات التحكم */}
          <div className="flex items-center gap-4 mb-6 rtl-flex">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في مراكز التكلفة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={expandAll} size="sm">
              توسيع الكل
            </Button>
            <Button variant="outline" onClick={collapseAll} size="sm">
              طي الكل
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              size="sm"
              className="flex items-center gap-2 rtl-flex"
            >
              <Plus className="h-4 w-4" />
              إضافة مركز تكلفة
            </Button>
          </div>

          {/* الشجرة */}
          <div className="space-y-2">
            {filteredTreeData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد مراكز تكلفة'}
              </div>
            ) : (
              filteredTreeData.map(node => renderTreeNode(node))
            )}
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل مركز التكلفة */}
      {(editingCostCenter || showAddForm) && (
        <CostCenterForm
          costCenter={editingCostCenter}
          parentId={parentForNewCenter}
          onClose={() => {
            setEditingCostCenter(null);
            setShowAddForm(false);
            setParentForNewCenter(null);
          }}
          onSuccess={() => {
            setEditingCostCenter(null);
            setShowAddForm(false);
            setParentForNewCenter(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default CostCenterTreeView;