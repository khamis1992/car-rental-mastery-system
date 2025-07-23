import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BankTransaction } from "@/types/accounting";

const transactionFormSchema = z.object({
  transaction_type: z.enum(["deposit", "withdrawal", "transfer", "fee", "interest"], {
    required_error: "يرجى اختيار نوع المعاملة",
  }),
  bank_account_id: z.string({
    required_error: "يرجى اختيار الحساب البنكي",
  }),
  transaction_date: z.date({
    required_error: "يرجى اختيار تاريخ المعاملة",
  }),
  amount: z.number().min(0.001, "المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().min(1, "الوصف مطلوب"),
  reference_number: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TreasuryTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  isLoading?: boolean;
}

// بيانات وهمية للحسابات البنكية
const bankAccounts = [
  {
    id: "1",
    name: "الحساب الجاري - البنك الأهلي",
    accountNumber: "123456789",
  },
  {
    id: "2", 
    name: "حساب التوفير - بنك الكويت الوطني",
    accountNumber: "987654321",
  },
  {
    id: "3",
    name: "صندوق الشركة الرئيسي",
    accountNumber: "CASH-001",
  }
];

const transactionTypes = [
  { value: "deposit", label: "إيداع" },
  { value: "withdrawal", label: "سحب" },
  { value: "transfer", label: "تحويل" },
  { value: "fee", label: "رسوم" },
  { value: "interest", label: "فائدة" },
];

export const TreasuryTransactionForm: React.FC<TreasuryTransactionFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const { toast } = useToast();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transaction_date: new Date(),
      amount: 0,
      description: "",
      reference_number: "",
    },
  });

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
      toast({
        title: "تم إنشاء المعاملة بنجاح",
        description: "تم إضافة المعاملة الجديدة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء المعاملة",
        description: "حدث خطأ أثناء إنشاء المعاملة",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="rtl-title">معاملة خزينة جديدة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* نوع المعاملة */}
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="rtl-label">نوع المعاملة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المعاملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* الحساب البنكي */}
              <FormField
                control={form.control}
                name="bank_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="rtl-label">الحساب البنكي</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحساب البنكي" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="rtl-flex flex-col items-start">
                              <span>{account.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {account.accountNumber}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* تاريخ المعاملة */}
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="rtl-label">تاريخ المعاملة</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-right font-normal rtl-flex",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 opacity-50 ml-auto" />
                            {field.value ? (
                              format(field.value, "yyyy/MM/dd")
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* المبلغ */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="rtl-label">المبلغ (د.ك)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* رقم المرجع */}
            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="rtl-label">رقم المرجع (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="رقم الشيك، رقم التحويل، الخ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* الوصف */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="rtl-label">وصف المعاملة</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصف تفصيلي للمعاملة"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : "حفظ المعاملة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};