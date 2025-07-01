import { supabase } from '@/integrations/supabase/client';

export interface PhotoMetadata {
  contractId: string;
  type: 'pickup' | 'return';
  category?: 'exterior' | 'interior' | 'damage' | 'general';
  description?: string;
  timestamp: string;
  location?: { lat: number; lng: number };
  deviceInfo?: string;
}

export interface PhotoUploadResult {
  url: string;
  path: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

class PhotoService {
  private readonly BUCKET_NAME = 'vehicle-conditions';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly COMPRESSION_QUALITY = {
    high: 0.9,
    medium: 0.8,
    low: 0.6
  };
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * رفع صورة مع ضغطها وإضافة metadata مع إعادة المحاولة
   */
  async uploadVehiclePhoto(
    file: File, 
    metadata: PhotoMetadata,
    onProgress?: UploadProgressCallback,
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<PhotoUploadResult> {
    const originalSize = file.size;
    
    try {
      // التحقق من صيغة الملف
      if (!this.validateImageFormat(file)) {
        return { 
          url: '', 
          path: '', 
          error: 'صيغة الصورة غير مدعومة. يرجى استخدام JPEG أو PNG أو WebP' 
        };
      }

      // التحقق من حجم الملف
      if (file.size > this.MAX_FILE_SIZE) {
        return { 
          url: '', 
          path: '', 
          error: 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت' 
        };
      }

      // ضغط الصورة
      onProgress?.({ loaded: 0, total: 100, percentage: 10 });
      const compressedFile = await this.compressImageAdvanced(file, quality);
      const compressedSize = compressedFile.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
      
      onProgress?.({ loaded: 30, total: 100, percentage: 30 });
      
      // إنشاء مسار فريد للملف
      const fileExt = this.getOptimalFileExtension(file);
      const fileName = `${metadata.contractId}_${metadata.type}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${metadata.contractId}/${metadata.type}/${fileName}`;

      // رفع الملف مع إعادة المحاولة
      onProgress?.({ loaded: 50, total: 100, percentage: 50 });
      const uploadResult = await this.uploadWithRetry(compressedFile, filePath, file.type);
      
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      onProgress?.({ loaded: 90, total: 100, percentage: 90 });

      // الحصول على URL العام
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      onProgress?.({ loaded: 100, total: 100, percentage: 100 });

      return {
        url: data.publicUrl,
        path: filePath,
        originalSize,
        compressedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100
      };

    } catch (error) {
      console.error('Error uploading photo:', error);
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'فشل في رفع الصورة',
        originalSize,
        compressedSize: 0,
        compressionRatio: 0
      };
    }
  }

  /**
   * رفع متعدد للصور مع تتبع التقدم
   */
  async uploadMultiplePhotos(
    files: File[],
    metadata: PhotoMetadata,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadVehiclePhoto(
        file,
        metadata,
        (progress) => onProgress?.(i, progress),
        quality
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * حذف صورة من التخزين
   */
  async deleteVehiclePhoto(photoUrl: string): Promise<boolean> {
    try {
      // استخراج مسار الملف من URL
      const urlParts = photoUrl.split(`/${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        throw new Error('Invalid photo URL');
      }
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  /**
   * جلب جميع صور العقد
   */
  async getContractPhotos(contractId: string): Promise<{
    pickupPhotos: string[];
    returnPhotos: string[];
  }> {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('pickup_photos, return_photos')
        .eq('id', contractId)
        .single();

      if (error) {
        throw error;
      }

      return {
        pickupPhotos: contract?.pickup_photos || [],
        returnPhotos: contract?.return_photos || []
      };
    } catch (error) {
      console.error('Error fetching contract photos:', error);
      return {
        pickupPhotos: [],
        returnPhotos: []
      };
    }
  }

  /**
   * ضغط الصورة المتقدم مع خيارات جودة مختلفة
   */
  private async compressImageAdvanced(
    file: File, 
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<File> {
    const qualityValue = this.COMPRESSION_QUALITY[quality];
    return this.compressImage(file, qualityValue);
  }

  /**
   * الحصول على أفضل امتداد للملف
   */
  private getOptimalFileExtension(file: File): string {
    // تحويل PNG إلى JPEG لتوفير المساحة إذا لم تكن هناك شفافية
    if (file.type === 'image/png') {
      return 'jpg';
    }
    
    return file.name.split('.').pop() || 'jpg';
  }

  /**
   * رفع الملف مع إعادة المحاولة
   */
  private async uploadWithRetry(
    file: File, 
    filePath: string, 
    contentType: string
  ): Promise<{ error?: string }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const { error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType,
          });

        if (!error) {
          return {};
        }
        
        lastError = error;
        
        // إذا كان خطأ الملف موجود، لا نعيد المحاولة
        if (error.message?.includes('already exists')) {
          break;
        }
        
        // انتظار قبل إعادة المحاولة
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
        
      } catch (error) {
        lastError = error;
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    return { 
      error: lastError?.message || 'فشل في رفع الملف بعد عدة محاولات' 
    };
  }

  /**
   * تأخير لإعادة المحاولة
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ضغط الصورة قبل الرفع
   */
  private async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // حساب الأبعاد الجديدة (أقصى عرض/ارتفاع 1920px)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // رسم الصورة بالأبعاد الجديدة
        ctx?.drawImage(img, 0, 0, width, height);

        // تحويل إلى Blob مع ضغط
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // إرجاع الملف الأصلي في حالة فشل الضغط
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * التحقق من صيغة الصورة
   */
  private validateImageFormat(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type);
  }

  /**
   * تنظيف الصور المهجورة (صور غير مرتبطة بعقود)
   */
  async cleanupOrphanedPhotos(): Promise<void> {
    try {
      // جلب جميع الملفات من التخزين
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list();

      if (error || !files) {
        throw error;
      }

      // جلب جميع العقود مع صورها
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('pickup_photos, return_photos');

      if (contractsError) {
        throw contractsError;
      }

      // جمع جميع URLs الصور المستخدمة
      const usedUrls = new Set<string>();
      contracts?.forEach(contract => {
        contract.pickup_photos?.forEach((url: string) => usedUrls.add(url));
        contract.return_photos?.forEach((url: string) => usedUrls.add(url));
      });

      // حذف الملفات غير المستخدمة
      const filesToDelete = files
        .filter(file => {
          const { data } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(file.name);
          return !usedUrls.has(data.publicUrl);
        })
        .map(file => file.name);

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete);
        
        console.log(`Cleaned up ${filesToDelete.length} orphaned photos`);
      }
    } catch (error) {
      console.error('Error cleaning up orphaned photos:', error);
    }
  }

  /**
   * فحص جودة الصورة وتحديد أفضل إعدادات ضغط
   */
  async analyzeImageQuality(file: File): Promise<{
    recommendedQuality: 'high' | 'medium' | 'low';
    estimatedCompression: number;
    hasTransparency: boolean;
    dimensions: { width: number; height: number };
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // فحص الشفافية
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        let hasTransparency = false;
        
        if (imageData && file.type === 'image/png') {
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] < 255) {
              hasTransparency = true;
              break;
            }
          }
        }

        // تحديد الجودة المناسبة بناءً على حجم الملف والأبعاد
        let recommendedQuality: 'high' | 'medium' | 'low' = 'medium';
        const fileSize = file.size;
        const totalPixels = img.width * img.height;

        if (fileSize > 2 * 1024 * 1024 || totalPixels > 2000000) {
          recommendedQuality = 'low';
        } else if (fileSize < 500 * 1024 && totalPixels < 1000000) {
          recommendedQuality = 'high';
        }

        // تقدير نسبة الضغط
        const estimatedCompression = hasTransparency ? 30 : 50;

        resolve({
          recommendedQuality,
          estimatedCompression,
          hasTransparency,
          dimensions: { width: img.width, height: img.height }
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * تصحيح اتجاه الصورة بناءً على EXIF
   */
  private async correctImageOrientation(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // في هذا التطبيق البسيط، لن نقوم بمعالجة EXIF معقدة
        // يمكن إضافة مكتبة لمعالجة EXIF في المستقبل
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const correctedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(correctedFile);
          } else {
            resolve(file);
          }
        }, file.type);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * إنشاء صورة مصغرة
   */
  async generateThumbnail(
    file: File, 
    size: number = 200
  ): Promise<{ url: string; blob: Blob } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // حساب الأبعاد للصورة المصغرة
        let { width, height } = img;
        
        if (width > height) {
          height = (height * size) / width;
          width = size;
        } else {
          width = (width * size) / height;
          height = size;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({ url, blob });
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * تحديد ما إذا كان يجب ضغط الصورة
   */
  private shouldCompressImage(file: File): boolean {
    const sizeThreshold = 500 * 1024; // 500KB
    return file.size > sizeThreshold;
  }

  /**
   * الحصول على معلومات الملف
   */
  async getFileInfo(photoUrl: string): Promise<{
    size?: number;
    lastModified?: string;
    contentType?: string;
  } | null> {
    try {
      const urlParts = photoUrl.split(`/${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        return null;
      }
      
      const filePath = urlParts[1];
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'));

      if (error || !data) {
        return null;
      }

      const fileName = filePath.split('/').pop();
      const fileInfo = data.find(file => file.name === fileName);

      return fileInfo ? {
        size: fileInfo.metadata?.size,
        lastModified: fileInfo.updated_at,
        contentType: fileInfo.metadata?.mimetype
      } : null;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
}

export const photoService = new PhotoService();