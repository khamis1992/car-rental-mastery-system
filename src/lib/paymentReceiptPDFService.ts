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
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
          line-height: 1.5;
          color: #1a202c;
          background: #f7fafc;
          padding: 20px;
        }
        
        .receipt-container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          position: relative;
        }
        
        ${includeWatermark ? `
        .receipt-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23f1f5f9' text-anchor='middle' dy='.3em' transform='rotate(-45 50 50)'%3Eإيصال مدفوع%3C/text%3E%3C/svg%3E");
          background-repeat: repeat;
          opacity: 0.1;
          pointer-events: none;
          z-index: 1;
        }
        ` : ''}
        
        .receipt-content {
          position: relative;
          z-index: 2;
        }
        
        /* Header Section */
        .header {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
        }
        
        .header::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 10px solid #1a202c;
        }
        
        .company-logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .company-details {
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        /* Receipt Header */
        .receipt-header {
          background: #f8fafc;
          border-bottom: 3px solid #e2e8f0;
          padding: 25px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .receipt-title {
          font-size: 22px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .receipt-number {
          background: #1a202c;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Content Section */
        .content {
          padding: 30px;
        }
        
        .info-section {
          margin-bottom: 25px;
        }
        
        .section-header {
          background: #f1f5f9;
          margin: 0 -30px 20px -30px;
          padding: 12px 30px;
          font-weight: 600;
          color: #334155;
          font-size: 16px;
          border-left: 4px solid #1a202c;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .info-table td {
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        
        .info-table td:first-child {
          font-weight: 500;
          color: #4a5568;
          width: 35%;
        }
        
        .info-table td:last-child {
          color: #1a202c;
          font-weight: 500;
        }
        
        /* Amount Section */
        .amount-section {
          background: linear-gradient(135deg, #f0fff4 0%, #f7fafc 100%);
          border: 2px solid #68d391;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
          position: relative;
        }
        
        .amount-section::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #68d391, #38b2ac);
          border-radius: 12px;
          z-index: -1;
        }
        
        .amount-label {
          font-size: 16px;
          color: #22543d;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .amount-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          font-family: 'Cairo', monospace;
        }
        
        /* Status Section */
        .status-section {
          background: #fefefe;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
        }
        
        .status-item:not(:last-child) {
          border-bottom: 1px dotted #cbd5e0;
        }
        
        .status-label {
          font-weight: 500;
          color: #4a5568;
        }
        
        .status-value {
          font-weight: 600;
        }
        
        .status-value.positive {
          color: #38a169;
        }
        
        .status-value.negative {
          color: #e53e3e;
        }
        
        /* Notes Section */
        .notes-section {
          background: #fffbeb;
          border: 1px solid #f6e05e;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        
        .notes-title {
          font-weight: 600;
          color: #744210;
          margin-bottom: 10px;
          font-size: 15px;
        }
        
        .notes-text {
          color: #744210;
          line-height: 1.6;
        }
        
        /* Footer Sections */
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 40px 0 30px 0;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 15px;
          font-size: 15px;
        }
        
        .signature-line {
          height: 50px;
          border-bottom: 2px solid #1a202c;
          margin-bottom: 8px;
        }
        
        .signature-name {
          font-size: 12px;
          color: #718096;
        }
        
        /* Final Footer */
        .footer {
          background: #f8fafc;
          padding: 25px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          margin-top: 30px;
        }
        
        .footer-message {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 10px;
        }
        
        .print-info {
          font-size: 12px;
          color: #718096;
          margin-top: 15px;
        }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-sm { font-size: 12px; }
        .text-lg { font-size: 18px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        
        @media print {
          body { background: white; padding: 0; }
          .receipt-container { 
            box-shadow: none; 
            border-radius: 0;
            max-width: none;
          }
        }
        
        @page {
          margin: 15mm;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-content">
          <!-- Header -->
          <div class="header">
            <div class="company-logo">
              شت
            </div>
            <div class="company-name">${receipt.company_info.name}</div>
            <div class="company-details">
              ${receipt.company_info.address ? `${receipt.company_info.address}<br>` : ''}
              ${receipt.company_info.phone ? `هاتف: ${receipt.company_info.phone}` : ''}
              ${receipt.company_info.email ? ` • البريد الإلكتروني: ${receipt.company_info.email}` : ''}
            </div>
          </div>
          
          <!-- Receipt Header -->
          <div class="receipt-header">
            <div class="receipt-title">إيصال استلام دفعة</div>
            <div class="receipt-number">${receipt.receipt_number}</div>
          </div>
          
          <div class="content">
            <!-- Customer Information -->
            <div class="info-section">
              <div class="section-header">بيانات العميل</div>
              <table class="info-table">
                <tr>
                  <td>اسم العميل</td>
                  <td>${receipt.customer_name}</td>
                </tr>
                ${receipt.customer_phone ? `
                <tr>
                  <td>رقم الهاتف</td>
                  <td>${receipt.customer_phone}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- Contract Information -->
            <div class="info-section">
              <div class="section-header">بيانات العقد والمركبة</div>
              <table class="info-table">
                <tr>
                  <td>رقم العقد</td>
                  <td><strong>${receipt.contract_number}</strong></td>
                </tr>
                <tr>
                  <td>المركبة</td>
                  <td>${receipt.vehicle_info}</td>
                </tr>
                <tr>
                  <td>رقم الفاتورة</td>
                  <td>${receipt.invoice_number}</td>
                </tr>
                <tr>
                  <td>إجمالي قيمة الفاتورة</td>
                  <td><strong>${formatCurrencyKWD(receipt.total_invoice_amount)}</strong></td>
                </tr>
              </table>
            </div>
            
            <!-- Payment Details -->
            <div class="info-section">
              <div class="section-header">تفاصيل عملية الدفع</div>
              <table class="info-table">
                <tr>
                  <td>تاريخ الدفع</td>
                  <td>${format(new Date(receipt.payment_date), 'dd MMMM yyyy', { locale: ar })}</td>
                </tr>
                <tr>
                  <td>طريقة الدفع</td>
                  <td><strong>${paymentMethodText}</strong></td>
                </tr>
                ${receipt.transaction_reference ? `
                <tr>
                  <td>رقم المعاملة / المرجع</td>
                  <td>${receipt.transaction_reference}</td>
                </tr>
                ` : ''}
                ${receipt.bank_name ? `
                <tr>
                  <td>البنك</td>
                  <td>${receipt.bank_name}</td>
                </tr>
                ` : ''}
                ${receipt.check_number ? `
                <tr>
                  <td>رقم الشيك</td>
                  <td>${receipt.check_number}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- Amount Section -->
            <div class="amount-section">
              <div class="amount-label">المبلغ المستلم</div>
              <div class="amount-value">${formatCurrencyKWD(receipt.payment_amount)}</div>
            </div>
            
            <!-- Payment Status -->
            <div class="status-section">
              <div class="status-item">
                <span class="status-label">المبلغ المتبقي من الفاتورة:</span>
                <span class="status-value ${receipt.remaining_amount > 0 ? 'negative' : 'positive'}">
                  ${formatCurrencyKWD(receipt.remaining_amount)}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">حالة الدفع:</span>
                <span class="status-value ${receipt.remaining_amount > 0 ? 'negative' : 'positive'}">
                  ${receipt.remaining_amount > 0 ? 'دفع جزئي' : 'مدفوع بالكامل'}
                </span>
              </div>
            </div>
            
            ${receipt.notes ? `
            <!-- Notes -->
            <div class="notes-section">
              <div class="notes-title">ملاحظات إضافية:</div>
              <div class="notes-text">${receipt.notes}</div>
            </div>
            ` : ''}
            
            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-label">توقيع المسؤول المالي</div>
                <div class="signature-line"></div>
                <div class="signature-name">الاسم: ........................</div>
              </div>
              <div class="signature-box">
                <div class="signature-label">توقيع العميل</div>
                <div class="signature-line"></div>
                <div class="signature-name">الاسم: ........................</div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-message">شكراً لثقتكم بخدماتنا</div>
            <div style="font-size: 13px; color: #4a5568; margin-top: 8px;">
              هذا الإيصال صالح ومعتمد ولا يحتاج لختم أو توقيع إضافي
            </div>
            ${printDateTime ? `
            <div class="print-info">
              تاريخ ووقت الطباعة: ${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })}
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