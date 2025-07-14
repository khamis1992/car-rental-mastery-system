import React from 'react';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { AutomatedJournalEntries } from '@/components/Accounting/AutomatedJournalEntries';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Calendar, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const JournalEntries = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">القيود المحاسبية</h1>
          <p className="text-muted-foreground">إدارة وتسجيل القيود المحاسبية اليومية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلترة
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقرير شهري
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            قيد جديد
          </Button>
        </div>
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="automated">القيود التلقائية</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <AutomatedJournalEntries />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JournalEntries;