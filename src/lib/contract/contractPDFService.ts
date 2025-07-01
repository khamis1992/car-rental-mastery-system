import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ContractPDFData } from '@/types/contract';
import { generateContractHTML, PDFOptions } from './contractTemplate';

export const generateContractPDF = async (
  contract: ContractPDFData, 
  options: PDFOptions = {}
): Promise<Blob> => {
  // إنشاء عنصر HTML مؤقت للعقد
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.background = 'white';
  tempDiv.style.fontFamily = 'Cairo, sans-serif';
  tempDiv.style.direction = 'rtl';
  tempDiv.style.padding = '20mm';

  // محتوى العقد
  tempDiv.innerHTML = generateContractHTML(contract, options);

  document.body.appendChild(tempDiv);

  try {
    // تحويل HTML إلى Canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    });

    // إنشاء PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // إضافة الصورة إلى PDF
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

    // إنشاء Blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } finally {
    // إزالة العنصر المؤقت
    document.body.removeChild(tempDiv);
  }
};

export const downloadContractPDF = async (
  contract: ContractPDFData, 
  filename?: string,
  options: PDFOptions = {}
) => {
  try {
    const pdfBlob = await generateContractPDF(contract, options);
    
    // إنشاء رابط تحميل
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `contract_${contract.contract_number}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // تنظيف الرابط
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('فشل في إنشاء ملف PDF');
  }
};