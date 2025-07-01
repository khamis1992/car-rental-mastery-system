import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ContractData {
  contract_number: string;
  customers: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    national_id?: string;
  };
  vehicles: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_number: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  insurance_amount?: number;
  security_deposit?: number;
  final_amount: number;
  pickup_location?: string;
  return_location?: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  customer_signature?: string;
  company_signature?: string;
  created_at: string;
}

interface ContractPrintTemplateProps {
  contract: ContractData;
}

export const ContractPrintTemplate: React.FC<ContractPrintTemplateProps> = ({ contract }) => {
  return (
    <div className="print-template bg-white text-black p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-bold text-primary mb-2">شركة تأجير السيارات</h1>
        <p className="text-lg text-muted-foreground">عقد إيجار سيارة</p>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>الكويت - شارع الخليج العربي - صندوق بريد: 12345</p>
          <p>هاتف: +965 1234 5678 | البريد الإلكتروني: info@carental.com</p>
        </div>
      </div>

      {/* Contract Number and Date */}
      <div className="flex justify-between items-center mb-6 bg-muted/50 p-4 rounded-lg">
        <div>
          <h3 className="font-bold text-lg">رقم العقد: {contract.contract_number}</h3>
        </div>
        <div className="text-left">
          <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
          <p className="font-medium">{format(new Date(contract.created_at), 'PPP', { locale: ar })}</p>
        </div>
      </div>

      {/* Parties Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer Information */}
        <div className="border border-border rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4 text-primary">بيانات المستأجر</h3>
          <div className="space-y-3">
            <div>
              <label className="font-medium text-muted-foreground">الاسم:</label>
              <p className="font-medium">{contract.customers.name}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">رقم الهاتف:</label>
              <p className="font-medium">{contract.customers.phone}</p>
            </div>
            {contract.customers.email && (
              <div>
                <label className="font-medium text-muted-foreground">البريد الإلكتروني:</label>
                <p className="font-medium">{contract.customers.email}</p>
              </div>
            )}
            {contract.customers.national_id && (
              <div>
                <label className="font-medium text-muted-foreground">رقم الهوية:</label>
                <p className="font-medium">{contract.customers.national_id}</p>
              </div>
            )}
            {contract.customers.address && (
              <div>
                <label className="font-medium text-muted-foreground">العنوان:</label>
                <p className="font-medium">{contract.customers.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="border border-border rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4 text-primary">بيانات المركبة</h3>
          <div className="space-y-3">
            <div>
              <label className="font-medium text-muted-foreground">النوع والموديل:</label>
              <p className="font-medium">{contract.vehicles.make} {contract.vehicles.model}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">السنة:</label>
              <p className="font-medium">{contract.vehicles.year}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">رقم اللوحة:</label>
              <p className="font-medium">{contract.vehicles.license_plate}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">رقم المركبة:</label>
              <p className="font-medium">{contract.vehicles.vehicle_number}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">اللون:</label>
              <p className="font-medium">{contract.vehicles.color}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Details */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-primary">تفاصيل الإيجار</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="font-medium text-muted-foreground">تاريخ البداية:</label>
            <p className="font-medium">{format(new Date(contract.start_date), 'PPP', { locale: ar })}</p>
          </div>
          <div>
            <label className="font-medium text-muted-foreground">تاريخ النهاية:</label>
            <p className="font-medium">{format(new Date(contract.end_date), 'PPP', { locale: ar })}</p>
          </div>
          <div>
            <label className="font-medium text-muted-foreground">عدد الأيام:</label>
            <p className="font-medium">{contract.rental_days} يوم</p>
          </div>
        </div>
        
        {(contract.pickup_location || contract.return_location) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
            {contract.pickup_location && (
              <div>
                <label className="font-medium text-muted-foreground">مكان التسليم:</label>
                <p className="font-medium">{contract.pickup_location}</p>
              </div>
            )}
            {contract.return_location && (
              <div>
                <label className="font-medium text-muted-foreground">مكان الاستلام:</label>
                <p className="font-medium">{contract.return_location}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Details */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-primary">التفاصيل المالية</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">السعر اليومي:</span>
            <span className="font-bold">{contract.daily_rate.toFixed(3)} د.ك</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">المبلغ الإجمالي:</span>
            <span className="font-bold">{contract.total_amount.toFixed(3)} د.ك</span>
          </div>
          {contract.discount_amount > 0 && (
            <div className="flex justify-between text-success">
              <span className="font-medium">الخصم:</span>
              <span className="font-bold">-{contract.discount_amount.toFixed(3)} د.ك</span>
            </div>
          )}
          {contract.tax_amount > 0 && (
            <div className="flex justify-between">
              <span className="font-medium">الضريبة:</span>
              <span className="font-bold">{contract.tax_amount.toFixed(3)} د.ك</span>
            </div>
          )}
          {contract.insurance_amount > 0 && (
            <div className="flex justify-between">
              <span className="font-medium">التأمين:</span>
              <span className="font-bold">{contract.insurance_amount.toFixed(3)} د.ك</span>
            </div>
          )}
          {contract.security_deposit > 0 && (
            <div className="flex justify-between text-warning">
              <span className="font-medium">التأمين المسترد:</span>
              <span className="font-bold">{contract.security_deposit.toFixed(3)} د.ك</span>
            </div>
          )}
          <hr className="border-border" />
          <div className="flex justify-between text-lg font-bold text-primary">
            <span>المبلغ النهائي:</span>
            <span>{contract.final_amount.toFixed(3)} د.ك</span>
          </div>
        </div>
      </div>

      {/* Special Conditions */}
      {contract.special_conditions && (
        <div className="border border-border rounded-lg p-6 mb-8">
          <h3 className="font-bold text-lg mb-4 text-primary">الشروط الخاصة</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{contract.special_conditions}</p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 text-primary">الشروط والأحكام</h3>
        <div className="text-sm leading-relaxed space-y-2">
          {contract.terms_and_conditions ? (
            <p className="whitespace-pre-wrap">{contract.terms_and_conditions}</p>
          ) : (
            <>
              <p>1. يلتزم المستأجر بإرجاع المركبة في نفس حالتها التي استلمها بها.</p>
              <p>2. يتحمل المستأجر كامل المسؤولية عن أي أضرار تلحق بالمركبة أثناء فترة الإيجار.</p>
              <p>3. في حالة التأخير في إرجاع المركبة، يحق للشركة احتساب رسوم إضافية.</p>
              <p>4. يجب على المستأجر إبلاغ الشركة فوراً في حالة حدوث أي حادث أو عطل.</p>
              <p>5. لا يحق للمستأجر تأجير المركبة من الباطن أو السماح لشخص آخر بقيادتها دون موافقة مسبقة.</p>
              <p>6. جميع المخالفات المرورية التي تحدث أثناء فترة الإيجار تقع على عاتق المستأجر.</p>
            </>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="text-center">
          <div className="border-2 border-dashed border-border h-24 mb-4 flex items-center justify-center">
            {contract.customer_signature ? (
              <img src={contract.customer_signature} alt="توقيع العميل" className="max-h-20" />
            ) : (
              <span className="text-muted-foreground">توقيع المستأجر</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="border-b border-border pb-1">
              <span className="font-medium">اسم المستأجر: {contract.customers.name}</span>
            </div>
            <div className="border-b border-border pb-1">
              <span className="text-sm text-muted-foreground">التاريخ: ________________</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="border-2 border-dashed border-border h-24 mb-4 flex items-center justify-center">
            {contract.company_signature ? (
              <img src={contract.company_signature} alt="توقيع الشركة" className="max-h-20" />
            ) : (
              <span className="text-muted-foreground">توقيع الشركة</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="border-b border-border pb-1">
              <span className="font-medium">اسم الموظف: ________________</span>
            </div>
            <div className="border-b border-border pb-1">
              <span className="text-sm text-muted-foreground">التاريخ: ________________</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
        <p>هذا العقد محرر من نسختين، يحتفظ كل طرف بنسخة أصلية</p>
        <p className="mt-2">تم إنشاء هذا العقد إلكترونياً في {format(new Date(), 'PPP', { locale: ar })}</p>
      </div>

      <style>{`
        @media print {
          .print-template {
            margin: 0 !important;
            box-shadow: none !important;
            font-size: 12px !important;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};