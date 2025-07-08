import { supabase } from '@/integrations/supabase/client';
import { ContractPDFData } from '@/types/contract';
import { generateContractHTML } from './contract/contractTemplate';

export interface ContractPrintOptions {
  includePhotos?: boolean;
  photoQuality?: 'low' | 'medium' | 'high';
  maxPhotosPerSection?: number;
}

/**
 * خدمة طباعة العقود باستخدام HTML مباشرة
 */
export class ContractHTMLPrintService {
  /**
   * جلب بيانات العقد للطباعة
   */
  private static async fetchContractData(contractId: string): Promise<ContractPDFData> {
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        customers (
          name,
          phone,
          email,
          address,
          national_id
        ),
        vehicles (
          make,
          model,
          year,
          license_plate,
          vehicle_number,
          color
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('فشل في جلب بيانات العقد');
    }

    // تحويل البيانات إلى النسق المطلوب
    const contractData: ContractPDFData = {
      contract_number: contract.contract_number,
      customers: {
        name: contract.customers?.name || 'غير محدد',
        phone: contract.customers?.phone || '',
        email: contract.customers?.email || '',
        address: contract.customers?.address || '',
        national_id: contract.customers?.national_id || '',
      },
      vehicles: {
        make: contract.vehicles?.make || '',
        model: contract.vehicles?.model || '',
        year: contract.vehicles?.year || new Date().getFullYear(),
        license_plate: contract.vehicles?.license_plate || '',
        vehicle_number: contract.vehicles?.vehicle_number || '',
        color: contract.vehicles?.color || '',
      },
      start_date: contract.start_date,
      end_date: contract.end_date,
      rental_days: contract.rental_days || 1,
      daily_rate: contract.daily_rate || 0,
      total_amount: contract.total_amount || 0,
      discount_amount: contract.discount_amount || 0,
      tax_amount: contract.tax_amount || 0,
      insurance_amount: contract.insurance_amount || 0,
      security_deposit: contract.security_deposit || 0,
      final_amount: contract.final_amount || 0,
      pickup_location: contract.pickup_location || '',
      return_location: contract.return_location || '',
      special_conditions: contract.special_conditions || '',
      terms_and_conditions: contract.terms_and_conditions || '',
      customer_signature: contract.customer_signature || '',
      company_signature: contract.company_signature || '',
      customer_signed_at: contract.customer_signed_at || '',
      company_signed_at: contract.company_signed_at || '',
      pickup_photos: Array.isArray(contract.pickup_photos) ? contract.pickup_photos as string[] : [],
      return_photos: Array.isArray(contract.return_photos) ? contract.return_photos as string[] : [],
      pickup_condition_notes: contract.pickup_condition_notes || '',
      return_condition_notes: contract.return_condition_notes || '',
      pickup_damages: Array.isArray(contract.pickup_damages) ? contract.pickup_damages as any[] : [],
      return_damages: Array.isArray(contract.return_damages) ? contract.return_damages as any[] : [],
      created_at: contract.created_at,
    };

    return contractData;
  }

  /**
   * إنشاء وطباعة العقد في نافذة جديدة
   */
  static async printContract(
    contractId: string, 
    options: ContractPrintOptions = {}
  ): Promise<void> {
    try {
      // جلب بيانات العقد
      const contractData = await this.fetchContractData(contractId);
      
      // إنشاء محتوى HTML للعقد
      const contractHTML = generateContractHTML(contractData, options);
      
      // فتح نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank', 'width=794,height=1123');
      
      if (!printWindow) {
        throw new Error('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.');
      }

      // كتابة محتوى HTML في النافذة الجديدة
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>عقد رقم ${contractData.contract_number}</title>
          <style>
            /* إعدادات الطباعة */
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              
              body {
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
              }
              
              .no-print {
                display: none !important;
              }
            }
            
            /* الخطوط والتنسيق العام */
            body {
              font-family: 'Cairo', 'Tahoma', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              background: white;
              color: #000;
              margin: 0;
              padding: 20px;
            }
            
            .contract-container {
              max-width: 794px;
              margin: 0 auto;
              background: white;
              padding: 20px;
            }
            
            /* عناوين الأقسام */
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              padding: 8px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              text-align: center;
            }
            
            /* الجداول */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            th, td {
              border: 1px solid #333;
              padding: 8px;
              text-align: right;
            }
            
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            
            /* الصور */
            .photo-section img {
              max-width: 150px;
              max-height: 150px;
              margin: 5px;
              border: 1px solid #ddd;
            }
            
            /* التوقيعات */
            .signature-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            
            .signature-box {
              width: 200px;
              height: 100px;
              border: 1px solid #333;
              margin: 10px 0;
              display: inline-block;
              vertical-align: top;
            }
            
            /* أزرار التحكم */
            .print-controls {
              position: fixed;
              top: 10px;
              left: 10px;
              background: white;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            
            .print-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 8px 16px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .print-btn:hover {
              background: #0056b3;
            }
            
            /* تحسينات إضافية */
            .company-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            
            .contract-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
            }
            
            .info-block {
              flex: 1;
              margin: 0 10px;
            }
          </style>
        </head>
        <body>
          <!-- أزرار التحكم -->
          <div class="print-controls no-print">
            <button class="print-btn" onclick="window.print()">طباعة</button>
            <button class="print-btn" onclick="window.close()">إغلاق</button>
          </div>
          
          <!-- محتوى العقد -->
          <div class="contract-container">
            ${contractHTML}
          </div>
          
          <script>
            // طباعة تلقائية بعد تحميل المحتوى
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
            
            // إغلاق النافذة بعد الطباعة أو الإلغاء
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      
    } catch (error) {
      console.error('Error printing contract:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في طباعة العقد');
    }
  }

  /**
   * معاينة العقد قبل الطباعة (بدون طباعة تلقائية)
   */
  static async previewContract(
    contractId: string,
    options: ContractPrintOptions = {}
  ): Promise<void> {
    try {
      const contractData = await this.fetchContractData(contractId);
      const contractHTML = generateContractHTML(contractData, options);
      
      const previewWindow = window.open('', '_blank', 'width=794,height=1123');
      
      if (!previewWindow) {
        throw new Error('فشل في فتح نافذة المعاينة. تأكد من السماح بالنوافذ المنبثقة.');
      }

      previewWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>معاينة عقد رقم ${contractData.contract_number}</title>
          <style>
            body {
              font-family: 'Cairo', 'Tahoma', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              background: white;
              color: #000;
              margin: 0;
              padding: 20px;
            }
            
            .preview-controls {
              position: fixed;
              top: 10px;
              left: 10px;
              background: white;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            
            .btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 8px 16px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .btn:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="preview-controls">
            <button class="btn" onclick="window.print()">طباعة</button>
            <button class="btn" onclick="window.close()">إغلاق</button>
          </div>
          
          <div style="max-width: 794px; margin: 0 auto; background: white; padding: 20px;">
            ${contractHTML}
          </div>
        </body>
        </html>
      `);

      previewWindow.document.close();
      previewWindow.focus();
      
    } catch (error) {
      console.error('Error previewing contract:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في معاينة العقد');
    }
  }
}

export default ContractHTMLPrintService;