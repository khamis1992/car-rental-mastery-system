import { supabase } from '@/integrations/supabase/client';

export interface PhotoMetadata {
  contractId: string;
  type: 'pickup' | 'return';
  category?: 'exterior' | 'interior' | 'damage' | 'general';
  description?: string;
  timestamp: string;
}

export interface PhotoUploadResult {
  url: string;
  path: string;
  error?: string;
}

class PhotoService {
  private readonly BUCKET_NAME = 'vehicle-conditions';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * رفع صورة مع ضغطها وإضافة metadata
   */
  async uploadVehiclePhoto(
    file: File, 
    metadata: PhotoMetadata
  ): Promise<PhotoUploadResult> {
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
      const compressedFile = await this.compressImage(file);
      
      // إنشاء مسار فريد للملف
      const fileExt = file.name.split('.').pop();
      const fileName = `${metadata.contractId}_${metadata.type}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${metadata.contractId}/${metadata.type}/${fileName}`;

      // رفع الملف
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // الحصول على URL العام
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error uploading photo:', error);
      return { 
        url: '', 
        path: '', 
        error: 'فشل في رفع الصورة' 
      };
    }
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