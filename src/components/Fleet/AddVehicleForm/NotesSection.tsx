import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { type VehicleFormData } from './types';

interface NotesSectionProps {
  control: Control<VehicleFormData>;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ control }) => {
  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        ملاحظات إضافية
      </h3>
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder="أي ملاحظات إضافية حول المركبة..." 
                className="min-h-[120px] bg-background/60 border-border/60 resize-none"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};