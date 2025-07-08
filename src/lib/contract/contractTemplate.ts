import { ContractPDFData } from '@/types/contract';

export interface PDFOptions {
  includePhotos?: boolean;
  includeComparison?: boolean;
  photoQuality?: 'low' | 'medium' | 'high';
  maxPhotosPerSection?: number;
}

export const generateContractHTML = (contract: ContractPDFData, options: PDFOptions = {}): string => {
  const {
    includePhotos = false,
    includeComparison = false,
    photoQuality = 'medium',
    maxPhotosPerSection = 6
  } = options;
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Cairo', 'Amiri', 'Times New Roman', serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background: white;
          color: #1a1a1a;
          font-size: 14px;
        }
        
        .contract-container {
          max-width: 190mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .contract-header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
        }
        
        .contract-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
        }
        
        .company-logo {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .contract-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #fbbf24;
        }
        
        .company-details {
          font-size: 12px;
          opacity: 0.9;
          line-height: 1.4;
        }
        
        .contract-content {
          padding: 30px;
        }
        
        .contract-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-right: 4px solid #1e40af;
          margin-bottom: 30px;
        }
        
        .legal-preamble {
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
          font-style: italic;
        }
        
        .section {
          margin-bottom: 25px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .section-header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          padding: 12px 20px;
          font-weight: 600;
          font-size: 16px;
        }
        
        .section-content {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 20px;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .three-column {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
        }
        
        .field {
          margin-bottom: 12px;
        }
        
        .field-label {
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          margin-bottom: 4px;
          display: block;
        }
        
        .field-value {
          font-weight: 500;
          color: #1a1a1a;
          font-size: 14px;
          padding: 2px 0;
          border-bottom: 1px dotted #cbd5e1;
        }
        
        .financial-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .financial-total {
          background: #1e40af;
          color: white;
          padding: 12px;
          border-radius: 6px;
          font-size: 18px;
          font-weight: 700;
          margin-top: 10px;
        }
        
        .terms-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .terms-list li {
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
          padding-right: 20px;
        }
        
        .terms-list li::before {
          content: '•';
          color: #1e40af;
          font-weight: 700;
          position: absolute;
          right: 0;
        }
        
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
        }
        
        .signature-box {
          text-align: center;
          border: 2px dashed #cbd5e1;
          padding: 20px;
          border-radius: 8px;
          background: #fafafa;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .signature-image {
          max-height: 80px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .signature-details {
          margin-top: 15px;
          font-size: 12px;
        }
        
        .signature-line {
          border-bottom: 1px solid #475569;
          padding-bottom: 3px;
          margin-bottom: 8px;
          min-width: 150px;
        }
        
        .contract-footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        
        .legal-clause {
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          padding: 15px;
          margin: 10px 0;
          font-size: 13px;
        }
        
        .highlight {
          background: #fef3c7;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }
        
        @media print {
          body { margin: 0; padding: 0; }
          .contract-container { box-shadow: none; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="contract-container">
        <!-- Header -->
        <div class="contract-header">
          <div class="company-logo">شركة تأجير السيارات المتقدمة</div>
          <div class="contract-title">عقد إيجار مركبة</div>
          <div class="company-details">
            دولة الكويت - شارع الخليج العربي - مجمع الأعمال التجاري<br>
            صندوق بريد: 12345 - الرمز البريدي: 13000<br>
            هاتف: +965 1234 5678 | فاكس: +965 1234 5679<br>
            البريد الإلكتروني: info@carental.com | الموقع: www.carental.com<br>
            رقم التسجيل التجاري: 123456789 | الرقم الضريبي: 987654321
          </div>
        </div>

        <div class="contract-content">
          <!-- Contract Meta Information -->
          <div class="contract-meta">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #1e40af;">رقم العقد: ${contract.contract_number}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Contract Number</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 12px; color: #64748b;">تاريخ الإصدار</div>
              <div style="font-weight: 600; margin-top: 4px;">${new Date(contract.created_at).toLocaleDateString('ar-SA')}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${new Date(contract.created_at).toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <!-- Legal Preamble -->
          <div class="legal-preamble">
            <strong>ديباجة العقد:</strong><br>
            تم إبرام هذا العقد بين الطرفين المذكورين أدناه، وذلك وفقاً لأحكام القانون المدني الكويتي وقانون المرور والسير، 
            حيث اتفق الطرفان على الشروط والأحكام الواردة في هذا العقد، والتي تعتبر ملزمة لكلا الطرفين.
          </div>

          <!-- Parties Information -->
          <div class="section">
            <div class="section-header">الطرف الأول (المؤجر)</div>
            <div class="section-content">
              <div class="two-column">
                <div class="field">
                  <span class="field-label">اسم الشركة:</span>
                  <div class="field-value">شركة تأجير السيارات المتقدمة</div>
                </div>
                <div class="field">
                  <span class="field-label">رقم التسجيل التجاري:</span>
                  <div class="field-value">123456789</div>
                </div>
                <div class="field">
                  <span class="field-label">عنوان الشركة:</span>
                  <div class="field-value">دولة الكويت - شارع الخليج العربي - مجمع الأعمال التجاري</div>
                </div>
                <div class="field">
                  <span class="field-label">هاتف الشركة:</span>
                  <div class="field-value">+965 1234 5678</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">الطرف الثاني (المستأجر)</div>
            <div class="section-content">
              <div class="two-column">
                <div class="field">
                  <span class="field-label">الاسم الكامل:</span>
                  <div class="field-value">${contract.customers.name}</div>
                </div>
                <div class="field">
                  <span class="field-label">رقم الهاتف:</span>
                  <div class="field-value">${contract.customers.phone}</div>
                </div>
                ${contract.customers.email ? `
                <div class="field">
                  <span class="field-label">البريد الإلكتروني:</span>
                  <div class="field-value">${contract.customers.email}</div>
                </div>` : ''}
                ${contract.customers.national_id ? `
                <div class="field">
                  <span class="field-label">رقم الهوية المدنية:</span>
                  <div class="field-value">${contract.customers.national_id}</div>
                </div>` : ''}
                ${contract.customers.address ? `
                <div class="field">
                  <span class="field-label">العنوان:</span>
                  <div class="field-value">${contract.customers.address}</div>
                </div>` : ''}
              </div>
            </div>
          </div>

          <!-- Vehicle Information -->
          <div class="section">
            <div class="section-header">بيانات المركبة محل الإيجار</div>
            <div class="section-content">
              <div class="three-column">
                <div class="field">
                  <span class="field-label">ماركة المركبة:</span>
                  <div class="field-value">${contract.vehicles.make}</div>
                </div>
                <div class="field">
                  <span class="field-label">موديل المركبة:</span>
                  <div class="field-value">${contract.vehicles.model}</div>
                </div>
                <div class="field">
                  <span class="field-label">سنة الصنع:</span>
                  <div class="field-value">${contract.vehicles.year}</div>
                </div>
                <div class="field">
                  <span class="field-label">رقم اللوحة:</span>
                  <div class="field-value highlight">${contract.vehicles.license_plate}</div>
                </div>
                <div class="field">
                  <span class="field-label">رقم المركبة:</span>
                  <div class="field-value">${contract.vehicles.vehicle_number}</div>
                </div>
                <div class="field">
                  <span class="field-label">لون المركبة:</span>
                  <div class="field-value">${contract.vehicles.color || 'غير محدد'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rental Terms -->
          <div class="section">
            <div class="section-header">تفاصيل وشروط الإيجار</div>
            <div class="section-content">
              <div class="three-column">
                <div class="field">
                  <span class="field-label">تاريخ بداية الإيجار:</span>
                  <div class="field-value highlight">${new Date(contract.start_date).toLocaleDateString('ar-SA')}</div>
                </div>
                <div class="field">
                  <span class="field-label">تاريخ انتهاء الإيجار:</span>
                  <div class="field-value highlight">${new Date(contract.end_date).toLocaleDateString('ar-SA')}</div>
                </div>
                <div class="field">
                  <span class="field-label">مدة الإيجار:</span>
                  <div class="field-value">${contract.rental_days} يوم</div>
                </div>
                ${contract.pickup_location ? `
                <div class="field">
                  <span class="field-label">مكان التسليم:</span>
                  <div class="field-value">${contract.pickup_location}</div>
                </div>` : ''}
                ${contract.return_location ? `
                <div class="field">
                  <span class="field-label">مكان الإرجاع:</span>
                  <div class="field-value">${contract.return_location}</div>
                </div>` : ''}
              </div>
            </div>
          </div>

          <!-- Financial Details -->
          <div class="section">
            <div class="section-header">التفاصيل المالية والمحاسبية</div>
            <div class="section-content">
              <div class="financial-row">
                <span>السعر اليومي للإيجار:</span>
                <span>${contract.daily_rate.toFixed(3)} د.ك</span>
              </div>
              <div class="financial-row">
                <span>إجمالي أيام الإيجار:</span>
                <span>${contract.rental_days} يوم</span>
              </div>
              <div class="financial-row">
                <span>المبلغ الأساسي (${contract.rental_days} × ${contract.daily_rate.toFixed(3)}):</span>
                <span>${contract.total_amount.toFixed(3)} د.ك</span>
              </div>
              ${contract.discount_amount && contract.discount_amount > 0 ? `
              <div class="financial-row" style="color: #059669;">
                <span>الخصم المطبق:</span>
                <span>- ${contract.discount_amount.toFixed(3)} د.ك</span>
              </div>` : ''}
              ${contract.tax_amount && contract.tax_amount > 0 ? `
              <div class="financial-row">
                <span>الضريبة المضافة:</span>
                <span>${contract.tax_amount.toFixed(3)} د.ك</span>
              </div>` : ''}
              ${contract.insurance_amount && contract.insurance_amount > 0 ? `
              <div class="financial-row">
                <span>رسوم التأمين الإضافي:</span>
                <span>${contract.insurance_amount.toFixed(3)} د.ك</span>
              </div>` : ''}
              ${contract.security_deposit && contract.security_deposit > 0 ? `
              <div class="financial-row">
                <span>مبلغ التأمين القابل للاسترداد:</span>
                <span>${contract.security_deposit.toFixed(3)} د.ك</span>
              </div>` : ''}
              <div class="financial-total">
                <div style="display: flex; justify-content: space-between;">
                  <span>المبلغ الإجمالي المستحق:</span>
                  <span>${contract.final_amount.toFixed(3)} د.ك</span>
                </div>
                <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                  (${contract.final_amount.toFixed(3)} دينار كويتي)
                </div>
              </div>
            </div>
          </div>

          <!-- Legal Terms and Conditions -->
          <div class="section">
            <div class="section-header">الشروط والأحكام القانونية</div>
            <div class="section-content">
              <ul class="terms-list">
                <li><strong>التزامات المستأجر:</strong> يلتزم المستأجر بإرجاع المركبة في نفس حالتها التي استلمها بها، مع عدم تعديل أو تغيير أي من مكونات المركبة دون موافقة خطية مسبقة من المؤجر.</li>
                
                <li><strong>المسؤولية والتأمين:</strong> يتحمل المستأجر كامل المسؤولية المدنية والجنائية عن أي حوادث أو أضرار أو مخالفات مرورية تقع أثناء فترة الإيجار، ويكون مسؤولاً عن دفع كافة الغرامات والتعويضات.</li>
                
                <li><strong>الاستخدام المسموح:</strong> تستخدم المركبة لأغراض شخصية فقط وداخل حدود دولة الكويت، ولا يجوز استخدامها لأغراض تجارية أو نقل البضائع أو في أنشطة غير قانونية.</li>
                
                <li><strong>الصيانة والإصلاحات:</strong> في حالة تعطل المركبة لأسباب ميكانيكية عادية، يتحمل المؤجر تكاليف الإصلاح. أما في حالة الضرر الناتج عن سوء الاستخدام، فيتحمل المستأجر كامل التكاليف.</li>
                
                <li><strong>التأخير في الإرجاع:</strong> في حالة التأخير في إرجاع المركبة عن الموعد المحدد، يحق للمؤجر احتساب رسوم إضافية بقيمة 150% من السعر اليومي عن كل يوم تأخير.</li>
                
                <li><strong>الإلغاء والاسترداد:</strong> يحق للمستأجر إلغاء العقد قبل 24 ساعة من موعد التسليم مع استرداد 90% من المبلغ المدفوع. بعد ذلك لا يحق استرداد أي مبالغ.</li>
                
                <li><strong>حالات فسخ العقد:</strong> يحق للمؤجر فسخ العقد فوراً في حالة استخدام المركبة لأغراض غير قانونية، أو تأجيرها لطرف ثالث، أو في حالة عدم دفع المستحقات.</li>
                
                <li><strong>الوقود والنظافة:</strong> يتحمل المستأجر تكاليف الوقود أثناء فترة الإيجار، ويلتزم بإرجاع المركبة نظيفة وبنفس مستوى الوقود عند التسليم.</li>
                
                <li><strong>القانون الواجب التطبيق:</strong> يخضع هذا العقد لأحكام القانون الكويتي، وتختص المحاكم الكويتية بالنظر في أي نزاعات تنشأ عن تطبيق هذا العقد.</li>
                
                <li><strong>التبليغات:</strong> تعتبر العناوين المذكورة في هذا العقد هي العناوين المعتمدة للتبليغ، ويقع على عاتق كل طرف إخطار الطرف الآخر بأي تغيير في عنوانه.</li>
              </ul>
              
              ${contract.special_conditions ? `
              <div class="legal-clause">
                <strong>شروط خاصة إضافية:</strong><br>
                ${contract.special_conditions}
              </div>` : ''}
              
              ${contract.terms_and_conditions ? `
              <div class="legal-clause">
                <strong>شروط إضافية متفق عليها:</strong><br>
                ${contract.terms_and_conditions.split('\n').map(term => `• ${term}`).join('<br>')}
              </div>` : ''}
            </div>
          </div>

          <!-- Vehicle Condition Section -->
          ${includePhotos || includeComparison ? generateVehicleConditionSection(contract, options) : ''}

          <!-- Declaration Section -->
          <div class="section">
            <div class="section-header">إقرار وموافقة الطرفين</div>
            <div class="section-content">
              <div class="legal-clause">
                <p><strong>يقر الطرف الأول (المؤجر) بما يلي:</strong></p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                  <li>أن المركبة المؤجرة صالحة للسير ومرخصة حسب الأصول القانونية</li>
                  <li>أن جميع أوراق المركبة وتأمينها سارية المفعول</li>
                  <li>أن المعلومات المتعلقة بالمركبة صحيحة ومطابقة للواقع</li>
                </ul>
              </div>
              
              <div class="legal-clause">
                <p><strong>يقر الطرف الثاني (المستأجر) بما يلي:</strong></p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                  <li>أنه قد قرأ جميع شروط هذا العقد وفهمها ووافق عليها</li>
                  <li>أنه يحمل رخصة قيادة سارية المفعول وصالحة لقيادة المركبة المؤجرة</li>
                  <li>أنه قد فحص المركبة وتأكد من حالتها العامة قبل استلامها</li>
                  <li>أنه سيلتزم بجميع قوانين المرور والسير المعمول بها في دولة الكويت</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Signatures Section -->
          <div class="signatures">
            <div class="signature-box">
              ${contract.customer_signature ? 
                `<img src="${contract.customer_signature}" alt="توقيع المستأجر" class="signature-image">` :
                '<div style="color: #9ca3af; font-style: italic;">توقيع المستأجر</div>'
              }
              <div class="signature-details">
                <div class="signature-line">الاسم: ${contract.customers.name}</div>
                <div class="signature-line">التاريخ: ${contract.customer_signed_at ? new Date(contract.customer_signed_at).toLocaleDateString('ar-SA') : '_______________'}</div>
                <div class="signature-line">الوقت: ${contract.customer_signed_at ? new Date(contract.customer_signed_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}) : '_______________'}</div>
              </div>
            </div>

            <div class="signature-box">
              ${contract.company_signature ? 
                `<img src="${contract.company_signature}" alt="توقيع الشركة" class="signature-image">` :
                '<div style="color: #9ca3af; font-style: italic;">توقيع المؤجر</div>'
              }
              <div class="signature-details">
                <div class="signature-line">اسم الموظف: _______________________</div>
                <div class="signature-line">المنصب: مدير العقود</div>
                <div class="signature-line">التاريخ: ${contract.company_signed_at ? new Date(contract.company_signed_at).toLocaleDateString('ar-SA') : '_______________'}</div>
                <div class="signature-line">الوقت: ${contract.company_signed_at ? new Date(contract.company_signed_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}) : '_______________'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contract Footer -->
        <div class="contract-footer">
          <div style="margin-bottom: 15px;">
            <strong>بيانات قانونية مهمة:</strong><br>
            • هذا العقد محرر من نسختين أصليتين، يحتفظ كل طرف بنسخة منه<br>
            • يعتبر هذا العقد نافذاً من تاريخ توقيعه من قبل الطرفين<br>
            • أي تعديل على هذا العقد يجب أن يكون خطياً وموقعاً من الطرفين
          </div>
          <hr style="margin: 15px 0; border: 0; border-top: 1px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
            <div>تم إنشاء هذا العقد إلكترونياً بتاريخ: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</div>
            <div>رقم العقد: ${contract.contract_number}</div>
          </div>
          <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
            نظام إدارة عقود تأجير المركبات | الإصدار 2.0 | جميع الحقوق محفوظة © 2024
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * إنشاء قسم حالة المركبة مع الصور والمقارنة
 */
const generateVehicleConditionSection = (contract: ContractPDFData, options: PDFOptions): string => {
  const { includeComparison, maxPhotosPerSection = 6, photoQuality = 'medium' } = options;
  
  const pickupPhotos = contract.pickup_photos?.slice(0, maxPhotosPerSection) || [];
  const returnPhotos = contract.return_photos?.slice(0, maxPhotosPerSection) || [];
  
  if (pickupPhotos.length === 0 && returnPhotos.length === 0) {
    return '';
  }

  // تحديد حجم الصور حسب الجودة
  const getImageStyle = () => {
    const sizes = {
      low: 'width: 60px; height: 45px;',
      medium: 'width: 80px; height: 60px;',
      high: 'width: 100px; height: 75px;'
    };
    return sizes[photoQuality];
  };

  const imageStyle = getImageStyle();

  return `
    <!-- Vehicle Condition Section -->
    <div class="section">
      <div class="section-header">حالة المركبة ووثائق التسليم والإرجاع</div>
      <div class="section-content">
        ${includeComparison && pickupPhotos.length > 0 && returnPhotos.length > 0 ? `
        <!-- Comparison View -->
        <div class="two-column">
          <!-- Pickup Condition -->
          <div style="border: 1px solid #10b981; border-radius: 6px; padding: 15px; background: #f0fdf4;">
            <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 10px; color: #059669; text-align: center;">
              📋 حالة المركبة عند التسليم
            </h4>
            ${contract.pickup_condition_notes ? `
            <div class="legal-clause" style="background: #ecfdf5; border-color: #10b981;">
              <strong>ملاحظات التسليم:</strong><br>
              ${contract.pickup_condition_notes}
            </div>` : ''}
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px;">
              ${pickupPhotos.map(photo => `
                <img src="${photo}" style="${imageStyle} object-fit: cover; border-radius: 6px; border: 2px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="صورة حالة التسليم" />
              `).join('')}
            </div>
          </div>

          <!-- Return Condition -->
          <div style="border: 1px solid #ef4444; border-radius: 6px; padding: 15px; background: #fef2f2;">
            <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 10px; color: #dc2626; text-align: center;">
              🔄 حالة المركبة عند الإرجاع
            </h4>
            ${contract.return_condition_notes ? `
            <div class="legal-clause" style="background: #fef2f2; border-color: #ef4444;">
              <strong>ملاحظات الإرجاع:</strong><br>
              ${contract.return_condition_notes}
            </div>` : ''}
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px;">
              ${returnPhotos.map(photo => `
                <img src="${photo}" style="${imageStyle} object-fit: cover; border-radius: 6px; border: 2px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="صورة حالة الإرجاع" />
              `).join('')}
            </div>
          </div>
        </div>
        ` : `
        <!-- Single Section View -->
        ${pickupPhotos.length > 0 ? `
        <div style="margin-bottom: 25px; border: 1px solid #10b981; border-radius: 6px; padding: 15px; background: #f0fdf4;">
          <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 15px; color: #059669; text-align: center;">
            📋 حالة المركبة عند التسليم
          </h4>
          ${contract.pickup_condition_notes ? `
          <div class="legal-clause" style="background: #ecfdf5; border-color: #10b981;">
            <strong>ملاحظات التسليم:</strong><br>
            ${contract.pickup_condition_notes}
          </div>` : ''}
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px;">
            ${pickupPhotos.map(photo => `
              <img src="${photo}" style="${imageStyle} object-fit: cover; border-radius: 6px; border: 2px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="صورة حالة التسليم" />
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${returnPhotos.length > 0 ? `
        <div style="border: 1px solid #ef4444; border-radius: 6px; padding: 15px; background: #fef2f2;">
          <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 15px; color: #dc2626; text-align: center;">
            🔄 حالة المركبة عند الإرجاع
          </h4>
          ${contract.return_condition_notes ? `
          <div class="legal-clause" style="background: #fef2f2; border-color: #ef4444;">
            <strong>ملاحظات الإرجاع:</strong><br>
            ${contract.return_condition_notes}
          </div>` : ''}
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px;">
            ${returnPhotos.map(photo => `
              <img src="${photo}" style="${imageStyle} object-fit: cover; border-radius: 6px; border: 2px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="صورة حالة الإرجاع" />
            `).join('')}
          </div>
        </div>
        ` : ''}
        `}
        
        <!-- Additional Vehicle Condition Information -->
        ${contract.pickup_damages && contract.pickup_damages.length > 0 ? `
        <div style="margin-top: 20px; background: #fefce8; border: 1px solid #eab308; border-radius: 6px; padding: 15px;">
          <h5 style="color: #a16207; font-weight: 600; margin-bottom: 10px;">⚠️ أضرار مسجلة عند التسليم:</h5>
          <ul style="margin: 0; padding-right: 20px; font-size: 12px;">
            ${contract.pickup_damages.map(damage => `
              <li style="margin-bottom: 5px;">${damage.description || 'ضرر غير محدد'} - ${damage.severity || 'خفيف'}</li>
            `).join('')}
          </ul>
        </div>` : ''}
        
        ${contract.return_damages && contract.return_damages.length > 0 ? `
        <div style="margin-top: 15px; background: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 15px;">
          <h5 style="color: #dc2626; font-weight: 600; margin-bottom: 10px;">🚨 أضرار مسجلة عند الإرجاع:</h5>
          <ul style="margin: 0; padding-right: 20px; font-size: 12px;">
            ${contract.return_damages.map(damage => `
              <li style="margin-bottom: 5px;">${damage.description || 'ضرر غير محدد'} - ${damage.severity || 'خفيف'}</li>
            `).join('')}
          </ul>
        </div>` : ''}
      </div>
    </div>
  `;
};