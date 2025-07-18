import { ChecksOverview } from "@/components/checks/ChecksOverview";

export default function ChecksPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-row-reverse">
        <h1 className="text-3xl font-bold rtl-title">إدارة الشيكات</h1>
      </div>
      
      <ChecksOverview />
    </div>
  );
}