
-- إضافة حقول لربط العقود بالفواتير
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'rental';

-- إضافة حقل لتسجيل الدفع في العقود
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_registered_at timestamp with time zone;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);

-- إضافة دالة لإنشاء رقم فاتورة تلقائي
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM invoices 
    WHERE invoice_number ~ ('^INV-' || year_part || '-[0-9]+$');
    
    RETURN 'INV-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- إضافة دالة لإنشاء رقم دفعة تلقائي
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM payments 
    WHERE payment_number ~ ('^PAY-' || year_part || '-[0-9]+$');
    
    RETURN 'PAY-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger لتحديث الفواتير عند تغيير حالة الدفع
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث حالة الفاتورة وفقاً للمدفوعات
    UPDATE invoices SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE invoice_id = NEW.invoice_id AND status = 'completed'
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) > 0 THEN 'partially_paid'
            ELSE status
        END,
        paid_at = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE invoice_id = NEW.invoice_id AND status = 'completed'
            ) >= total_amount THEN NOW()
            ELSE paid_at
        END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger للمدفوعات
DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON payments;
CREATE TRIGGER trigger_update_invoice_payment_status
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();
