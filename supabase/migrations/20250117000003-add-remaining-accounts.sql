-- إضافة باقي الحسابات الناقصة (الالتزامات، حقوق الملكية، الإيرادات، والمصروفات)
-- دون المساس بالحسابات الحالية

CREATE OR REPLACE FUNCTION public.add_remaining_missing_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    account_exists BOOLEAN;
    parent_id UUID;
BEGIN
    
    -- ==================== الالتزامات ====================
    
    -- الالتزامات المتداولة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الالتزامات طويلة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الحسابات الدائنة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '21';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات الموردين التجاريين
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '211';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '2111', 'حسابات الموردين التجاريين', 'Trade Suppliers', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات موردين تجاريون
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21111', 'حسابات موردين تجاريون', 'Trade Suppliers Accounts', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات موردين قطع غيار
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21112', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات موردين أقساط
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21113') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21113', 'حسابات موردين أقساط', 'Installment Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات موردين شركات زميلة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21114') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21114', 'حسابات موردين شركات زميلة', 'Related Company Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات دائنة أخرى
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '211';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '2112', 'حسابات دائنة أخرى', 'Other Payables', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مستحقات أجور الموظفين
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21121', 'مستحقات أجور الموظفين', 'Employee Salary Accruals', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حسابات دائنة أخرى متنوعة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21122') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21122', 'حسابات دائنة أخرى', 'Other Creditor Accounts', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قروض قصيرة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '21';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '212', 'قروض قصيرة الأجل', 'Short-term Loans', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قروض بنوك قصيرة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '212';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '2121', 'قروض بنوك قصيرة الأجل', 'Short-term Bank Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض بنك التجاري حساب رقم
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21211') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2121';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21211', 'قرض بنك التجاري حساب رقم', 'Commercial Bank Loan Account No.', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض بنك بيت التمويل حساب رقم
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21212') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2121';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21212', 'قرض بنك بيت التمويل حساب رقم', 'Kuwait Finance House Loan Account No.', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قروض شركات التسهيلات قصيرة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2122') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '212';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '2122', 'قروض شركات التسهيلات قصيرة الأجل', 'Short-term Facility Company Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض شركة حساب رقم
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21221') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '2122';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '21221', 'قرض شركة حساب رقم', 'Company Loan Account No.', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الالتزامات طويلة الأجل - قروض بنوك
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '221') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '22';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '221', 'قروض بنوك طويلة الأجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض بنك التجاري طويل الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '221';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '22111', 'قرض بنك التجاري حساب رقم', 'Commercial Bank Long-term Loan Account No.', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض بنك بيت التمويل طويل الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '221';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '22112', 'قرض بنك بيت التمويل حساب رقم', 'Kuwait Finance House Long-term Loan Account No.', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قروض شركات التسهيلات طويلة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '222') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '22';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '222', 'قروض شركات التسهيلات طويلة الأجل', 'Long-term Facility Company Loans', 'liability', 'long_term_liability', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- قرض شركة طويل الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22221') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '222';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '22221', 'قرض شركة حساب رقم', 'Long-term Company Loan Account No.', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== حقوق الملكية ====================
    
    -- رأس المال
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- رأس مال الشركاء
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '311') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '31';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- رأس المال القائم
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '311';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '3111', 'رأس المال القائم', 'Paid-up Capital', 'equity', 'capital', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- رأس مال شريك أبو جراح
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '31111', 'رأس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- رأس مال شريك أبو حسين
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '31112', 'رأس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الأرباح المرحلة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الأرباح المرحلة سنين سابقة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '321') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '32';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings Previous Years', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الاحتياطيات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الاحتياطي القانوني
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '331') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '33';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '331', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الاحتياطي العام
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '332') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '33';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '332', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- احتياطي إعادة التقييم
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '333') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '33';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '333', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    RETURN inserted_count;
END;
$$;

-- تطبيق إضافة الحسابات الناقصة على جميع المؤسسات النشطة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_added INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status IN ('active', 'trial')
    LOOP
        BEGIN
            SELECT public.add_remaining_missing_accounts(tenant_record.id) INTO accounts_added;
            RAISE NOTICE 'تم إضافة % من الحسابات الناقصة الإضافية للمؤسسة: %', accounts_added, tenant_record.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في إضافة الحسابات الإضافية للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.add_remaining_missing_accounts(UUID) IS 'دالة آمنة تضيف باقي الحسابات الناقصة (الالتزامات، حقوق الملكية، الإيرادات، والمصروفات) دون المساس بالحسابات الحالية'; 