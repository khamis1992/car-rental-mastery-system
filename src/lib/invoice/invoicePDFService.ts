import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '@/types/invoice';
import { generateInvoiceHTML, InvoicePDFOptions } from './invoicePDFTemplate';

export const generateInvoicePDF = async (
  invoice: Invoice, 
  options: InvoicePDFOptions = {},
  onProgress?: (step: string, progress: number) => void
): Promise<Blob> => {
  onProgress?.('بدء إنشاء الفاتورة', 0);

  onProgress?.('إنشاء محتوى HTML', 20);

  // إنشاء عنصر HTML مؤقت للفاتورة
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.background = 'white';
  tempDiv.style.fontFamily = 'Cairo, sans-serif';
  tempDiv.style.direction = 'rtl';

  // محتوى الفاتورة
  tempDiv.innerHTML = await generateInvoiceHTML(invoice, options);

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

export const downloadInvoicePDF = async (
  invoice: Invoice, 
  filename?: string,
  options: InvoicePDFOptions = {},
  onProgress?: (step: string, progress: number) => void
) => {
  try {
    const pdfBlob = await generateInvoicePDF(invoice, options, onProgress);
    
    // إنشاء رابط تحميل
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice_${invoice.invoice_number}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // تنظيف الرابط
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('فشل في إنشاء ملف PDF للفاتورة');
  }
};