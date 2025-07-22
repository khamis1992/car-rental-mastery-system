import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export const AutomationRules = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="rtl-title">قواعد الأتمتة</CardTitle>
          <Button className="rtl-flex">
            <Plus className="h-4 w-4 ml-2" />
            إضافة قاعدة جديدة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          سيتم تطوير هذه الميزة في المرحلة القادمة
        </div>
      </CardContent>
    </Card>
  );
};