import React from 'react';
import { Home, FileText, BarChart3, Settings, Calculator, Book } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickBooksNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const QuickBooksNavigation = ({ activeTab, onTabChange }: QuickBooksNavigationProps) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: Home,
      description: 'نظرة عامة على النشاط المحاسبي'
    },
    {
      id: 'journal',
      label: 'القيود',
      icon: FileText,
      description: 'إدخال وإدارة القيود المحاسبية'
    },
    {
      id: 'accounts',
      label: 'دليل الحسابات',
      icon: Book,
      description: 'إدارة وتنظيم الحسابات'
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: BarChart3,
      description: 'التقارير المالية والتحليلات'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      description: 'إعدادات النظام المحاسبي'
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
      <div className="p-4">
        <nav className="flex justify-center">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                      : 'hover:bg-blue-50 text-blue-700 hover:text-blue-800'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="font-medium text-sm">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </Card>
  );
};