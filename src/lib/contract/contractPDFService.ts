import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ContractPDFData } from '@/types/contract';
import { generateContractHTML, PDFOptions } from './contractTemplate';
import { pdfImageProcessor, ProcessedImage } from './pdfImageProcessor';

export const generateContractPDF = async (
  contract: ContractPDFData, 
  options: PDFOptions = {},
  onProgress?: (step: string, progress: number) => void
): Promise<Blob> => {
  onProgress?.('بدء المعالجة', 0);

  // معالجة الصور إذا كانت مطلوبة
  let processedContract = { ...contract };
  if (options.includePhotos) {
    onProgress?.('معالجة الصور', 20);
    processedContract = await processImagesForContract(contract, options, onProgress);
  }

  onProgress?.('إنشاء محتوى HTML', 40);

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

  // محتوى العقد مع الصور المعالجة
  tempDiv.innerHTML = await generateContractHTML(processedContract, options);

  document.body.appendChild(tempDiv);

  try {
    onProgress?.('تحويل إلى PDF', 60);

    // تحويل HTML إلى Canvas مع إعدادات محسنة
    const canvas = await html2canvas(tempDiv, {
      scale: options.photoQuality === 'high' ? 2 : options.photoQuality === 'low' ? 1 : 1.5,
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

    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    
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

/**
 * معالجة صور العقد قبل إضافتها للـ PDF
 */
async function processImagesForContract(
  contract: ContractPDFData,
  options: PDFOptions,
  onProgress?: (step: string, progress: number) => void
): Promise<ContractPDFData> {
  const processedContract = { ...contract };
  
  // معالجة صور التسليم
  if (contract.pickup_photos && contract.pickup_photos.length > 0) {
    onProgress?.('معالجة صور التسليم', 25);
    
    const maxPhotos = Math.min(
      contract.pickup_photos.length, 
      options.maxPhotosPerSection || 6
    );
    
    const photosToProcess = contract.pickup_photos.slice(0, maxPhotos);
    const processedPhotos = await pdfImageProcessor.processMultipleImages(
      photosToProcess,
      { quality: options.photoQuality || 'medium' },
      (processed, total) => {
        const progress = 25 + (processed / total) * 10;
        onProgress?.(`معالجة صور التسليم (${processed}/${total})`, progress);
      }
    );
    
    processedContract.pickup_photos = processedPhotos
      .filter(p => p.dataUrl)
      .map(p => p.dataUrl);
  }
  
  // معالجة صور الإرجاع
  if (contract.return_photos && contract.return_photos.length > 0) {
    onProgress?.('معالجة صور الإرجاع', 35);
    
    const maxPhotos = Math.min(
      contract.return_photos.length, 
      options.maxPhotosPerSection || 6
    );
    
    const photosToProcess = contract.return_photos.slice(0, maxPhotos);
    const processedPhotos = await pdfImageProcessor.processMultipleImages(
      photosToProcess,
      { quality: options.photoQuality || 'medium' },
      (processed, total) => {
        const progress = 35 + (processed / total) * 10;
        onProgress?.(`معالجة صور الإرجاع (${processed}/${total})`, progress);
      }
    );
    
    processedContract.return_photos = processedPhotos
      .filter(p => p.dataUrl)
      .map(p => p.dataUrl);
  }
  
  return processedContract;
}

export const downloadContractPDF = async (
  contract: ContractPDFData, 
  filename?: string,
  options: PDFOptions = {},
  onProgress?: (step: string, progress: number) => void
) => {
  try {
    const pdfBlob = await generateContractPDF(contract, options, onProgress);
    
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