
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Settings, 
  Shield, 
  Zap, 
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AdvancedAutomationDashboard } from './AdvancedAutomationDashboard';
import { AutomationRuleBuilder } from './AutomationRuleBuilder';
import { ErrorCorrectionCenter } from './ErrorCorrectionCenter';
import { AutomatedJournalEntryService } from './AutomatedJournalEntryService';

export const AdvancedAccountingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'لوحة تحكم الأتمتة',
      description: 'مراقبة الأداء ومؤشرات الأتمتة',
      tab: 'dashboard'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'بناء قواعد الأتمتة',
      description: 'إنشاء وتخصيص القواعد الآلية',
      tab: 'rules'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'مركز التصحيح',
      description: 'اكتشاف وإصلاح الأخطاء',
      tab: 'correction'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'الخدمات الآلية',
      description: 'خدمات القيود التلقائية',
      tab: 'services'
    }
  ];

  if (showRuleBuilder) {
    return (
      <AutomationRuleBuilder 
        onSave={() => setShowRuleBuilder(false)}
        onCancel={() => setShowRuleBuilder(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold rtl-title">مركز المحاسبة المتقدم</h1>
          <p className="text-muted-foreground mt-1">
            نظام الأتمتة والتصحيح الذكي للمعاملات المحاسبية
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowRuleBuilder(true)} className="rtl-flex">
            <Plus className="w-4 h-4" />
            قاعدة جديدة
          </Button>
        </div>
      </div>

      {/* بطاقات المميزات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeTab === feature.tab ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActiveTab(feature.tab)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold rtl-title">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="rtl-flex">
            <BarChart3 className="w-4 h-4" />
            لوحة التحكم
          </TabsTrigger>
          <TabsTrigger value="rules" className="rtl-flex">
            <Settings className="w-4 h-4" />
            القواعد
          </TabsTrigger>
          <TabsTrigger value="correction" className="rtl-flex">
            <Shield className="w-4 h-4" />
            التصحيح
          </TabsTrigger>
          <TabsTrigger value="services" className="rtl-flex">
            <Zap className="w-4 h-4" />
            الخدمات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdvancedAutomationDashboard />
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="rtl-flex rtl-title">
                  <Settings className="w-5 h-5" />
                  إدارة قواعد الأتمتة
                </CardTitle>
                <Button onClick={() => setShowRuleBuilder(true)} className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  قاعدة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">إدارة قواعد الأتمتة</h3>
                <p className="text-muted-foreground mb-4">
                  قم بإنشاء وتخصيص القواعد الآلية لتوليد القيود المحاسبية
                </p>
                <Button onClick={() => setShowRuleBuilder(true)} className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  إنشاء قاعدة جديدة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correction">
          <ErrorCorrectionCenter />
        </TabsContent>

        <TabsContent value="services">
          <AutomatedJournalEntryService />
        </TabsContent>
      </Tabs>
    </div>
  );
};
