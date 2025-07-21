import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Supplier, SupplierFormData } from "@/integrations/supabase/types/suppliers";
import { SupplierService } from "@/services/supplierService";
import { useToast } from "@/hooks/use-toast";

const supplierSchema = z.object({
  name: z.string().min(1, "اسم المورد مطلوب"),
  name_en: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  tax_number: z.string().optional(),
  commercial_register: z.string().optional(),
  supplier_type: z.enum(["individual", "company", "government"]),
  payment_terms: z.number().optional(),
  credit_limit: z.number().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  iban: z.string().optional(),
  swift_code: z.string().optional(),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

interface SupplierFormProps {
  supplier?: Supplier | null;
  onClose: () => void;
  onSave: () => void;
}

export function SupplierForm({ supplier, onClose, onSave }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      name_en: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "الكويت",
      postal_code: "",
      tax_number: "",
      commercial_register: "",
      supplier_type: "company",
      payment_terms: 30,
      credit_limit: 0,
      bank_name: "",
      bank_account: "",
      iban: "",
      swift_code: "",
      is_active: true,
      notes: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        name_en: supplier.name_en || "",
        contact_person: supplier.contact_person || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        country: supplier.country || "الكويت",
        postal_code: supplier.postal_code || "",
        tax_number: supplier.tax_number || "",
        commercial_register: supplier.commercial_register || "",
        supplier_type: supplier.supplier_type,
        payment_terms: supplier.payment_terms || 30,
        credit_limit: supplier.credit_limit || 0,
        bank_name: supplier.bank_name || "",
        bank_account: supplier.bank_account || "",
        iban: supplier.iban || "",
        swift_code: supplier.swift_code || "",
        is_active: supplier.is_active,
        notes: supplier.notes || "",
      });
    }
  }, [supplier, form]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setLoading(true);
      
      if (supplier) {
        await SupplierService.updateSupplier(supplier.id, data);
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات المورد بنجاح",
        });
      } else {
        await SupplierService.createSupplier(data);
        toast({
          title: "تم الإنشاء بنجاح",
          description: "تم إنشاء المورد الجديد بنجاح",
        });
      }
      
      onSave();
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
          </DialogTitle>
          <DialogDescription>
            {supplier 
              ? "قم بتعديل بيانات المورد في النموذج أدناه"
              : "أدخل بيانات المورد الجديد في النموذج أدناه"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                <TabsTrigger value="financial">البيانات المالية</TabsTrigger>
                <TabsTrigger value="banking">البيانات المصرفية</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المورد *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="أدخل اسم المورد" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم بالإنجليزية</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter supplier name in English" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplier_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع المورد *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نوع المورد" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="individual">فرد</SelectItem>
                                <SelectItem value="company">شركة</SelectItem>
                                <SelectItem value="government">جهة حكومية</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الشخص المسؤول</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم الشخص المسؤول" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="example@email.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="رقم الهاتف" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="المدينة" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدولة</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="الدولة" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرمز البريدي</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="الرمز البريدي" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان التفصيلي</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="العنوان التفصيلي" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tax_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرقم الضريبي</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="الرقم الضريبي" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commercial_register"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السجل التجاري</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="رقم السجل التجاري" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">حالة المورد</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              تفعيل أو إلغاء تفعيل المورد
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات المالية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="payment_terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شروط الدفع (بالأيام)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="30"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="credit_limit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحد الائتماني (د.ك)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.001"
                                placeholder="0.000"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="banking" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>البيانات المصرفية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم البنك</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم البنك" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bank_account"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الحساب</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="رقم الحساب المصرفي" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الآيبان (IBAN)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="KW74NBOK0000000000001000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="swift_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رمز السويفت (SWIFT)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="NBOKKOWT" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="ملاحظات إضافية عن المورد" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : supplier ? "تحديث" : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}