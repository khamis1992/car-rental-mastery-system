import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Languages } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import CompanyHeader from './CompanyHeader';
import CompanyFooter from './CompanyFooter';

interface ContractData {
  id: string;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  security_deposit: number;
  insurance_amount: number;
  final_amount: number;
  pickup_location?: string;
  return_location?: string;
  fuel_level_pickup?: string;
  fuel_level_return?: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  notes?: string;
  customer_signature?: string;
  company_signature?: string;
  customers?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    national_id?: string;
    address?: string;
  };
  vehicles?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_number: string;
    color?: string;
  };
}

interface ContractPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
}

export const ContractPrintDialog: React.FC<ContractPrintDialogProps> = ({
  open,
  onOpenChange,
  contractId,
}) => {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && contractId) {
      loadContractData();
    }
  }, [open, contractId]);

  const loadContractData = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email,
            national_id,
            address
          ),
          vehicles (
            id,
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

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error loading contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('contract-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Contract ${contract?.contract_number}</title>
              <style>
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  direction: rtl;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.6;
                }
                .contract-header {
                  text-align: center;
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .contract-title {
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .contract-number {
                  font-size: 18px;
                  color: #666;
                }
                .section {
                  margin-bottom: 25px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  padding: 20px;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: bold;
                  background: #f5f5f5;
                  margin: -20px -20px 15px -20px;
                  padding: 10px 20px;
                  border-radius: 8px 8px 0 0;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                }
                .info-item {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  border-bottom: 1px dotted #ccc;
                }
                .info-label {
                  font-weight: bold;
                  color: #333;
                }
                .info-value {
                  color: #666;
                }
                .financial-summary {
                  background: #f9f9f9;
                  padding: 20px;
                  border-radius: 8px;
                  margin-top: 20px;
                }
                .total-amount {
                  font-size: 20px;
                  font-weight: bold;
                  text-align: center;
                  color: #2563eb;
                  border-top: 2px solid #2563eb;
                  padding-top: 15px;
                  margin-top: 15px;
                }
                .signature-section {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 50px;
                  margin-top: 50px;
                  text-align: center;
                }
                .signature-box {
                  border-top: 2px solid #333;
                  padding-top: 10px;
                  margin-top: 80px;
                }
                .terms-section {
                  font-size: 12px;
                  line-height: 1.5;
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  white-space: pre-wrap;
                }
                @media print {
                  body { margin: 0; padding: 15px; }
                  .section { break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p>جاري تحميل بيانات العقد...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p>لم يتم العثور على بيانات العقد</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b print:hidden">
          <div className="text-right">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Languages className="w-6 h-6" />
              عقد إيجار السيارة - Contract Preview
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              رقم العقد: {contract.contract_number}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </DialogHeader>

        <div id="contract-print-content">
          {/* Company Header */}
          <CompanyHeader />
          
          {/* Contract Header */}
          <div className="contract-header text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="contract-title text-3xl font-bold mb-2">
              عقد إيجار مركبة
              <br />
              <span className="text-xl text-muted-foreground">Car Rental Agreement</span>
            </h1>
            <div className="contract-number text-lg">
              <p>رقم العقد: <span className="font-bold">{contract.contract_number}</span></p>
              <p className="text-sm text-gray-600 mt-1">
                Contract Number: <span className="font-medium">{contract.contract_number}</span>
              </p>
            </div>
          </div>

          {/* Customer and Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Customer Information */}
            <div className="section border border-gray-300 p-4 rounded">
              <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
                بيانات المستأجر / Customer Information
              </h3>
              <div className="space-y-2">
                <div className="info-item flex justify-between">
                  <span className="info-label">الاسم / Name:</span>
                  <span className="info-value">{contract.customers?.name}</span>
                </div>
                <div className="info-item flex justify-between">
                  <span className="info-label">رقم الهاتف / Phone:</span>
                  <span className="info-value">{contract.customers?.phone}</span>
                </div>
                {contract.customers?.email && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">البريد الإلكتروني / Email:</span>
                    <span className="info-value">{contract.customers.email}</span>
                  </div>
                )}
                {contract.customers?.national_id && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">الهوية الوطنية / National ID:</span>
                    <span className="info-value">{contract.customers.national_id}</span>
                  </div>
                )}
                {contract.customers?.address && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">العنوان / Address:</span>
                    <span className="info-value">{contract.customers.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="section border border-gray-300 p-4 rounded">
              <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
                بيانات المركبة / Vehicle Information
              </h3>
              <div className="space-y-2">
                <div className="info-item flex justify-between">
                  <span className="info-label">نوع المركبة / Vehicle Type:</span>
                  <span className="info-value">{contract.vehicles?.make} {contract.vehicles?.model}</span>
                </div>
                <div className="info-item flex justify-between">
                  <span className="info-label">سنة الصنع / Year:</span>
                  <span className="info-value">{contract.vehicles?.year}</span>
                </div>
                <div className="info-item flex justify-between">
                  <span className="info-label">رقم المركبة / Vehicle Number:</span>
                  <span className="info-value">{contract.vehicles?.vehicle_number}</span>
                </div>
                <div className="info-item flex justify-between">
                  <span className="info-label">رقم اللوحة / License Plate:</span>
                  <span className="info-value">{contract.vehicles?.license_plate}</span>
                </div>
                {contract.vehicles?.color && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">اللون / Color:</span>
                    <span className="info-value">{contract.vehicles.color}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="section border border-gray-300 p-4 rounded mb-8">
            <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
              تفاصيل الإيجار / Rental Details
            </h3>
            <div className="info-grid grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="info-item flex justify-between">
                <span className="info-label">تاريخ البداية / Start Date:</span>
                <span className="info-value">{formatDate(contract.start_date)}</span>
              </div>
              <div className="info-item flex justify-between">
                <span className="info-label">تاريخ النهاية / End Date:</span>
                <span className="info-value">{formatDate(contract.end_date)}</span>
              </div>
              <div className="info-item flex justify-between">
                <span className="info-label">عدد الأيام / Rental Days:</span>
                <span className="info-value">{contract.rental_days} يوم</span>
              </div>
              <div className="info-item flex justify-between">
                <span className="info-label">السعر اليومي / Daily Rate:</span>
                <span className="info-value">{formatCurrencyKWD(contract.daily_rate)}</span>
              </div>
              <div className="info-item flex justify-between">
                <span className="info-label">الحالة / Status:</span>
                <span className="info-value">
                  {contract.status === 'draft' ? 'مسودة / Draft' : 
                   contract.status === 'pending' ? 'في الانتظار / Pending' : 
                   contract.status === 'active' ? 'نشط / Active' : 
                   contract.status === 'completed' ? 'مكتمل / Completed' : 'ملغي / Cancelled'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="section border border-gray-300 p-4 rounded mb-8">
            <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
              التفاصيل المالية / Financial Details
            </h3>
            <div className="financial-summary">
              <div className="space-y-2">
                <div className="info-item flex justify-between">
                  <span className="info-label">المبلغ الأساسي / Base Amount:</span>
                  <span className="info-value">{formatCurrencyKWD(contract.total_amount)}</span>
                </div>
                {contract.discount_amount > 0 && (
                  <div className="info-item flex justify-between text-green-600">
                    <span className="info-label">الخصم / Discount:</span>
                    <span className="info-value">- {formatCurrencyKWD(contract.discount_amount)}</span>
                  </div>
                )}
                {contract.tax_amount > 0 && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">الضريبة / Tax:</span>
                    <span className="info-value">{formatCurrencyKWD(contract.tax_amount)}</span>
                  </div>
                )}
                {contract.security_deposit > 0 && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">التأمين / Security Deposit:</span>
                    <span className="info-value">{formatCurrencyKWD(contract.security_deposit)}</span>
                  </div>
                )}
                {contract.insurance_amount > 0 && (
                  <div className="info-item flex justify-between">
                    <span className="info-label">التأمين الإضافي / Additional Insurance:</span>
                    <span className="info-value">{formatCurrencyKWD(contract.insurance_amount)}</span>
                  </div>
                )}
              </div>
              <div className="total-amount">
                <span className="info-label">المبلغ الإجمالي / Total Amount:</span>
                <span className="info-value font-bold text-xl">{formatCurrencyKWD(contract.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Special Conditions */}
          {contract.special_conditions && (
            <div className="section border border-gray-300 p-4 rounded mb-8">
              <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
                شروط خاصة / Special Conditions
              </h3>
              <div className="terms-section">
                {contract.special_conditions}
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          {contract.terms_and_conditions && (
            <div className="section border border-gray-300 p-4 rounded mb-8">
              <h3 className="section-title text-lg font-bold mb-3 bg-gray-100 p-2 -m-2 rounded-t">
                الشروط والأحكام / Terms and Conditions
              </h3>
              <div className="terms-section">
                {contract.terms_and_conditions}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="signature-section grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              {contract.customer_signature && (
                <img 
                  src={contract.customer_signature} 
                  alt="Customer Signature" 
                  className="max-h-24 mx-auto mb-4"
                />
              )}
              <div className="signature-box border-t-2 border-gray-800 pt-2 mt-16">
                <p className="font-bold">توقيع المستأجر / Customer Signature</p>
                <p className="text-sm text-gray-600 mt-1">{contract.customers?.name}</p>
              </div>
            </div>
            <div className="text-center">
              {contract.company_signature && (
                <img 
                  src={contract.company_signature} 
                  alt="Company Signature" 
                  className="max-h-24 mx-auto mb-4"
                />
              )}
              <div className="signature-box border-t-2 border-gray-800 pt-2 mt-16">
                <p className="font-bold">توقيع الشركة / Company Signature</p>
                <p className="text-sm text-gray-600 mt-1">شركة تأجير المركبات</p>
              </div>
            </div>
          </div>

          {/* Company Footer */}
          <CompanyFooter />

          {/* Print Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-300 text-sm text-gray-600">
            <p>تم طباعة هذا العقد بتاريخ {new Date().toLocaleDateString('ar-SA')}</p>
            <p className="mt-1">This contract was printed on {new Date().toLocaleDateString('en-US')}</p>
            <p className="mt-1">نظام إدارة تأجير المركبات / Car Rental Management System</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};