import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PayrollData {
  id: string;
  employee_name: string;
  employee_number: string;
  basic_salary: number;
  allowances: number;
  overtime_amount: number;
  bonuses: number;
  deductions: number;
  tax_deduction: number;
  social_insurance: number;
  gross_salary: number;
  net_salary: number;
  status: string;
}

interface PayrollReportTemplateProps {
  data: PayrollData[];
  reportType: 'monthly' | 'deductions';
  reportDate: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
  };
}

const PayrollReportTemplate: React.FC<PayrollReportTemplateProps> = ({
  data,
  reportType,
  reportDate,
  companyInfo = {
    name: 'شركة ساپتكو الخليج لتأجير السيارات',
    address: 'دولة الكويت',
    phone: '+965 XXXX XXXX'
  }
}) => {
  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getTotalGross = () => data.reduce((sum, item) => sum + item.gross_salary, 0);
  const getTotalNet = () => data.reduce((sum, item) => sum + item.net_salary, 0);
  const getTotalDeductions = () => data.reduce((sum, item) => sum + item.deductions + item.tax_deduction + item.social_insurance, 0);

  const getReportTitle = () => {
    return reportType === 'monthly' ? 'تقرير الرواتب الشهري' : 'تقرير الخصومات';
  };

  return (
    <div className="bg-white p-8 min-h-screen" dir="rtl" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{companyInfo.name}</h1>
        <p className="text-gray-600 mb-1">{companyInfo.address}</p>
        <p className="text-gray-600 mb-4">{companyInfo.phone}</p>
        <h2 className="text-xl font-semibold text-primary">{getReportTitle()}</h2>
        <p className="text-gray-600 mt-2">
          تاريخ التقرير: {format(new Date(reportDate), 'dd MMMM yyyy', { locale: ar })}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-1">إجمالي الرواتب</h3>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(getTotalGross())}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-1">صافي الرواتب</h3>
          <p className="text-lg font-bold text-green-600">{formatCurrency(getTotalNet())}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-1">إجمالي الخصومات</h3>
          <p className="text-lg font-bold text-red-600">{formatCurrency(getTotalDeductions())}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الموظف</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الراتب الأساسي</th>
              {reportType === 'monthly' && (
                <>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">البدلات</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الإضافي</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">المكافآت</th>
                </>
              )}
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الخصومات</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الضريبة</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">التأمين</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الإجمالي</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">الصافي</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2">
                  <div>
                    <div className="font-medium">{row.employee_name}</div>
                    <div className="text-sm text-gray-500">{row.employee_number}</div>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.basic_salary)}</td>
                {reportType === 'monthly' && (
                  <>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.allowances)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.overtime_amount)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.bonuses)}</td>
                  </>
                )}
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.deductions)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.tax_deduction)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.social_insurance)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{formatCurrency(row.gross_salary)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(row.net_salary)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-300 px-4 py-2 text-right">المجموع</td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {formatCurrency(data.reduce((sum, row) => sum + row.basic_salary, 0))}
              </td>
              {reportType === 'monthly' && (
                <>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(data.reduce((sum, row) => sum + row.allowances, 0))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(data.reduce((sum, row) => sum + row.overtime_amount, 0))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(data.reduce((sum, row) => sum + row.bonuses, 0))}
                  </td>
                </>
              )}
              <td className="border border-gray-300 px-4 py-2 text-right">
                {formatCurrency(data.reduce((sum, row) => sum + row.deductions, 0))}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {formatCurrency(data.reduce((sum, row) => sum + row.tax_deduction, 0))}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {formatCurrency(data.reduce((sum, row) => sum + row.social_insurance, 0))}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                {formatCurrency(getTotalGross())}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                {formatCurrency(getTotalNet())}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>تم إنشاء هذا التقرير في: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
        <p className="mt-2">هذا التقرير سري ومخصص للاستخدام الداخلي فقط</p>
      </div>
    </div>
  );
};

export default PayrollReportTemplate;