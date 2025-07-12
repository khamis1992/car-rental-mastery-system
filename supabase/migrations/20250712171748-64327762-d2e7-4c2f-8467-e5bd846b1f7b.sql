-- إنشاء دالة إضافية لإكمال باقي الحسابات
CREATE OR REPLACE FUNCTION public.complete_chart_of_accounts_part2(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- إكمال حسابات الخصوم المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21101', 'حسابات الموردين التجاريين', 'Trade Suppliers Accounts', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '21102', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21201', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '213';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21301', 'قروض بنوك قصيرة الاجل', 'Short-term Bank Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '21302', 'قروض شركات التسهيلات قصيرة الاجل', 'Short-term Finance Company Loans', 'liability', 'current_liability', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الخامس للخصوم
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2110101', 'حسابات موردين تجاريون', 'Trade Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '2110102', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '2110103', 'حسابات موردين أقساط', 'Installment Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2110201', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2120101', 'مستحقات أجور الموظفين', 'Employee Salary Accruals', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '2120102', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21301';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2130101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Loan Account 000000000000', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '2130102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Loan Account 000000000000', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21302';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2130201', 'قرض شركة ******* حساب رقم 0000000000000', 'Company ******* Loan Account 0000000000000', 'liability', 'current_liability', parent_id, 5, true, true, 0, 0);
    
    -- الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '221';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '22101', 'قروض بنوك طويلة الاجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '22102', 'قروض شركات التسهيلات طويلة الاجل', 'Long-term Finance Company Loans', 'liability', 'long_term_liability', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2210101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Long-term Loan 000000000000', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '2210102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Long-term Loan 000000000000', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2210201', 'قرض شركة ******* حساب رقم 0000000000000', 'Company ******* Long-term Loan 0000000000000', 'liability', 'long_term_liability', parent_id, 5, true, true, 0, 0);
    
    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '311';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31101', 'راس المال القائم', 'Existing Capital', 'equity', 'capital', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3110101', 'راس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '3110102', 'راس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings Previous Years', 'equity', 'capital', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '321';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '32101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings Previous Years', 'equity', 'capital', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3210101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings Previous Years', 'equity', 'capital', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '331', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '331';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '33101', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3310101', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '3310102', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '3310103', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', parent_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 31;
    
    RETURN inserted_count;
END;
$$;