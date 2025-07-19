import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';

export default function GeneralLedger() {
  return (
    <div className="flex-1 p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="rtl-title mb-8">
          <h1 className="text-3xl font-bold text-foreground">دفتر الأستاذ العام</h1>
          <p className="text-muted-foreground mt-2">عرض وإدارة سجلات دفتر الأستاذ العام</p>
        </div>
        <GeneralLedgerReport />
      </div>
    </div>
  );
}