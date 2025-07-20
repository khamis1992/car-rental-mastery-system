import React, { useState, useRef } from 'react';
import { Upload, File, Trash2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JournalEntryAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_at: string;
}

interface JournalEntryAttachmentsProps {
  journalEntryId?: string;
  attachments: JournalEntryAttachment[];
  onAttachmentsChange: (attachments: JournalEntryAttachment[]) => void;
  disabled?: boolean;
}

export const JournalEntryAttachments: React.FC<JournalEntryAttachmentsProps> = ({
  journalEntryId,
  attachments,
  onAttachmentsChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return '📊';
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return '📝';
    }
    return '📎';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: JournalEntryAttachment[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'خطأ',
            description: `حجم الملف ${file.name} كبير جداً. الحد الأقصى 10 ميجابايت`,
            variant: 'destructive',
          });
          continue;
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `journal-entries/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'خطأ في الرفع',
            description: `فشل في رفع ${file.name}: ${uploadError.message}`,
            variant: 'destructive',
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(storageData.path);

        // Create attachment record
        const newAttachment: JournalEntryAttachment = {
          id: Math.random().toString(36).substring(2),
          file_name: file.name,
          file_path: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_at: new Date().toISOString()
        };

        // If journal entry exists, save to database
        if (journalEntryId) {
          // Get current tenant ID and session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Get tenant ID from tenant_users table
          const { data: tenantUser } = await supabase
            .from('tenant_users')
            .select('tenant_id')
            .eq('user_id', session?.user?.id)
            .eq('status', 'active')
            .single();
          
          const tenantId = tenantUser?.tenant_id;
          
          const { data: attachmentData, error: dbError } = await supabase
            .from('journal_entry_attachments')
            .insert({
              journal_entry_id: journalEntryId,
              file_name: file.name,
              file_path: publicUrl,
              file_size: file.size,
              mime_type: file.type,
              tenant_id: tenantId,
              uploaded_by: session?.user?.id
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            toast({
              title: 'خطأ في الحفظ',
              description: `فشل في حفظ بيانات المرفق ${file.name}`,
              variant: 'destructive',
            });
            continue;
          }

          newAttachment.id = attachmentData.id;
        }

        newAttachments.push(newAttachment);
      }

      // Update attachments list
      onAttachmentsChange([...attachments, ...newAttachments]);

      toast({
        title: 'تم بنجاح',
        description: `تم رفع ${newAttachments.length} ملف بنجاح`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء رفع الملفات',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachment: JournalEntryAttachment) => {
    try {
      // Delete from database if journal entry exists
      if (journalEntryId && attachment.id) {
        const { error: dbError } = await supabase
          .from('journal_entry_attachments')
          .delete()
          .eq('id', attachment.id);

        if (dbError) {
          console.error('Database delete error:', dbError);
          toast({
            title: 'خطأ',
            description: 'فشل في حذف المرفق من قاعدة البيانات',
            variant: 'destructive',
          });
          return;
        }
      }

      // Remove from attachments list
      const updatedAttachments = attachments.filter(att => att.id !== attachment.id);
      onAttachmentsChange(updatedAttachments);

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المرفق بنجاح',
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المرفق',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAttachment = (attachment: JournalEntryAttachment) => {
    window.open(attachment.file_path, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {!disabled && (
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              انقر لاختيار الملفات أو اسحبها هنا
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'جاري الرفع...' : 'اختيار الملفات'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              الحد الأقصى: 10 ميجابايت للملف الواحد
            </p>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">المرفقات ({attachments.length})</Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-lg">{getFileIcon(attachment.mime_type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={attachment.file_name}>
                          {attachment.file_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(attachment.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(attachment.uploaded_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadAttachment(attachment)}
                        title="تحميل"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {attachments.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          لا توجد مرفقات
        </div>
      )}
    </div>
  );
};