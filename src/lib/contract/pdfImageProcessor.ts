/**
 * معالج الصور لملفات PDF
 * يتعامل مع ضغط وتحسين الصور لاستخدامها في ملفات PDF
 */

export interface ImageProcessingOptions {
  quality: 'low' | 'medium' | 'high';
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  dataUrl: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

export class PDFImageProcessor {
  private readonly QUALITY_SETTINGS = {
    low: { quality: 0.6, maxDimension: 800 },
    medium: { quality: 0.8, maxDimension: 1200 },
    high: { quality: 0.9, maxDimension: 1600 }
  };

  /**
   * معالجة صورة واحدة للاستخدام في PDF
   */
  async processImageForPDF(
    imageUrl: string, 
    options: ImageProcessingOptions = { quality: 'medium' }
  ): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const processed = this.compressAndResizeImage(img, options);
          resolve(processed);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('فشل في تحميل الصورة'));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * معالجة مجموعة من الصور
   */
  async processMultipleImages(
    imageUrls: string[],
    options: ImageProcessingOptions = { quality: 'medium' },
    onProgress?: (processed: number, total: number) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const processed = await this.processImageForPDF(imageUrls[i], options);
        results.push(processed);
        onProgress?.(i + 1, imageUrls.length);
      } catch (error) {
        console.error(`فشل في معالجة الصورة ${i + 1}:`, error);
        // إضافة صورة فارغة في حالة الفشل
        results.push({
          dataUrl: '',
          originalSize: 0,
          processedSize: 0,
          compressionRatio: 0,
          dimensions: { width: 0, height: 0 }
        });
      }
    }
    
    return results;
  }

  /**
   * ضغط وتغيير حجم الصورة
   */
  private compressAndResizeImage(
    img: HTMLImageElement, 
    options: ImageProcessingOptions
  ): ProcessedImage {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('فشل في إنشاء Canvas');
    }

    const settings = this.QUALITY_SETTINGS[options.quality];
    const { width, height } = this.calculateOptimalDimensions(
      img.width, 
      img.height, 
      options.maxWidth || settings.maxDimension,
      options.maxHeight || settings.maxDimension
    );

    canvas.width = width;
    canvas.height = height;

    // تحسين جودة الرسم
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // رسم الصورة بالأبعاد الجديدة
    ctx.drawImage(img, 0, 0, width, height);

    // تحويل إلى Data URL مع الضغط
    const format = options.format || 'jpeg';
    const quality = settings.quality;
    const dataUrl = canvas.toDataURL(`image/${format}`, quality);
    
    // حساب الأحجام
    const originalSize = this.estimateImageSize(img.width, img.height);
    const processedSize = this.dataUrlSizeInBytes(dataUrl);
    const compressionRatio = ((originalSize - processedSize) / originalSize) * 100;

    return {
      dataUrl,
      originalSize,
      processedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      dimensions: { width, height }
    };
  }

  /**
   * حساب الأبعاد المثلى للصورة
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // تقليل الحجم إذا كان أكبر من الحد الأقصى
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    return { width, height };
  }

  /**
   * تقدير حجم الصورة بالبايت
   */
  private estimateImageSize(width: number, height: number): number {
    // تقدير تقريبي: 4 بايت لكل بكسل (RGBA)
    return width * height * 4;
  }

  /**
   * حساب حجم Data URL بالبايت
   */
  private dataUrlSizeInBytes(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1];
    return Math.round(base64.length * 0.75); // Base64 يضيف حوالي 25% حجم إضافي
  }

  /**
   * تحويل صورة إلى Blob
   */
  async imageToBlob(
    imageUrl: string,
    options: ImageProcessingOptions = { quality: 'medium' }
  ): Promise<Blob> {
    const processed = await this.processImageForPDF(imageUrl, options);
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const settings = this.QUALITY_SETTINGS[options.quality];
        const { width, height } = this.calculateOptimalDimensions(
          img.width, 
          img.height, 
          settings.maxDimension,
          settings.maxDimension
        );
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('فشل في تحويل الصورة إلى Blob'));
            }
          },
          `image/${options.format || 'jpeg'}`,
          settings.quality
        );
      };
      
      img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
      img.src = processed.dataUrl;
    });
  }

  /**
   * تنظيف الذاكرة
   */
  dispose(): void {
    // تنظيف أي موارد مؤقتة إذا لزم الأمر
  }
}

// إنشاء instance مشترك
export const pdfImageProcessor = new PDFImageProcessor();