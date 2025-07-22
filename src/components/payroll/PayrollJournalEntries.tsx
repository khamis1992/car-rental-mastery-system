import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PayrollJournalEntries = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title">القيود المحاسبية للرواتب</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          سيتم تطوير هذه الميزة في المرحلة القادمة
        </div>
      </CardContent>
    </Card>
  );
};