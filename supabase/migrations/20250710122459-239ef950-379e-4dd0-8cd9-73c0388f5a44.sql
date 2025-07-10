-- Create saas_subscriptions table for tenant subscriptions
CREATE TABLE public.saas_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,
    trial_end_date DATE,
    discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    notes TEXT
);

-- Create saas_invoices table for subscription billing
CREATE TABLE public.saas_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE DEFAULT generate_saas_invoice_number(),
    subscription_id UUID NOT NULL REFERENCES saas_subscriptions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'KWD',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create saas_invoice_items table for detailed billing items
CREATE TABLE public.saas_invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES saas_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    item_type TEXT NOT NULL DEFAULT 'subscription' CHECK (item_type IN ('subscription', 'usage', 'addon', 'discount')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_history table for payment tracking
CREATE TABLE public.billing_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES saas_invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending', 'refunded')),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saas_subscriptions
CREATE POLICY "Super admins can manage all subscriptions" 
ON public.saas_subscriptions 
FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM tenant_users 
        WHERE role = 'super_admin' AND status = 'active'
    )
);

CREATE POLICY "Tenant admins can view their subscriptions" 
ON public.saas_subscriptions 
FOR SELECT 
USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'manager') AND status = 'active'
    )
);

-- Create RLS policies for saas_invoices
CREATE POLICY "Super admins can manage all invoices" 
ON public.saas_invoices 
FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM tenant_users 
        WHERE role = 'super_admin' AND status = 'active'
    )
);

CREATE POLICY "Tenant users can view their invoices" 
ON public.saas_invoices 
FOR SELECT 
USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Create RLS policies for saas_invoice_items
CREATE POLICY "Super admins can manage all invoice items" 
ON public.saas_invoice_items 
FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM tenant_users 
        WHERE role = 'super_admin' AND status = 'active'
    )
);

CREATE POLICY "Users can view invoice items for their invoices" 
ON public.saas_invoice_items 
FOR SELECT 
USING (
    invoice_id IN (
        SELECT i.id FROM saas_invoices i
        JOIN tenant_users tu ON i.tenant_id = tu.tenant_id
        WHERE tu.user_id = auth.uid() AND tu.status = 'active'
    )
);

-- Create RLS policies for billing_history
CREATE POLICY "Super admins can manage all billing history" 
ON public.billing_history 
FOR ALL 
USING (
    auth.uid() IN (
        SELECT user_id FROM tenant_users 
        WHERE role = 'super_admin' AND status = 'active'
    )
);

CREATE POLICY "Tenant users can view their billing history" 
ON public.billing_history 
FOR SELECT 
USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Create indexes for better performance
CREATE INDEX idx_saas_subscriptions_tenant_id ON public.saas_subscriptions(tenant_id);
CREATE INDEX idx_saas_subscriptions_plan_id ON public.saas_subscriptions(plan_id);
CREATE INDEX idx_saas_subscriptions_status ON public.saas_subscriptions(status);
CREATE INDEX idx_saas_subscriptions_next_billing_date ON public.saas_subscriptions(next_billing_date);

CREATE INDEX idx_saas_invoices_subscription_id ON public.saas_invoices(subscription_id);
CREATE INDEX idx_saas_invoices_tenant_id ON public.saas_invoices(tenant_id);
CREATE INDEX idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX idx_saas_invoices_due_date ON public.saas_invoices(due_date);

CREATE INDEX idx_saas_invoice_items_invoice_id ON public.saas_invoice_items(invoice_id);
CREATE INDEX idx_billing_history_invoice_id ON public.billing_history(invoice_id);
CREATE INDEX idx_billing_history_tenant_id ON public.billing_history(tenant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_saas_subscriptions_updated_at
    BEFORE UPDATE ON public.saas_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_leave_requests();

CREATE TRIGGER update_saas_invoices_updated_at
    BEFORE UPDATE ON public.saas_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_leave_requests();