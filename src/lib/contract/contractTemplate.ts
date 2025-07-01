import { ContractPDFData } from '@/types/contract';

export const generateContractHTML = (contract: ContractPDFData): string => {
  return `
    <div style="max-width: 170mm; margin: 0 auto; background: white; color: black;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
        <h1 style="color: #1e40af; font-size: 28px; font-weight: bold; margin-bottom: 10px;">شركة تأجير السيارات</h1>
        <p style="font-size: 18px; color: #666; margin: 5px 0;">عقد إيجار سيارة</p>
        <div style="margin-top: 15px; font-size: 12px; color: #666;">
          <p>الكويت - شارع الخليج العربي - صندوق بريد: 12345</p>
          <p>هاتف: +965 1234 5678 | البريد الإلكتروني: info@carental.com</p>
        </div>
      </div>

      <!-- Contract Number and Date -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
        <div>
          <h3 style="font-weight: bold; font-size: 16px; margin: 0;">رقم العقد: ${contract.contract_number}</h3>
        </div>
        <div style="text-align: left;">
          <p style="font-size: 12px; color: #666; margin: 0;">تاريخ الإصدار</p>
          <p style="font-weight: 500; margin: 5px 0 0 0;">${new Date(contract.created_at).toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      <!-- Customer and Vehicle Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #1e40af;">بيانات المستأجر</h3>
          <div style="space-y: 10px;">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">الاسم:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.customers.name}</p>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">رقم الهاتف:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.customers.phone}</p>
            </div>
            ${contract.customers.email ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">البريد الإلكتروني:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.customers.email}</p>
            </div>` : ''}
            ${contract.customers.national_id ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">رقم الهوية:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.customers.national_id}</p>
            </div>` : ''}
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #1e40af;">بيانات المركبة</h3>
          <div style="space-y: 10px;">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">النوع والموديل:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.vehicles.make} ${contract.vehicles.model}</p>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">السنة:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.vehicles.year}</p>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">رقم اللوحة:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.vehicles.license_plate}</p>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #666; font-size: 12px;">رقم المركبة:</span>
              <p style="font-weight: 500; margin: 2px 0;">${contract.vehicles.vehicle_number}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rental Details -->
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #1e40af;">تفاصيل الإيجار</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div>
            <span style="font-weight: 500; color: #666; font-size: 12px;">تاريخ البداية:</span>
            <p style="font-weight: 500; margin: 2px 0;">${new Date(contract.start_date).toLocaleDateString('ar-SA')}</p>
          </div>
          <div>
            <span style="font-weight: 500; color: #666; font-size: 12px;">تاريخ النهاية:</span>
            <p style="font-weight: 500; margin: 2px 0;">${new Date(contract.end_date).toLocaleDateString('ar-SA')}</p>
          </div>
          <div>
            <span style="font-weight: 500; color: #666; font-size: 12px;">عدد الأيام:</span>
            <p style="font-weight: 500; margin: 2px 0;">${contract.rental_days} يوم</p>
          </div>
        </div>
      </div>

      <!-- Financial Details -->
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #1e40af;">التفاصيل المالية</h3>
        <div style="space-y: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: 500;">السعر اليومي:</span>
            <span style="font-weight: bold;">${contract.daily_rate.toFixed(3)} د.ك</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: 500;">المبلغ الإجمالي:</span>
            <span style="font-weight: bold;">${contract.total_amount.toFixed(3)} د.ك</span>
          </div>
          ${contract.discount_amount && contract.discount_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669;">
            <span style="font-weight: 500;">الخصم:</span>
            <span style="font-weight: bold;">-${contract.discount_amount.toFixed(3)} د.ك</span>
          </div>` : ''}
          ${contract.tax_amount && contract.tax_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: 500;">الضريبة:</span>
            <span style="font-weight: bold;">${contract.tax_amount.toFixed(3)} د.ك</span>
          </div>` : ''}
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #1e40af;">
            <span>المبلغ النهائي:</span>
            <span>${contract.final_amount.toFixed(3)} د.ك</span>
          </div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #1e40af;">الشروط والأحكام</h3>
        <div style="font-size: 12px; line-height: 1.6; space-y: 5px;">
          ${contract.terms_and_conditions ? 
            contract.terms_and_conditions.split('\n').map(term => `<p style="margin: 5px 0;">• ${term}</p>`).join('') :
            `<p style="margin: 5px 0;">• يلتزم المستأجر بإرجاع المركبة في نفس حالتها التي استلمها بها.</p>
             <p style="margin: 5px 0;">• يتحمل المستأجر كامل المسؤولية عن أي أضرار تلحق بالمركبة أثناء فترة الإيجار.</p>
             <p style="margin: 5px 0;">• في حالة التأخير في إرجاع المركبة، يحق للشركة احتساب رسوم إضافية.</p>`
          }
        </div>
      </div>

      <!-- Signatures -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px;">
        <div style="text-align: center;">
          <div style="border: 2px dashed #d1d5db; height: 80px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
            ${contract.customer_signature ? 
              `<img src="${contract.customer_signature}" alt="توقيع العميل" style="max-height: 70px; max-width: 100%;">` :
              '<span style="color: #9ca3af;">توقيع المستأجر</span>'
            }
          </div>
          <div style="space-y: 8px;">
            <div style="border-bottom: 1px solid #d1d5db; padding-bottom: 3px;">
              <span style="font-weight: 500;">اسم المستأجر: ${contract.customers.name}</span>
            </div>
            <div style="border-bottom: 1px solid #d1d5db; padding-bottom: 3px;">
              <span style="font-size: 12px; color: #666;">التاريخ: ${contract.customer_signed_at ? new Date(contract.customer_signed_at).toLocaleDateString('ar-SA') : '________________'}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center;">
          <div style="border: 2px dashed #d1d5db; height: 80px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
            ${contract.company_signature ? 
              `<img src="${contract.company_signature}" alt="توقيع الشركة" style="max-height: 70px; max-width: 100%;">` :
              '<span style="color: #9ca3af;">توقيع الشركة</span>'
            }
          </div>
          <div style="space-y: 8px;">
            <div style="border-bottom: 1px solid #d1d5db; padding-bottom: 3px;">
              <span style="font-weight: 500;">اسم الموظف: ________________</span>
            </div>
            <div style="border-bottom: 1px solid #d1d5db; padding-bottom: 3px;">
              <span style="font-size: 12px; color: #666;">التاريخ: ${contract.company_signed_at ? new Date(contract.company_signed_at).toLocaleDateString('ar-SA') : '________________'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">
        <p>هذا العقد محرر من نسختين، يحتفظ كل طرف بنسخة أصلية</p>
        <p style="margin-top: 8px;">تم إنشاء هذا العقد إلكترونياً في ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
    </div>
  `;
};