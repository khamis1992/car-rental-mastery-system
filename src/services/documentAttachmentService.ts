import { supabase } from "@/integrations/supabase/client";
import { accountingService } from "./accountingService";

export interface DocumentAttachment {
  id: string;
  tenant_id: string;
  reference_type: 'journal_entry' | 'contract' | 'invoice' | 'payment' | 'expense';
  reference_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
  is_required: boolean;
  document_category: string;
  notes?: string;
  created_at: string;
}

export interface UploadDocumentData {
  reference_type: DocumentAttachment['reference_type'];
  reference_id: string;
  file: File;
  is_required?: boolean;
  document_category?: string;
  notes?: string;
}

export const documentAttachmentService = {
  async uploadDocument(data: UploadDocumentData): Promise<DocumentAttachment> {
    try {
      // رفع الملف إلى التخزين
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${data.reference_type}_${data.reference_id}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${data.reference_type}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      // الحصول على معرف المؤسسة
      const tenantId = await accountingService.getCurrentTenantId();
      
      // حفظ بيانات المرفق في قاعدة البيانات
      const { data: attachment, error: dbError } = await supabase
        .from('document_attachments')
        .insert({
          tenant_id: tenantId,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          file_name: data.file.name,
          file_path: uploadData.path,
          file_size: data.file.size,
          file_type: data.file.type,
          is_required: data.is_required || false,
          document_category: data.document_category || 'supporting_document',
          notes: data.notes
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return attachment as DocumentAttachment;
    } catch (error) {
      console.error('خطأ في رفع المستند:', error);
      throw error;
    }
  },

  async getDocuments(referenceType: string, referenceId: string): Promise<DocumentAttachment[]> {
    const { data, error } = await supabase
      .from('document_attachments')
      .select('*')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DocumentAttachment[];
  },

  async deleteDocument(id: string): Promise<void> {
    // جلب بيانات المرفق أولاً
    const { data: attachment, error: fetchError } = await supabase
      .from('document_attachments')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // حذف الملف من التخزين
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.file_path]);

    if (storageError) throw storageError;

    // حذف السجل من قاعدة البيانات
    const { error: dbError } = await supabase
      .from('document_attachments')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  },

  async getDocumentUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600); // صالح لمدة ساعة

    return data?.signedUrl || '';
  },

  async downloadDocument(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(filePath);

    if (error) throw error;
    return data;
  }
};