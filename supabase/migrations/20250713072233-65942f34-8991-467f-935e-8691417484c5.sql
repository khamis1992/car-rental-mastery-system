-- Fix infinite recursion by dropping all dependent policies first, then recreating with new function
-- Step 1: Drop all policies that depend on get_current_tenant_id()

-- Drop tenant_users policies first
DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view tenant associations" ON public.tenant_users;

-- Drop other dependent policies
DROP POLICY IF EXISTS "Tenant admins can view subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Staff can manage customers in their tenant" ON public.customers;
DROP POLICY IF EXISTS "Staff can manage vehicles in their tenant" ON public.vehicles;
DROP POLICY IF EXISTS "Staff can manage contracts in their tenant" ON public.contracts;
DROP POLICY IF EXISTS "Tenant admins can manage permission groups" ON public.permission_groups;
DROP POLICY IF EXISTS "Users can view permission groups in their tenant" ON public.permission_groups;
DROP POLICY IF EXISTS "Tenant admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions in their tenant" ON public.role_permissions;
DROP POLICY IF EXISTS "Tenant admins can manage user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Tenant admins can manage data access rules" ON public.data_access_rules;
DROP POLICY IF EXISTS "Tenant admins can view permission audit log" ON public.permission_audit_log;
DROP POLICY IF EXISTS "Tenants can view their SADAD payments" ON public.sadad_payments;
DROP POLICY IF EXISTS "Tenant admins can manage SADAD payments" ON public.sadad_payments;
DROP POLICY IF EXISTS "Tenant admins can view transaction logs" ON public.sadad_transaction_log;
DROP POLICY IF EXISTS "tenants_view_own_subscription" ON public.saas_subscriptions;
DROP POLICY IF EXISTS "tenants_view_own_invoices" ON public.saas_invoices;
DROP POLICY IF EXISTS "tenants_view_own_payments" ON public.saas_payments;
DROP POLICY IF EXISTS "Tenant admins can view their subscriptions" ON public.saas_subscriptions;
DROP POLICY IF EXISTS "Tenant admins can view their invoices" ON public.saas_invoices;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة قيود tenant ال" ON public.journal_entries;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة سطور قيود te" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة حسابات tenant " ON public.bank_accounts;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة معاملات tenan" ON public.bank_transactions;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة أصول tenant ال" ON public.fixed_assets;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة استهلاك tenan" ON public.asset_depreciation;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة ميزانيات ten" ON public.budgets;
DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة بنود ميزان" ON public.budget_items;
DROP POLICY IF EXISTS "employees_tenant_isolation" ON public.employees;
DROP POLICY IF EXISTS "vehicles_tenant_isolation" ON public.vehicles;
DROP POLICY IF EXISTS "quotations_tenant_isolation" ON public.quotations;
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON public.invoices;
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payments;
DROP POLICY IF EXISTS "journal_entries_tenant_isolation" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "fixed_assets_tenant_isolation" ON public.fixed_assets;
DROP POLICY IF EXISTS "Users can view themes in their tenant" ON public.tenant_themes;
DROP POLICY IF EXISTS "Tenant admins can manage themes" ON public.tenant_themes;
DROP POLICY IF EXISTS "Users can view domains in their tenant" ON public.tenant_domains;
DROP POLICY IF EXISTS "Tenant admins can manage domains" ON public.tenant_domains;
DROP POLICY IF EXISTS "Users can view assets in their tenant" ON public.tenant_assets;
DROP POLICY IF EXISTS "Tenant admins can manage assets" ON public.tenant_assets;
DROP POLICY IF EXISTS "Users can view customizations in their tenant" ON public.tenant_customizations;
DROP POLICY IF EXISTS "Tenant admins can manage customizations" ON public.tenant_customizations;
DROP POLICY IF EXISTS "Tenant users can view their assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view branding in their tenant" ON public.company_branding;
DROP POLICY IF EXISTS "Tenant admins can manage branding" ON public.company_branding;
DROP POLICY IF EXISTS "عزل كامل للعقود حسب المؤسسة" ON public.contracts;
DROP POLICY IF EXISTS "عزل كامل للعملاء حسب المؤسسة" ON public.customers;
DROP POLICY IF EXISTS "عزل كامل للمركبات حسب المؤسسة" ON public.vehicles;