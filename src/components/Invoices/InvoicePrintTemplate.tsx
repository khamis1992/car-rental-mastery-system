import React from 'react';
import { formatCurrencyKWD } from '@/lib/currency';
import { formatDate, formatDateTime } from '@/lib/utils';
import CompanyHeader from '@/components/Reports/CompanyHeader';
import CompanyFooter from '@/components/Reports/CompanyFooter';

interface InvoicePrintTemplateProps {
  invoice: any;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({ invoice }) => {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      partially_paid: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };
    return statusMap[status] || status;
  };

  const getInvoiceTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      rental: 'فاتورة إيجار',
      additional: 'فاتورة رسوم إضافية',
      penalty: 'فاتورة غرامة',
      extension: 'فاتورة تمديد'
    };
    return typeMap[type] || 'فاتورة';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white text-black print:text-black print:bg-white" dir="rtl">
      {/* رأس الشركة */}
      <CompanyHeader />
      
      <div className="p-8 print:p-4">
        {/* رأس الفاتورة */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
          <h1 className="text-3xl font-bold mb-2">
            {getInvoiceTypeText(invoice.invoice_type)}
          </h1>
          <div className="text-lg">
            <p>رقم الفاتورة: <span className="font-bold">{invoice.invoice_number}</span></p>
            <p className="text-sm text-gray-600 mt-1">
              تاريخ الإصدار: {formatDate(invoice.issue_date)}
            </p>
            {invoice.due_date && (
              <p className="text-sm text-gray-600">
                تاريخ الاستحقاق: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* بيانات الفاتورة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* بيانات العميل */}
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">بيانات العميل</h3>
            <div className="space-y-2">
              <p><span className="font-semibold">الاسم:</span> {invoice.customers?.name}</p>
              <p><span className="font-semibold">رقم الهاتف:</span> {invoice.customers?.phone}</p>
              {invoice.customers?.email && (
                <p><span className="font-semibold">البريد الإلكتروني:</span> {invoice.customers.email}</p>
              )}
              {invoice.customers?.address && (
                <p><span className="font-semibold">العنوان:</span> {invoice.customers.address}</p>
              )}
            </div>
          </div>

          {/* تفاصيل الفاتورة */}
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">تفاصيل الفاتورة</h3>
            <div className="space-y-2">
              <p><span className="font-semibold">حالة الفاتورة:</span> {getStatusText(invoice.status)}</p>
              <p><span className="font-semibold">نوع الفاتورة:</span> {getInvoiceTypeText(invoice.invoice_type)}</p>
              {invoice.contract_id && (
                <p><span className="font-semibold">رقم العقد:</span> {invoice.contracts?.contract_number}</p>
              )}
              {invoice.payment_terms && (
                <p><span className="font-semibold">شروط الدفع:</span> {invoice.payment_terms} يوم</p>
              )}
            </div>
          </div>
        </div>

        {/* بنود الفاتورة */}
        {invoice.invoice_items && invoice.invoice_items.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">بنود الفاتورة</h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-right border-b">الوصف</th>
                    <th className="p-3 text-center border-b">الكمية</th>
                    <th className="p-3 text-center border-b">سعر الوحدة</th>
                    <th className="p-3 text-center border-b">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{item.description}</div>
                        {item.details && (
                          <div className="text-sm text-gray-600 mt-1">{item.details}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-center">{formatCurrencyKWD(item.unit_price)}</td>
                      <td className="p-3 text-center font-medium">{formatCurrencyKWD(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* الملخص المالي */}
        <div className="border border-gray-300 p-4 rounded mb-8">
          <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">الملخص المالي</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>المبلغ الفرعي:</span>
              <span>{formatCurrencyKWD(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم:</span>
                <span>- {formatCurrencyKWD(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>الضريبة:</span>
                <span>{formatCurrencyKWD(invoice.tax_amount)}</span>
              </div>
            )}
            <hr className="my-2 border-gray-300" />
            <div className="flex justify-between font-bold text-lg">
              <span>المبلغ الإجمالي:</span>
              <span>{formatCurrencyKWD(invoice.total_amount)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>المبلغ المدفوع:</span>
                  <span>{formatCurrencyKWD(invoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between font-medium text-red-600">
                  <span>المبلغ المتبقي:</span>
                  <span>{formatCurrencyKWD(invoice.outstanding_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* الملاحظات */}
        {invoice.notes && (
          <div className="border border-gray-300 p-4 rounded mb-8">
            <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">ملاحظات</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* شروط وأحكام */}
        {invoice.terms_and_conditions && (
          <div className="border border-gray-300 p-4 rounded mb-8">
            <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">الشروط والأحكام</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {invoice.terms_and_conditions}
            </div>
          </div>
        )}

        {/* معلومات الدفع */}
        {invoice.status !== 'paid' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-8">
            <h3 className="text-lg font-bold mb-2 text-yellow-800">معلومات الدفع</h3>
            <p className="text-sm text-yellow-700">
              يرجى إجراء الدفع في موعد أقصاه {invoice.due_date ? formatDate(invoice.due_date) : 'بأسرع وقت ممكن'}
            </p>
            {invoice.payment_instructions && (
              <p className="text-sm text-yellow-700 mt-2">
                {invoice.payment_instructions}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* تذييل الشركة */}
      <CompanyFooter />

      {/* تذييل الصفحة */}
      <div className="text-center mt-6 pt-4 border-t border-gray-300 text-sm text-gray-600 px-8">
        <p>تم طباعة هذه الفاتورة بتاريخ {formatDateTime(new Date().toISOString())}</p>
        <p className="mt-1">نظام إدارة تأجير المركبات</p>
      </div>
    </div>
  );
};

export default InvoicePrintTemplate;