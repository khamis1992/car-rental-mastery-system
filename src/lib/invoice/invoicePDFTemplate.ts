import { Invoice } from '@/types/invoice';
import { CompanyBrandingService } from '@/services/companyBrandingService';

export interface InvoicePDFOptions {
  includeTerms?: boolean;
  includeNotes?: boolean;
  watermark?: string;
}

export const generateInvoiceHTML = async (invoice: any, options: InvoicePDFOptions = {}): Promise<string> => {
  // تحميل إعدادات الشركة
  const branding = await CompanyBrandingService.getCompanyBranding();
  
  const formatCurrency = (amount: number) => `د.ك ${amount.toFixed(3)}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  // استخدام بيانات الشركة من قاعدة البيانات أو القيم الافتراضية
  const companyNameAr = branding?.company_name_ar || 'شركة ساپتكو الخليج لتأجير السيارات';
  const companyNameEn = branding?.company_name_en || 'SAPTCO GULF CAR RENTAL COMPANY';
  const addressAr = branding?.address_ar || 'دولة الكويت';
  const phone = branding?.phone || '+965 XXXX XXXX';
  const email = branding?.email || 'info@saptcogulf.com';
  const website = branding?.website || 'www.saptcougulf.com';
  const logoUrl = branding?.logo_url || '/lovable-uploads/cf0ef0ce-1c56-4da0-b065-8c130f4f182f.png';
  const headerImageUrl = branding?.header_image_url;
  const footerImageUrl = branding?.footer_image_url;

  const getInvoiceTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      rental: 'فاتورة إيجار',
      additional: 'فاتورة رسوم إضافية',
      penalty: 'فاتورة غرامة',
      extension: 'فاتورة تمديد'
    };
    return typeMap[type] || 'فاتورة';
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة ${invoice.invoice_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          background: white;
          color: #333;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          position: relative;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        
        .invoice-info {
          text-align: left;
          flex: 1;
        }
        
        .invoice-number {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .invoice-type {
          font-size: 16px;
          font-weight: 600;
          color: #059669;
          margin-bottom: 5px;
        }
        
        .invoice-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-partially_paid { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #f3f4f6; color: #6b7280; }
        
        .details-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 40px;
        }
        
        .details-card {
          flex: 1;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-right: 4px solid #2563eb;
        }
        
        .details-title {
          font-size: 16px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 4px 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #475569;
        }
        
        .detail-value {
          color: #1e293b;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th {
          background: #2563eb;
          color: white;
          padding: 15px 12px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .items-table td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .items-table tr:hover {
          background: #f1f5f9;
        }
        
        .description-cell {
          text-align: right !important;
          max-width: 200px;
        }
        
        .totals-section {
          background: #f8fafc;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
        }
        
        .totals-row.subtotal {
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 12px;
        }
        
        .totals-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #2563eb;
          border-top: 2px solid #2563eb;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .notes-section {
          margin-top: 30px;
        }
        
        .notes-title {
          font-size: 16px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .notes-content {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          border-right: 4px solid #94a3b8;
          color: #475569;
          line-height: 1.6;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          font-weight: 700;
          color: rgba(37, 99, 235, 0.1);
          pointer-events: none;
          z-index: 0;
        }
        
        .content {
          position: relative;
          z-index: 1;
        }
        
        @media print {
          .invoice-container {
            margin: 0;
            padding: 15mm;
          }
          
          body {
            background: white;
          }
          
          .watermark {
            color: rgba(37, 99, 235, 0.05);
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
        
        <div class="content">
          <!-- Invoice Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="invoice-type">${getInvoiceTypeText(invoice.invoice_type)}</div>
            <div class="invoice-status status-${invoice.status}">
              ${getStatusText(invoice.status)}
            </div>
          </div>
          
          <!-- Details Section -->
          <div class="details-section">
            <!-- Customer Info -->
            <div class="details-card">
              <div class="details-title">معلومات العميل</div>
              <div class="detail-row">
                <span class="detail-label">الاسم:</span>
                <span class="detail-value">${invoice.customers?.name || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">الهاتف:</span>
                <span class="detail-value">${invoice.customers?.phone || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">${invoice.customers?.email || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">العنوان:</span>
                <span class="detail-value">${invoice.customers?.address || ''}</span>
              </div>
            </div>
            
            <!-- Invoice Details -->
            <div class="details-card">
              <div class="details-title">تفاصيل الفاتورة</div>
              <div class="detail-row">
                <span class="detail-label">تاريخ الإصدار:</span>
                <span class="detail-value">${formatDate(invoice.issue_date)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">تاريخ الاستحقاق:</span>
                <span class="detail-value">${formatDate(invoice.due_date)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">شروط الدفع:</span>
                <span class="detail-value">${invoice.payment_terms || 'استحقاق خلال 30 يوم'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">رقم العقد:</span>
                <span class="detail-value">${invoice.contracts?.contract_number || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>الوصف</th>
                <th>النوع</th>
                <th>الكمية</th>
                <th>السعر الفردي</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.invoice_items?.map((item: any) => `
                <tr>
                  <td class="description-cell">${item.description}</td>
                  <td>${item.item_type}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            <div class="totals-row subtotal">
              <span>المجموع الفرعي:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount_amount > 0 ? `
              <div class="totals-row">
                <span>الخصم:</span>
                <span>-${formatCurrency(invoice.discount_amount)}</span>
              </div>
            ` : ''}
            ${invoice.tax_amount > 0 ? `
              <div class="totals-row">
                <span>الضريبة:</span>
                <span>${formatCurrency(invoice.tax_amount)}</span>
              </div>
            ` : ''}
            <div class="totals-row total">
              <span>المجموع الكلي:</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
            </div>
            ${invoice.paid_amount > 0 ? `
              <div class="totals-row">
                <span>المبلغ المدفوع:</span>
                <span>${formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div class="totals-row">
                <span>المبلغ المستحق:</span>
                <span>${formatCurrency(invoice.outstanding_amount)}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Notes -->
          ${options.includeNotes && invoice.notes ? `
            <div class="notes-section">
              <div class="notes-title">ملاحظات</div>
              <div class="notes-content">${invoice.notes}</div>
            </div>
          ` : ''}
          
          <!-- Terms and Conditions -->
          ${options.includeTerms && invoice.terms_and_conditions ? `
            <div class="notes-section">
              <div class="notes-title">الشروط والأحكام</div>
              <div class="notes-content">${invoice.terms_and_conditions}</div>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="footer">
            <p>تم إنشاء هذه الفاتورة بتاريخ ${formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};