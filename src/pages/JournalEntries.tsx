
import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const JournalEntries = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const journalEntries = [
    {
      id: "JE-001",
      date: "2024-01-15",
      description: "قيد إيراد إيجار سيارة تويوتا كامري",
      reference: "INV-2024-001",
      totalDebit: "300.000",
      totalCredit: "300.000",
      status: "معتمد",
      createdBy: "أحمد المحاسب",
      entries: [
        { account: "النقدية في البنك", debit: "300.000", credit: "0.000" },
        { account: "إيرادات الإيجار", debit: "0.000", credit: "300.000" }
      ]
    },
    {
      id: "JE-002",
      date: "2024-01-16", 
      description: "قيد مصاريف صيانة دورية",
      reference: "MAINT-2024-005",
      totalDebit: "150.000",
      totalCredit: "150.000",
      status: "مسودة",
      createdBy: "فاطمة المحاسبة",
      entries: [
        { account: "مصاريف الصيانة", debit: "150.000", credit: "0.000" },
        { account: "النقدية في البنك", debit: "0.000", credit: "150.000" }
      ]
    },
    {
      id: "JE-003",
      date: "2024-01-17",
      description: "قيد استحقاق راتب الموظفين", 
      reference: "PAY-2024-001",
      totalDebit: "2,500.000",
      totalCredit: "2,500.000",
      status: "معتمد",
      createdBy: "محمد المدير المالي",
      entries: [
        { account: "مصاريف الرواتب", debit: "2,500.000", credit: "0.000" },
        { account: "الرواتب المستحقة", debit: "0.000", credit: "2,500.000" }
      ]
    },
    {
      id: "JE-004",
      date: "2024-01-18",
      description: "قيد شراء وقود للأسطول",
      reference: "FUEL-2024-003",
      totalDebit: "200.000", 
      totalCredit: "200.000",
      status: "مرفوض",
      createdBy: "سالم المحاسب",
      entries: [
        { account: "مصاريف الوقود", debit: "200.000", credit: "0.000" },
        { account: "النقدية في الصندوق", debit: "0.000", credit: "200.000" }
      ]
    }
  ];

  const journalStats = [
    {
      title: "القيود المعتمدة",
      value: "24",
      description: "هذا الشهر",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    {
      title: "قيود مسودة",
      value: "5",
      description: "تحتاج مراجعة",
      icon: <Clock className="w-5 h-5 text-orange-500" />
    },
    {
      title: "قيود مرفوضة",
      value: "2",
      description: "تحتاج تصحيح",
      icon: <XCircle className="w-5 h-5 text-red-500" />
    },
    {
      title: "إجمالي المبلغ",
      value: "15,750 د.ك",
      description: "القيود المعتمدة",
      icon: <FileText className="w-5 h-5 text-blue-500" />
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'معتمد':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">معتمد</Badge>;
      case 'مسودة':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">مسودة</Badge>;
      case 'مرفوض':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredEntries = journalEntries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">القيود المحاسبية</h1>
            <p className="text-muted-foreground">إنشاء ومراجعة القيود المحاسبية اليومية</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button className="btn-primary rtl-flex">
              <Plus className="w-4 h-4" />
              قيد جديد
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Filter className="w-4 h-4" />
              فلترة
            </Button>
          </div>
        </div>

        {/* Journal Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {journalStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في القيود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Journal Entries Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">سجل القيود المحاسبية</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم القيد</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">المرجع</TableHead>
                  <TableHead className="text-right">المدين</TableHead>
                  <TableHead className="text-right">الدائن</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">المُنشِئ</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {entry.id}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{entry.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {entry.reference}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-green-600">
                      {entry.totalDebit} د.ك
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      {entry.totalCredit} د.ك
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(entry.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.createdBy}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <Button variant="ghost" size="sm">
                          عرض
                        </Button>
                        <Button variant="ghost" size="sm">
                          تعديل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JournalEntries;
