import React from 'react';
import { formatCurrencyKWD } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CompanyHeader } from '@/components/Shared/CompanyHeader';

interface ContractPrintTemplateProps {
  contract: any;
}

export const ContractPrintTemplate: React.FC<ContractPrintTemplateProps> = ({ contract }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:text-black print:bg-white print:p-4" dir="rtl">
      {/* رأس الشركة */}
      <CompanyHeader variant="print" />
      
      {/* معلومات العقد */}
      <div className="text-center mb-8 border-b border-gray-300 pb-6">
        <h2 className="text-2xl font-bold mb-2 text-primary">عقد إيجار مركبة</h2>
        <div className="text-lg">
          <p>رقم العقد: <span className="font-bold">{contract.contract_number}</span></p>
          <p className="text-sm text-gray-600 mt-1">
            تاريخ الإنشاء: {formatDate(contract.created_at)}
          </p>
        </div>
      </div>

      {/* بيانات العقد */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* بيانات المستأجر */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">بيانات المستأجر</h3>
          <div className="space-y-2">
            <p><span className="font-semibold">الاسم:</span> {contract.customers?.name}</p>
            <p><span className="font-semibold">رقم الهاتف:</span> {contract.customers?.phone}</p>
            {contract.customers?.email && (
              <p><span className="font-semibold">البريد الإلكتروني:</span> {contract.customers.email}</p>
            )}
            {contract.customers?.national_id && (
              <p><span className="font-semibold">الهوية الوطنية:</span> {contract.customers.national_id}</p>
            )}
            {contract.customers?.address && (
              <p><span className="font-semibold">العنوان:</span> {contract.customers.address}</p>
            )}
          </div>
        </div>

        {/* بيانات المركبة */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">بيانات المركبة</h3>
          <div className="space-y-2">
            <p><span className="font-semibold">نوع المركبة:</span> {contract.vehicles?.make} {contract.vehicles?.model}</p>
            <p><span className="font-semibold">سنة الصنع:</span> {contract.vehicles?.year}</p>
            <p><span className="font-semibold">رقم المركبة:</span> {contract.vehicles?.vehicle_number}</p>
            <p><span className="font-semibold">رقم اللوحة:</span> {contract.vehicles?.license_plate}</p>
            {contract.vehicles?.color && (
              <p><span className="font-semibold">اللون:</span> {contract.vehicles.color}</p>
            )}
          </div>
        </div>
      </div>

      {/* تفاصيل الإيجار */}
      <div className="border border-gray-300 p-4 rounded mb-8">
        <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">تفاصيل الإيجار</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p><span className="font-semibold">نوع العقد:</span></p>
            <p>{contract.contract_type === 'daily' ? 'يومي' : 
                contract.contract_type === 'weekly' ? 'أسبوعي' : 
                contract.contract_type === 'monthly' ? 'شهري' : 'مخصص'}</p>
          </div>
          <div>
            <p><span className="font-semibold">تاريخ البداية:</span></p>
            <p>{formatDate(contract.start_date)}</p>
          </div>
          <div>
            <p><span className="font-semibold">تاريخ النهاية:</span></p>
            <p>{formatDate(contract.end_date)}</p>
          </div>
          <div>
            <p><span className="font-semibold">عدد الأيام:</span></p>
            <p>{contract.rental_days} يوم</p>
          </div>
          <div>
            <p><span className="font-semibold">السعر اليومي:</span></p>
            <p>{formatCurrencyKWD(contract.daily_rate)}</p>
          </div>
          <div>
            <p><span className="font-semibold">الحالة:</span></p>
            <p>{contract.status === 'draft' ? 'مسودة' : 
                contract.status === 'pending' ? 'في الانتظار' : 
                contract.status === 'active' ? 'نشط' : 
                contract.status === 'completed' ? 'مكتمل' : 'ملغي'}</p>
          </div>
        </div>
      </div>

      {/* التفاصيل المالية */}
      <div className="border border-gray-300 p-4 rounded mb-8">
        <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">التفاصيل المالية</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>المبلغ الأساسي:</span>
            <span>{formatCurrencyKWD(contract.total_amount)}</span>
          </div>
          {contract.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>الخصم:</span>
              <span>- {formatCurrencyKWD(contract.discount_amount)}</span>
            </div>
          )}
          {contract.tax_amount > 0 && (
            <div className="flex justify-between">
              <span>الضريبة:</span>
              <span>{formatCurrencyKWD(contract.tax_amount)}</span>
            </div>
          )}
          {contract.security_deposit > 0 && (
            <div className="flex justify-between">
              <span>التأمين:</span>
              <span>{formatCurrencyKWD(contract.security_deposit)}</span>
            </div>
          )}
          {contract.insurance_amount > 0 && (
            <div className="flex justify-between">
              <span>التأمين الإضافي:</span>
              <span>{formatCurrencyKWD(contract.insurance_amount)}</span>
            </div>
          )}
          <hr className="my-2 border-gray-300" />
          <div className="flex justify-between font-bold text-lg">
            <span>المبلغ الإجمالي:</span>
            <span>{formatCurrencyKWD(contract.final_amount)}</span>
          </div>
        </div>
      </div>

      {/* التوقيعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="font-bold">توقيع المستأجر</p>
            <p className="text-sm text-gray-600 mt-1">{contract.customers?.name}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2 mt-16">
            <p className="font-bold">توقيع الشركة</p>
            <p className="text-sm text-gray-600 mt-1">شركة ساپتكو الخليج</p>
          </div>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <div className="text-center mt-12 pt-6 border-t border-gray-300 text-sm text-gray-600">
        <p>تم طباعة هذا العقد بتاريخ {formatDateTime(new Date().toISOString())}</p>
        <p className="mt-1">شركة ساپتكو الخليج لتأجير السيارات - SAPTCO GULF</p>
      </div>
    </div>
  );
};