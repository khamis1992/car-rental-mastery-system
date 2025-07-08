import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PaymentReceipt, PaymentReceiptPDFOptions } from '@/types/payment-receipt';
import { formatCurrencyKWD } from '@/lib/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const generatePaymentReceiptHTML = (
  receipt: PaymentReceipt, 
  options: PaymentReceiptPDFOptions = {}
): string => {
  const {
    includeWatermark = false,
    language = 'ar',
    printDateTime = true
  } = options;

  const paymentMethodText = {
    cash: 'نقداً',
    card: 'بطاقة ائتمان',
    bank_transfer: 'حوالة بنكية',
    check: 'شيك',
    online: 'دفع إلكتروني'
  }[receipt.payment_method] || receipt.payment_method;

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          font-size: 14px;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
        }
        
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          position: relative;
        }
        
        ${includeWatermark ? `
        .receipt-container::before {
          content: 'إيصال دفع';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(168, 162, 255, 0.1);
          font-weight: bold;
          z-index: 1;
          pointer-events: none;
        }
        ` : ''}
        
        .receipt-content {
          position: relative;
          z-index: 2;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #8b5cf6;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #8b5cf6;
          margin-bottom: 8px;
        }
        
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .receipt-number {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          font-weight: bold;
          font-size: 16px;
        }
        
        .info-section {
          margin-bottom: 20px;
        }
        
        .section-title {
          background: #f3f4f6;
          padding: 10px 15px;
          border-right: 4px solid #8b5cf6;
          font-weight: bold;
          color: #374151;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dotted #d1d5db;
        }
        
        .info-label {
          font-weight: 600;
          color: #4b5563;
          min-width: 120px;
        }
        
        .info-value {
          color: #1f2937;
          font-weight: 500;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        
        .amount-label {
          font-size: 16px;
          color: #0369a1;
          margin-bottom: 8px;
        }
        
        .amount-value {
          font-size: 28px;
          font-weight: bold;
          color: #0c4a6e;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }
        
        .print-info {
          font-size: 12px;
          color: #6b7280;
          margin-top: 15px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
          border-top: 2px solid #d1d5db;
          padding-top: 10px;
        }
        
        .notes-section {
          background: #fef7cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        
        .notes-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .notes-text {
          color: #92400e;
        }
        
        @media print {
          .receipt-container {
            border: none;
            box-shadow: none;
            margin: 0;
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-content">
          <!-- Header -->
          <div class="header">
            <div class="company-name">${receipt.company_info.name}</div>
            ${receipt.company_info.address ? `<div style="font-size: 14px; color: #6b7280;">${receipt.company_info.address}</div>` : ''}
            ${receipt.company_info.phone ? `<div style="font-size: 14px; color: #6b7280;">هاتف: ${receipt.company_info.phone}</div>` : ''}
            ${receipt.company_info.email ? `<div style="font-size: 14px; color: #6b7280;">البريد الإلكتروني: ${receipt.company_info.email}</div>` : ''}
            
            <div class="receipt-title">إيصال دفعة</div>
            <div class="receipt-number">${receipt.receipt_number}</div>
          </div>
          
          <!-- Customer Info -->
          <div class="info-section">
            <div class="section-title">معلومات العميل</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">اسم العميل:</span>
                <span class="info-value">${receipt.customer_name}</span>
              </div>
              ${receipt.customer_phone ? `
              <div class="info-item">
                <span class="info-label">رقم الهاتف:</span>
                <span class="info-value">${receipt.customer_phone}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Contract Info -->
          <div class="info-section">
            <div class="section-title">معلومات العقد</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">رقم العقد:</span>
                <span class="info-value">${receipt.contract_number}</span>
              </div>
              <div class="info-item">
                <span class="info-label">المركبة:</span>
                <span class="info-value">${receipt.vehicle_info}</span>
              </div>
              <div class="info-item">
                <span class="info-label">رقم الفاتورة:</span>
                <span class="info-value">${receipt.invoice_number}</span>
              </div>
              <div class="info-item">
                <span class="info-label">إجمالي الفاتورة:</span>
                <span class="info-value">${formatCurrencyKWD(receipt.total_invoice_amount)}</span>
              </div>
            </div>
          </div>
          
          <!-- Payment Info -->
          <div class="info-section">
            <div class="section-title">تفاصيل الدفعة</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">تاريخ الدفع:</span>
                <span class="info-value">${format(new Date(receipt.payment_date), 'dd/MM/yyyy', { locale: ar })}</span>
              </div>
              <div class="info-item">
                <span class="info-label">طريقة الدفع:</span>
                <span class="info-value">${paymentMethodText}</span>
              </div>
              ${receipt.transaction_reference ? `
              <div class="info-item">
                <span class="info-label">رقم المعاملة:</span>
                <span class="info-value">${receipt.transaction_reference}</span>
              </div>
              ` : ''}
              ${receipt.bank_name ? `
              <div class="info-item">
                <span class="info-label">البنك:</span>
                <span class="info-value">${receipt.bank_name}</span>
              </div>
              ` : ''}
              ${receipt.check_number ? `
              <div class="info-item">
                <span class="info-label">رقم الشيك:</span>
                <span class="info-value">${receipt.check_number}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Amount Section -->
          <div class="amount-section">
            <div class="amount-label">المبلغ المدفوع</div>
            <div class="amount-value">${formatCurrencyKWD(receipt.payment_amount)}</div>
          </div>
          
          <!-- Remaining Amount -->
          <div class="info-section">
            <div class="info-item">
              <span class="info-label" style="font-size: 16px;">المبلغ المتبقي:</span>
              <span class="info-value" style="font-size: 16px; font-weight: bold; color: ${receipt.remaining_amount > 0 ? '#dc2626' : '#059669'};">
                ${formatCurrencyKWD(receipt.remaining_amount)}
              </span>
            </div>
          </div>
          
          ${receipt.notes ? `
          <!-- Notes -->
          <div class="notes-section">
            <div class="notes-title">ملاحظات:</div>
            <div class="notes-text">${receipt.notes}</div>
          </div>
          ` : ''}
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div style="font-weight: bold; margin-bottom: 5px;">توقيع المحاسب</div>
              <div style="height: 40px;"></div>
            </div>
            <div class="signature-box">
              <div style="font-weight: bold; margin-bottom: 5px;">توقيع العميل</div>
              <div style="height: 40px;"></div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div style="font-weight: bold; color: #8b5cf6;">شكراً لتعاملكم معنا</div>
            ${printDateTime ? `
            <div class="print-info">
              تم الطباعة في: ${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })}
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generatePaymentReceiptPDF = async (
  receipt: PaymentReceipt,
  options: PaymentReceiptPDFOptions = {},
  onProgress?: (step: string, progress: number) => void
): Promise<Blob> => {
  onProgress?.('بدء إنشاء إيصال الدفع', 0);

  onProgress?.('إنشاء محتوى HTML', 20);

  // إنشاء عنصر HTML مؤقت للإيصال
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.background = 'white';
  tempDiv.style.fontFamily = 'Cairo, sans-serif';
  tempDiv.style.direction = 'rtl';

  // محتوى الإيصال
  tempDiv.innerHTML = generatePaymentReceiptHTML(receipt, options);

  document.body.appendChild(tempDiv);

  try {
    onProgress?.('تحويل إلى PDF', 60);

    // تحويل HTML إلى Canvas مع إعدادات محسنة
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      logging: false,
      imageTimeout: 15000,
      removeContainer: true
    });

    onProgress?.('إنشاء ملف PDF', 80);

    // إنشاء PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    
    // إضافة الصورة إلى PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    onProgress?.('إنهاء المعالجة', 100);

    // إنشاء Blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } finally {
    // إزالة العنصر المؤقت
    document.body.removeChild(tempDiv);
  }
};

export const downloadPaymentReceiptPDF = async (
  receipt: PaymentReceipt,
  filename?: string,
  options: PaymentReceiptPDFOptions = {},
  onProgress?: (step: string, progress: number) => void
) => {
  try {
    const pdfBlob = await generatePaymentReceiptPDF(receipt, options, onProgress);
    
    // إنشاء رابط تحميل
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `payment_receipt_${receipt.receipt_number}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // تنظيف الرابط
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating payment receipt PDF:', error);
    throw new Error('فشل في إنشاء ملف PDF للإيصال');
  }
};