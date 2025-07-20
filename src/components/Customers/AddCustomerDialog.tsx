
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, User, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerDialogProps {
  trigger?: React.ReactNode;
}

const AddCustomerDialog = ({ trigger }: AddCustomerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically save to database
    console.log('إضافة عميل جديد:', formData);
    
    toast({
      title: "تم إضافة العميل بنجاح",
      description: `تم إضافة ${formData.name} إلى قائمة العملاء`,
    });
    
    // Reset form and close dialog
    setFormData({ name: '', email: '', phone: '', city: '' });
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="btn-primary rtl-flex">
            <Plus className="w-4 h-4" />
            عميل جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <User className="w-5 h-5" />
            إضافة عميل جديد
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="rtl-label">اسم العميل</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="أدخل اسم العميل الكامل"
              required
              className="text-right"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="rtl-label flex items-center gap-2 flex-row-reverse">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="example@email.com"
              required
              className="text-right"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="rtl-label flex items-center gap-2 flex-row-reverse">
              <Phone className="w-4 h-4" />
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+965 9999 8888"
              required
              className="text-right"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city" className="rtl-label flex items-center gap-2 flex-row-reverse">
              <MapPin className="w-4 h-4" />
              المدينة
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="الكويت"
              required
              className="text-right"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="btn-primary">
              إضافة العميل
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;
