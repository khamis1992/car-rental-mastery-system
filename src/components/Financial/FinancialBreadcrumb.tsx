import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Home, Calculator, FileText, BarChart3, Building2, Zap, TrendingUp } from 'lucide-react';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<any>;
  parent?: string;
}

export const FinancialBreadcrumb: React.FC = () => {
  const location = useLocation();
  
  const breadcrumbConfig: BreadcrumbConfig[] = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/chart-of-accounts', label: 'دليل الحسابات', icon: Calculator, parent: '/' },
    { path: '/journal-entries', label: 'القيود المحاسبية', icon: FileText, parent: '/' },
    { path: '/financial-reports', label: 'التقارير المالية', icon: BarChart3, parent: '/' },
    { path: '/cost-centers', label: 'مراكز التكلفة', icon: Building2, parent: '/' },
    { path: '/accounting-automation', label: 'الأتمتة المحاسبية', icon: Zap, parent: '/' },
    { path: '/financial-analytics', label: 'التحليلات المالية', icon: TrendingUp, parent: '/' },
  ];

  const generateBreadcrumbs = () => {
    const currentPath = location.pathname;
    const breadcrumbs: BreadcrumbConfig[] = [];

    // Always start with home
    const homeBreadcrumb = breadcrumbConfig.find(config => config.path === '/');
    if (homeBreadcrumb) {
      breadcrumbs.push(homeBreadcrumb);
    }

    // Find current page config
    const currentConfig = breadcrumbConfig.find(config => config.path === currentPath);
    
    if (currentConfig && currentConfig.path !== '/') {
      // Add parent breadcrumbs if needed
      if (currentConfig.parent && currentConfig.parent !== '/') {
        const parentConfig = breadcrumbConfig.find(config => config.path === currentConfig.parent);
        if (parentConfig) {
          breadcrumbs.push(parentConfig);
        }
      }
      
      // Add current page
      breadcrumbs.push(currentConfig);
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList className="flex-row-reverse">
          {breadcrumbs.map((breadcrumb, index) => {
            const IconComponent = breadcrumb.icon;
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <React.Fragment key={breadcrumb.path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2 font-medium">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {breadcrumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={breadcrumb.path}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="mx-2" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};