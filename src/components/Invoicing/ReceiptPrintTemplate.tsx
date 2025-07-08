import React from 'react';

interface ReceiptPrintTemplateProps {
  invoice: any;
  contract: any;
  latestPayment: any;
  companyBranding: any;
}

export const ReceiptPrintTemplate: React.FC<ReceiptPrintTemplateProps> = ({
  invoice,
  contract,
  latestPayment,
  companyBranding
}) => {
  const paymentMethodText = {
    cash: 'نقداً',
    card: 'بطاقة ائتمان',
    bank_transfer: 'حوالة بنكية',
    check: 'شيك',
    online: 'دفع إلكتروني'
  }[latestPayment.payment_method] || latestPayment.payment_method;

  return (
    <div className="receipt-container max-w-4xl mx-auto bg-white border-2 border-black p-8 text-black">
      <div className="header text-center mb-8 border-b-2 border-black pb-5">
        <div className="company-name text-2xl font-bold mb-3">
          {companyBranding?.company_name_ar || 'شركة ساپتكو الخليج لتأجير السيارات'}
        </div>
        <div className="mb-1">{companyBranding?.address_ar || 'دولة الكويت'}</div>
        <div>هاتف: {companyBranding?.phone || '+965 XXXX XXXX'}</div>
      </div>
      
      <div className="receipt-title text-xl font-bold my-5 text-center bg-gray-100 p-3">
        إيصال استلام دفعة
      </div>
      
      <div className="info-section mb-5">
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">رقم الإيصال:</span>
          <span className="info-value w-3/5 text-left">REC-{invoice.invoice_number}-{Date.now()}</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">اسم العميل:</span>
          <span className="info-value w-3/5 text-left">{contract.customers?.name || 'غير محدد'}</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">رقم الهاتف:</span>
          <span className="info-value w-3/5 text-left">{contract.customers?.phone || ''}</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">رقم العقد:</span>
          <span className="info-value w-3/5 text-left">{contract.contract_number}</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">المركبة:</span>
          <span className="info-value w-3/5 text-left">
            {contract.vehicles?.make} {contract.vehicles?.model} - {contract.vehicles?.license_plate}
          </span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">رقم الفاتورة:</span>
          <span className="info-value w-3/5 text-left">{invoice.invoice_number}</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">تاريخ الدفع:</span>
          <span className="info-value w-3/5 text-left">
            {new Date(latestPayment.payment_date).toLocaleDateString('ar')}
          </span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">طريقة الدفع:</span>
          <span className="info-value w-3/5 text-left">{paymentMethodText}</span>
        </div>
        {latestPayment.reference_number && (
          <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
            <span className="info-label font-bold w-2/5">رقم المرجع:</span>
            <span className="info-value w-3/5 text-left">{latestPayment.reference_number}</span>
          </div>
        )}
      </div>
      
      <div className="amount-section bg-gray-100 border-2 border-black p-5 text-center my-5">
        <div className="amount-label text-base mb-3">المبلغ المستلم</div>
        <div className="amount-value text-3xl font-bold">
          {latestPayment.amount.toLocaleString()} د.ك
        </div>
      </div>
      
      <div className="info-section mb-5">
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">إجمالي الفاتورة:</span>
          <span className="info-value w-3/5 text-left">{invoice.total_amount.toLocaleString()} د.ك</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">المبلغ المتبقي:</span>
          <span className="info-value w-3/5 text-left">{invoice.outstanding_amount.toLocaleString()} د.ك</span>
        </div>
        <div className="info-row flex justify-between py-2 border-b border-dotted border-gray-400">
          <span className="info-label font-bold w-2/5">حالة الدفع:</span>
          <span className="info-value w-3/5 text-left">
            {invoice.outstanding_amount > 0 ? 'دفع جزئي' : 'مدفوع بالكامل'}
          </span>
        </div>
      </div>
      
      <div className="footer mt-10 text-center border-t-2 border-black pt-5">
        <div className="mb-3">شكراً لثقتكم بخدماتنا</div>
        <div className="text-xs">
          تاريخ الطباعة: {new Date().toLocaleDateString('ar')} - {new Date().toLocaleTimeString('ar')}
        </div>
      </div>
      
      <style>{`
        @media print {
          .receipt-container {
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};