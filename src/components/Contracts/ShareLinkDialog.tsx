import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, Phone, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicUrl: string;
  quotationNumber: string;
  customerName: string;
}

export const ShareLinkDialog: React.FC<ShareLinkDialogProps> = ({
  open,
  onOpenChange,
  publicUrl,
  quotationNumber,
  customerName,
}) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState(
    `مرحباً ${customerName}،\n\nيرجى مراجعة عرض السعر رقم ${quotationNumber} عبر الرابط التالي:\n${publicUrl}\n\nشكراً لك.`
  );
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط عرض السعر للحافظة',
      });
    } catch (error) {
      toast({
        title: 'خطأ في النسخ',
        description: 'فشل في نسخ الرابط للحافظة',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    if (!email) {
      toast({
        title: 'البريد الإلكتروني مطلوب',
        description: 'يرجى إدخال البريد الإلكتروني',
        variant: 'destructive',
      });
      return;
    }

    const subject = encodeURIComponent(`عرض السعر رقم ${quotationNumber}`);
    const body = encodeURIComponent(customMessage);
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_blank');
    toast({
      title: 'تم فتح تطبيق البريد الإلكتروني',
      description: 'يرجى إرسال الرسالة من تطبيق البريد الإلكتروني',
    });
  };

  const shareViaWhatsApp = () => {
    if (!phoneNumber) {
      toast({
        title: 'رقم الهاتف مطلوب',
        description: 'يرجى إدخال رقم الهاتف',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    toast({
      title: 'تم فتح واتساب',
      description: 'يرجى إرسال الرسالة من تطبيق واتساب',
    });
  };

  const shareViaSMS = () => {
    if (!phoneNumber) {
      toast({
        title: 'رقم الهاتف مطلوب',
        description: 'يرجى إدخال رقم الهاتف',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(customMessage);
    const smsUrl = `sms:${phoneNumber}?body=${message}`;
    
    window.open(smsUrl, '_blank');
    toast({
      title: 'تم فتح تطبيق الرسائل',
      description: 'يرجى إرسال الرسالة من تطبيق الرسائل',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            مشاركة عرض السعر رقم {quotationNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* رابط العرض */}
          <div className="space-y-2">
            <Label>رابط عرض السعر</Label>
            <div className="flex gap-2">
              <Input 
                value={publicUrl} 
                readOnly 
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                نسخ
              </Button>
            </div>
          </div>

          {/* الرسالة المخصصة */}
          <div className="space-y-2">
            <Label>نص الرسالة</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* معلومات الاتصال */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+965 12345678"
              />
            </div>
          </div>

          {/* أزرار المشاركة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={shareViaEmail}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Mail className="w-4 h-4" />
              إرسال بالبريد الإلكتروني
            </Button>
            
            <Button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-2"
              variant="outline"
            >
              <MessageCircle className="w-4 h-4" />
              إرسال بواتساب
            </Button>
            
            <Button
              onClick={shareViaSMS}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Phone className="w-4 h-4" />
              إرسال برسالة نصية
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};