import React from 'react';
import { PaymentReceipt } from '@/types/payment-receipt';
import { formatCurrencyKWD } from '@/lib/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PaymentReceiptTemplateProps {
  receipt: PaymentReceipt;
  showWatermark?: boolean;
}

export const PaymentReceiptTemplate: React.FC<PaymentReceiptTemplateProps> = ({
  receipt,
  showWatermark = false
}) => {
  const paymentMethodText = {
    cash: 'نقداً',
    card: 'بطاقة ائتمان',
    bank_transfer: 'حوالة بنكية',
    check: 'شيك',
    online: 'دفع إلكتروني'
  }[receipt.payment_method] || receipt.payment_method;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 border-2 border-gray-200 rounded-lg relative">
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="text-purple-200 font-bold transform -rotate-45 select-none"
            style={{ fontSize: '60px' }}
          >
            إيصال دفع
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-4 border-purple-600">
          <h1 className="text-2xl font-bold text-purple-600 mb-2">
            {receipt.company_info.name}
          </h1>
          {receipt.company_info.address && (
            <p className="text-sm text-gray-600">{receipt.company_info.address}</p>
          )}
          {receipt.company_info.phone && (
            <p className="text-sm text-gray-600">هاتف: {receipt.company_info.phone}</p>
          )}
          {receipt.company_info.email && (
            <p className="text-sm text-gray-600">البريد الإلكتروني: {receipt.company_info.email}</p>
          )}
          
          <h2 className="text-xl font-bold text-gray-800 mt-4 mb-3">إيصال دفعة</h2>
          <div className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full font-bold">
            {receipt.receipt_number}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <div className="bg-gray-100 px-4 py-2 border-r-4 border-purple-600 font-bold text-gray-700 mb-4">
            معلومات العميل
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">اسم العميل:</span>
              <span className="text-gray-800">{receipt.customer_name}</span>
            </div>
            {receipt.customer_phone && (
              <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
                <span className="font-semibold text-gray-600">رقم الهاتف:</span>
                <span className="text-gray-800">{receipt.customer_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contract Info */}
        <div className="mb-6">
          <div className="bg-gray-100 px-4 py-2 border-r-4 border-purple-600 font-bold text-gray-700 mb-4">
            معلومات العقد
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">رقم العقد:</span>
              <span className="text-gray-800">{receipt.contract_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">المركبة:</span>
              <span className="text-gray-800">{receipt.vehicle_info}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">رقم الفاتورة:</span>
              <span className="text-gray-800">{receipt.invoice_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">إجمالي الفاتورة:</span>
              <span className="text-gray-800">{formatCurrencyKWD(receipt.total_invoice_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-6">
          <div className="bg-gray-100 px-4 py-2 border-r-4 border-purple-600 font-bold text-gray-700 mb-4">
            تفاصيل الدفعة
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">تاريخ الدفع:</span>
              <span className="text-gray-800">
                {format(new Date(receipt.payment_date), 'dd/MM/yyyy', { locale: ar })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
              <span className="font-semibold text-gray-600">طريقة الدفع:</span>
              <span className="text-gray-800">{paymentMethodText}</span>
            </div>
            {receipt.transaction_reference && (
              <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
                <span className="font-semibold text-gray-600">رقم المعاملة:</span>
                <span className="text-gray-800">{receipt.transaction_reference}</span>
              </div>
            )}
            {receipt.bank_name && (
              <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
                <span className="font-semibold text-gray-600">البنك:</span>
                <span className="text-gray-800">{receipt.bank_name}</span>
              </div>
            )}
            {receipt.check_number && (
              <div className="flex justify-between py-2 border-b border-dotted border-gray-300">
                <span className="font-semibold text-gray-600">رقم الشيك:</span>
                <span className="text-gray-800">{receipt.check_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-xl p-6 text-center mb-6">
          <div className="text-lg text-blue-700 mb-2">المبلغ المدفوع</div>
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrencyKWD(receipt.payment_amount)}
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="mb-6">
          <div className="flex justify-between py-3 text-lg">
            <span className="font-semibold text-gray-700">المبلغ المتبقي:</span>
            <span className={`font-bold ${receipt.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrencyKWD(receipt.remaining_amount)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 mb-6">
            <div className="font-bold text-yellow-800 mb-2">ملاحظات:</div>
            <div className="text-yellow-800">{receipt.notes}</div>
          </div>
        )}

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-10 mt-8">
          <div className="text-center">
            <div className="font-bold mb-2">توقيع المحاسب</div>
            <div className="border-t-2 border-gray-300 pt-2 h-12"></div>
          </div>
          <div className="text-center">
            <div className="font-bold mb-2">توقيع العميل</div>
            <div className="border-t-2 border-gray-300 pt-2 h-12"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t-2 border-gray-200">
          <div className="font-bold text-purple-600 mb-2">شكراً لتعاملكم معنا</div>
          <div className="text-sm text-gray-500">
            تم الطباعة في: {format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })}
          </div>
        </div>
      </div>
    </div>
  );
};