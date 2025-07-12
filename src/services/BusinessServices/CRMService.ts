import { supabase } from '@/integrations/supabase/client';
import { eventBusService, BusinessEventTypes } from '@/services/EventBus/EventBusService';

// معلومات العميل المتقدمة
export interface CustomerProfile {
  id: string;
  customer_code: string;
  type: 'individual' | 'corporate';
  full_name: string;
  company_name?: string;
  email: string;
  phone: string;
  secondary_phone?: string;
  address: CustomerAddress;
  identification: CustomerIdentification;
  financial_info: CustomerFinancialInfo;
  preferences: CustomerPreferences;
  lifecycle_stage: CustomerLifecycleStage;
  segments: string[];
  tags: string[];
  source: string;
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
}

// عنوان العميل
export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// معلومات الهوية
export interface CustomerIdentification {
  civil_id?: string;
  commercial_registration?: string;
  tax_id?: string;
  passport_number?: string;
  driving_license?: string;
  other_documents?: {
    type: string;
    number: string;
    expiry_date?: Date;
  }[];
}

// المعلومات المالية
export interface CustomerFinancialInfo {
  credit_limit: number;
  payment_terms: number; // أيام
  preferred_payment_method: string;
  currency: string;
  discount_percentage: number;
  tax_exempt: boolean;
  account_balance: number;
  outstanding_balance: number;
  credit_score: number;
  payment_history_score: number;
  risk_category: 'low' | 'medium' | 'high';
  last_payment_date?: Date;
  average_payment_days: number;
}

// تفضيلات العميل
export interface CustomerPreferences {
  communication_channel: 'email' | 'sms' | 'phone' | 'whatsapp';
  language: string;
  newsletter_subscription: boolean;
  promotional_offers: boolean;
  preferred_contact_time: string;
  special_requirements?: string;
  vehicle_preferences?: {
    types: string[];
    features: string[];
    price_range: {
      min: number;
      max: number;
    };
  };
}

// مرحلة دورة حياة العميل
export enum CustomerLifecycleStage {
  PROSPECT = 'prospect',
  LEAD = 'lead',
  CUSTOMER = 'customer',
  LOYAL_CUSTOMER = 'loyal_customer',
  VIP_CUSTOMER = 'vip_customer',
  CHURNED = 'churned',
  INACTIVE = 'inactive'
}

// نشاط العميل
export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: CustomerActivityType;
  title: string;
  description: string;
  date: Date;
  performed_by: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: any;
  tenant_id: string;
}

// أنواع النشاط
export enum CustomerActivityType {
  CONTACT = 'contact',
  MEETING = 'meeting',
  EMAIL = 'email',
  SMS = 'sms',
  CALL = 'call',
  RENTAL = 'rental',
  PAYMENT = 'payment',
  COMPLAINT = 'complaint',
  FEEDBACK = 'feedback',
  QUOTE = 'quote',
  CONTRACT = 'contract',
  VISIT = 'visit',
  FOLLOW_UP = 'follow_up',
  MARKETING = 'marketing',
  SUPPORT = 'support'
}

// فرصة البيع
export interface SalesOpportunity {
  id: string;
  customer_id: string;
  opportunity_name: string;
  description: string;
  stage: OpportunityStage;
  probability: number;
  value: number;
  currency: string;
  expected_close_date: Date;
  actual_close_date?: Date;
  source: string;
  assigned_to: string;
  products_services: OpportunityItem[];
  competitors?: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
}

// مراحل الفرصة
export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  NEEDS_ANALYSIS = 'needs_analysis',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  ON_HOLD = 'on_hold'
}

// عنصر الفرصة
export interface OpportunityItem {
  product_service: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
  notes?: string;
}

// حملة تسويقية
export interface MarketingCampaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  target_audience: string[];
  start_date: Date;
  end_date: Date;
  budget: number;
  spent: number;
  channels: string[];
  message: string;
  metrics: CampaignMetrics;
  created_by: string;
  tenant_id: string;
}

// نوع الحملة
export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL_MEDIA = 'social_media',
  PRINT = 'print',
  RADIO = 'radio',
  TV = 'tv',
  ONLINE_ADS = 'online_ads',
  DIRECT_MAIL = 'direct_mail',
  EVENT = 'event',
  REFERRAL = 'referral'
}

// حالة الحملة
export enum CampaignStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// مقاييس الحملة
export interface CampaignMetrics {
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cost_per_click: number;
  cost_per_conversion: number;
  roi: number;
  engagement_rate: number;
  open_rate?: number;
  click_through_rate?: number;
}

// تذكرة الدعم
export interface SupportTicket {
  id: string;
  customer_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  created_by: string;
  resolution?: string;
  satisfaction_score?: number;
  tags: string[];
  attachments?: string[];
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  tenant_id: string;
}

// أولوية التذكرة
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// حالة التذكرة
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

// تحليلات العميل
export interface CustomerAnalytics {
  customer_id: string;
  total_revenue: number;
  average_order_value: number;
  total_orders: number;
  customer_lifetime_value: number;
  acquisition_cost: number;
  churn_probability: number;
  satisfaction_score: number;
  loyalty_score: number;
  engagement_score: number;
  profitability_score: number;
  risk_score: number;
  next_best_action: string;
  predicted_actions: PredictedAction[];
  behavior_patterns: BehaviorPattern[];
  tenant_id: string;
}

// الإجراء المتوقع
export interface PredictedAction {
  action: string;
  probability: number;
  value: number;
  timeframe: string;
  confidence: number;
}

// نمط السلوك
export interface BehaviorPattern {
  pattern_name: string;
  description: string;
  frequency: number;
  last_occurrence: Date;
  impact: 'positive' | 'negative' | 'neutral';
  suggestions: string[];
}

// التقرير التحليلي
export interface CRMReport {
  id: string;
  report_type: CRMReportType;
  title: string;
  description: string;
  filters: any;
  data: any;
  charts: ChartData[];
  generated_at: Date;
  generated_by: string;
  tenant_id: string;
}

// نوع التقرير
export enum CRMReportType {
  CUSTOMER_OVERVIEW = 'customer_overview',
  SALES_PERFORMANCE = 'sales_performance',
  MARKETING_EFFECTIVENESS = 'marketing_effectiveness',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  REVENUE_ANALYSIS = 'revenue_analysis',
  CUSTOMER_RETENTION = 'customer_retention',
  LEAD_CONVERSION = 'lead_conversion',
  ACTIVITY_SUMMARY = 'activity_summary',
  SUPPORT_METRICS = 'support_metrics'
}

// بيانات الرسم البياني
export interface ChartData {
  chart_type: string;
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

class CRMService {
  private tenant_id: string | null = null;

  constructor() {
    this.initializeTenant();
  }

  private async initializeTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        this.tenant_id = data?.tenant_id || null;
      }
    } catch (error) {
      console.error('Error initializing tenant:', error);
    }
  }

  // إدارة ملفات العملاء

  async createCustomer(customerData: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const customerCode = await this.generateCustomerCode();
      
      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          customer_code: customerCode,
          type: customerData.type || 'individual',
          full_name: customerData.full_name,
          company_name: customerData.company_name,
          email: customerData.email,
          phone: customerData.phone,
          secondary_phone: customerData.secondary_phone,
          address: customerData.address,
          identification: customerData.identification,
          financial_info: customerData.financial_info || this.getDefaultFinancialInfo(),
          preferences: customerData.preferences || this.getDefaultPreferences(),
          lifecycle_stage: customerData.lifecycle_stage || CustomerLifecycleStage.PROSPECT,
          segments: customerData.segments || [],
          tags: customerData.tags || [],
          source: customerData.source || 'manual',
          assigned_to: customerData.assigned_to,
          tenant_id: this.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create customer: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: customer.id,
        activity_type: CustomerActivityType.CONTACT,
        title: 'Customer Created',
        description: `New customer ${customer.full_name} was created`,
        date: new Date(),
        performed_by: 'system'
      });

      // إنشاء حساب العميل في المحاسبة
      await this.createCustomerAccount(customer);

      // نشر حدث إنشاء العميل
      await eventBusService.publishEvent({
        type: BusinessEventTypes.CUSTOMER_REGISTERED,
        source: 'crm-service',
        data: {
          customer_id: customer.id,
          customer_code: customerCode,
          customer_name: customer.full_name,
          customer_type: customer.type,
          action: 'customer_created'
        }
      });

      return this.mapCustomerData(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('tenant_id', this.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: customerId,
        activity_type: CustomerActivityType.CONTACT,
        title: 'Customer Updated',
        description: `Customer information was updated`,
        date: new Date(),
        performed_by: 'user'
      });

      // نشر حدث تحديث العميل
      await eventBusService.publishEvent({
        type: BusinessEventTypes.CUSTOMER_UPDATED,
        source: 'crm-service',
        data: {
          customer_id: customerId,
          updates: Object.keys(updates),
          action: 'customer_updated'
        }
      });

      return this.mapCustomerData(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<CustomerProfile | null> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', this.tenant_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapCustomerData(customer);
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  }

  async getCustomers(filters?: any): Promise<CustomerProfile[]> {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', this.tenant_id);

      // تطبيق الفلاتر
      if (filters?.lifecycle_stage) {
        query = query.eq('lifecycle_stage', filters.lifecycle_stage);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data: customers, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (error) {
        throw error;
      }

      return customers?.map(customer => this.mapCustomerData(customer)) || [];
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  // إدارة الأنشطة

  async logActivity(activity: Partial<CustomerActivity>): Promise<CustomerActivity> {
    try {
      const { data: newActivity, error } = await supabase
        .from('customer_activities')
        .insert({
          customer_id: activity.customer_id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          date: activity.date?.toISOString() || new Date().toISOString(),
          performed_by: activity.performed_by,
          related_entity_type: activity.related_entity_type,
          related_entity_id: activity.related_entity_id,
          metadata: activity.metadata,
          tenant_id: this.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log activity: ${error.message}`);
      }

      return {
        id: newActivity.id,
        customer_id: newActivity.customer_id,
        activity_type: newActivity.activity_type,
        title: newActivity.title,
        description: newActivity.description,
        date: new Date(newActivity.date),
        performed_by: newActivity.performed_by,
        related_entity_type: newActivity.related_entity_type,
        related_entity_id: newActivity.related_entity_id,
        metadata: newActivity.metadata,
        tenant_id: newActivity.tenant_id
      };
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getCustomerActivities(customerId: string, limit: number = 20): Promise<CustomerActivity[]> {
    try {
      const { data: activities, error } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', this.tenant_id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return activities?.map(activity => ({
        id: activity.id,
        customer_id: activity.customer_id,
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        date: new Date(activity.date),
        performed_by: activity.performed_by,
        related_entity_type: activity.related_entity_type,
        related_entity_id: activity.related_entity_id,
        metadata: activity.metadata,
        tenant_id: activity.tenant_id
      })) || [];
    } catch (error) {
      console.error('Error getting customer activities:', error);
      return [];
    }
  }

  // إدارة الفرص

  async createOpportunity(opportunityData: Partial<SalesOpportunity>): Promise<SalesOpportunity> {
    try {
      const { data: opportunity, error } = await supabase
        .from('sales_opportunities')
        .insert({
          customer_id: opportunityData.customer_id,
          opportunity_name: opportunityData.opportunity_name,
          description: opportunityData.description,
          stage: opportunityData.stage || OpportunityStage.PROSPECTING,
          probability: opportunityData.probability || 0,
          value: opportunityData.value || 0,
          currency: opportunityData.currency || 'KWD',
          expected_close_date: opportunityData.expected_close_date?.toISOString(),
          source: opportunityData.source || 'manual',
          assigned_to: opportunityData.assigned_to,
          products_services: opportunityData.products_services || [],
          competitors: opportunityData.competitors || [],
          notes: opportunityData.notes,
          tenant_id: this.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create opportunity: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: opportunity.customer_id,
        activity_type: CustomerActivityType.QUOTE,
        title: 'Opportunity Created',
        description: `New opportunity: ${opportunity.opportunity_name}`,
        date: new Date(),
        performed_by: 'user',
        related_entity_type: 'opportunity',
        related_entity_id: opportunity.id
      });

      return this.mapOpportunityData(opportunity);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  async updateOpportunityStage(opportunityId: string, stage: OpportunityStage, notes?: string): Promise<boolean> {
    try {
      const { data: opportunity, error } = await supabase
        .from('sales_opportunities')
        .update({
          stage,
          notes,
          updated_at: new Date().toISOString(),
          actual_close_date: stage === OpportunityStage.CLOSED_WON || stage === OpportunityStage.CLOSED_LOST ? 
            new Date().toISOString() : null
        })
        .eq('id', opportunityId)
        .eq('tenant_id', this.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update opportunity stage: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: opportunity.customer_id,
        activity_type: CustomerActivityType.QUOTE,
        title: 'Opportunity Stage Updated',
        description: `Stage changed to: ${stage}`,
        date: new Date(),
        performed_by: 'user',
        related_entity_type: 'opportunity',
        related_entity_id: opportunityId
      });

      // إنشاء عقد إذا تم إغلاق الفرصة بنجاح
      if (stage === OpportunityStage.CLOSED_WON) {
        await this.createContractFromOpportunity(opportunityId);
      }

      return true;
    } catch (error) {
      console.error('Error updating opportunity stage:', error);
      return false;
    }
  }

  // إدارة الحملات التسويقية

  async createCampaign(campaignData: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    try {
      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          name: campaignData.name,
          type: campaignData.type,
          status: campaignData.status || CampaignStatus.PLANNED,
          target_audience: campaignData.target_audience || [],
          start_date: campaignData.start_date?.toISOString(),
          end_date: campaignData.end_date?.toISOString(),
          budget: campaignData.budget || 0,
          spent: 0,
          channels: campaignData.channels || [],
          message: campaignData.message,
          metrics: campaignData.metrics || this.getDefaultCampaignMetrics(),
          created_by: 'user',
          tenant_id: this.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create campaign: ${error.message}`);
      }

      return this.mapCampaignData(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async updateCampaignMetrics(campaignId: string, metrics: Partial<CampaignMetrics>): Promise<boolean> {
    try {
      const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('metrics')
        .eq('id', campaignId)
        .single();

      const updatedMetrics = { ...campaign.metrics, ...metrics };

      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ metrics: updatedMetrics })
        .eq('id', campaignId)
        .eq('tenant_id', this.tenant_id);

      if (error) {
        throw new Error(`Failed to update campaign metrics: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      return false;
    }
  }

  // إدارة الدعم

  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      const ticketNumber = await this.generateTicketNumber();

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          customer_id: ticketData.customer_id,
          ticket_number: ticketNumber,
          subject: ticketData.subject,
          description: ticketData.description,
          category: ticketData.category || 'general',
          priority: ticketData.priority || TicketPriority.MEDIUM,
          status: ticketData.status || TicketStatus.OPEN,
          assigned_to: ticketData.assigned_to,
          created_by: 'user',
          tags: ticketData.tags || [],
          attachments: ticketData.attachments || [],
          tenant_id: this.tenant_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create support ticket: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: ticket.customer_id,
        activity_type: CustomerActivityType.SUPPORT,
        title: 'Support Ticket Created',
        description: `Ticket #${ticketNumber}: ${ticket.subject}`,
        date: new Date(),
        performed_by: 'user',
        related_entity_type: 'support_ticket',
        related_entity_id: ticket.id
      });

      return this.mapTicketData(ticket);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async resolveTicket(ticketId: string, resolution: string, satisfactionScore?: number): Promise<boolean> {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .update({
          status: TicketStatus.RESOLVED,
          resolution,
          satisfaction_score: satisfactionScore,
          resolved_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('tenant_id', this.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to resolve ticket: ${error.message}`);
      }

      // تسجيل النشاط
      await this.logActivity({
        customer_id: ticket.customer_id,
        activity_type: CustomerActivityType.SUPPORT,
        title: 'Support Ticket Resolved',
        description: `Ticket #${ticket.ticket_number} has been resolved`,
        date: new Date(),
        performed_by: 'user',
        related_entity_type: 'support_ticket',
        related_entity_id: ticketId
      });

      return true;
    } catch (error) {
      console.error('Error resolving ticket:', error);
      return false;
    }
  }

  // التحليلات والتقارير

  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    try {
      // جمع البيانات من مصادر متعددة
      const [
        contracts,
        payments,
        activities,
        tickets
      ] = await Promise.all([
        this.getCustomerContracts(customerId),
        this.getCustomerPayments(customerId),
        this.getCustomerActivities(customerId, 100),
        this.getCustomerTickets(customerId)
      ]);

      // حساب المقاييس
      const totalRevenue = contracts.reduce((sum, contract) => sum + (contract.total_amount || 0), 0);
      const totalOrders = contracts.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const analytics: CustomerAnalytics = {
        customer_id: customerId,
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
        total_orders: totalOrders,
        customer_lifetime_value: await this.calculateCLV(customerId),
        acquisition_cost: await this.calculateAcquisitionCost(customerId),
        churn_probability: await this.calculateChurnProbability(customerId),
        satisfaction_score: await this.calculateSatisfactionScore(customerId),
        loyalty_score: await this.calculateLoyaltyScore(customerId),
        engagement_score: await this.calculateEngagementScore(customerId),
        profitability_score: await this.calculateProfitabilityScore(customerId),
        risk_score: await this.calculateRiskScore(customerId),
        next_best_action: await this.determineNextBestAction(customerId),
        predicted_actions: await this.predictCustomerActions(customerId),
        behavior_patterns: await this.analyzeBehaviorPatterns(customerId),
        tenant_id: this.tenant_id!
      };

      return analytics;
    } catch (error) {
      console.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  async generateReport(reportType: CRMReportType, filters?: any): Promise<CRMReport> {
    try {
      let data: any = {};
      let charts: ChartData[] = [];

      switch (reportType) {
        case CRMReportType.CUSTOMER_OVERVIEW:
          data = await this.getCustomerOverviewData(filters);
          charts = await this.getCustomerOverviewCharts(data);
          break;
        case CRMReportType.SALES_PERFORMANCE:
          data = await this.getSalesPerformanceData(filters);
          charts = await this.getSalesPerformanceCharts(data);
          break;
        case CRMReportType.MARKETING_EFFECTIVENESS:
          data = await this.getMarketingEffectivenessData(filters);
          charts = await this.getMarketingEffectivenessCharts(data);
          break;
        // ... باقي أنواع التقارير
      }

      const report: CRMReport = {
        id: crypto.randomUUID(),
        report_type: reportType,
        title: this.getReportTitle(reportType),
        description: this.getReportDescription(reportType),
        filters,
        data,
        charts,
        generated_at: new Date(),
        generated_by: 'user',
        tenant_id: this.tenant_id!
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // دوال مساعدة خاصة

  private async generateCustomerCode(): Promise<string> {
    const prefix = 'CUS';
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id);

    return `${prefix}${String((count || 0) + 1).padStart(6, '0')}`;
  }

  private async generateTicketNumber(): Promise<string> {
    const prefix = 'TKT';
    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id);

    return `${prefix}${String((count || 0) + 1).padStart(6, '0')}`;
  }

  private getDefaultFinancialInfo(): CustomerFinancialInfo {
    return {
      credit_limit: 5000,
      payment_terms: 30,
      preferred_payment_method: 'cash',
      currency: 'KWD',
      discount_percentage: 0,
      tax_exempt: false,
      account_balance: 0,
      outstanding_balance: 0,
      credit_score: 700,
      payment_history_score: 100,
      risk_category: 'low',
      average_payment_days: 0
    };
  }

  private getDefaultPreferences(): CustomerPreferences {
    return {
      communication_channel: 'email',
      language: 'ar',
      newsletter_subscription: true,
      promotional_offers: true,
      preferred_contact_time: '09:00-17:00'
    };
  }

  private getDefaultCampaignMetrics(): CampaignMetrics {
    return {
      reach: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cost_per_click: 0,
      cost_per_conversion: 0,
      roi: 0,
      engagement_rate: 0
    };
  }

  private mapCustomerData(customer: any): CustomerProfile {
    return {
      id: customer.id,
      customer_code: customer.customer_code,
      type: customer.type,
      full_name: customer.full_name,
      company_name: customer.company_name,
      email: customer.email,
      phone: customer.phone,
      secondary_phone: customer.secondary_phone,
      address: customer.address,
      identification: customer.identification,
      financial_info: customer.financial_info,
      preferences: customer.preferences,
      lifecycle_stage: customer.lifecycle_stage,
      segments: customer.segments,
      tags: customer.tags,
      source: customer.source,
      assigned_to: customer.assigned_to,
      created_at: new Date(customer.created_at),
      updated_at: new Date(customer.updated_at),
      tenant_id: customer.tenant_id
    };
  }

  private mapOpportunityData(opportunity: any): SalesOpportunity {
    return {
      id: opportunity.id,
      customer_id: opportunity.customer_id,
      opportunity_name: opportunity.opportunity_name,
      description: opportunity.description,
      stage: opportunity.stage,
      probability: opportunity.probability,
      value: opportunity.value,
      currency: opportunity.currency,
      expected_close_date: new Date(opportunity.expected_close_date),
      actual_close_date: opportunity.actual_close_date ? new Date(opportunity.actual_close_date) : undefined,
      source: opportunity.source,
      assigned_to: opportunity.assigned_to,
      products_services: opportunity.products_services,
      competitors: opportunity.competitors,
      notes: opportunity.notes,
      created_at: new Date(opportunity.created_at),
      updated_at: new Date(opportunity.updated_at),
      tenant_id: opportunity.tenant_id
    };
  }

  private mapCampaignData(campaign: any): MarketingCampaign {
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      target_audience: campaign.target_audience,
      start_date: new Date(campaign.start_date),
      end_date: new Date(campaign.end_date),
      budget: campaign.budget,
      spent: campaign.spent,
      channels: campaign.channels,
      message: campaign.message,
      metrics: campaign.metrics,
      created_by: campaign.created_by,
      tenant_id: campaign.tenant_id
    };
  }

  private mapTicketData(ticket: any): SupportTicket {
    return {
      id: ticket.id,
      customer_id: ticket.customer_id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assigned_to: ticket.assigned_to,
      created_by: ticket.created_by,
      resolution: ticket.resolution,
      satisfaction_score: ticket.satisfaction_score,
      tags: ticket.tags,
      attachments: ticket.attachments,
      created_at: new Date(ticket.created_at),
      updated_at: new Date(ticket.updated_at),
      resolved_at: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
      tenant_id: ticket.tenant_id
    };
  }

  private async createCustomerAccount(customer: any): Promise<void> {
    // إنشاء حساب العميل في دليل الحسابات
    await supabase
      .from('customer_accounts')
      .insert({
        customer_id: customer.id,
        account_code: `1120${customer.customer_code.substring(3)}`,
        account_name: `${customer.full_name} - Customer Account`,
        account_type: 'receivable',
        balance: 0,
        tenant_id: this.tenant_id
      });
  }

  private async createContractFromOpportunity(opportunityId: string): Promise<void> {
    // إنشاء عقد من الفرصة المُغلقة بنجاح
    console.log(`Creating contract from opportunity ${opportunityId}`);
  }

  private async getCustomerContracts(customerId: string): Promise<any[]> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', this.tenant_id);

    return contracts || [];
  }

  private async getCustomerPayments(customerId: string): Promise<any[]> {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', this.tenant_id);

    return payments || [];
  }

  private async getCustomerTickets(customerId: string): Promise<any[]> {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', this.tenant_id);

    return tickets || [];
  }

  // حسابات التحليلات (محاكاة)
  private async calculateCLV(customerId: string): Promise<number> {
    // حساب قيمة دورة حياة العميل
    return 15000; // محاكاة
  }

  private async calculateAcquisitionCost(customerId: string): Promise<number> {
    return 500; // محاكاة
  }

  private async calculateChurnProbability(customerId: string): Promise<number> {
    return 0.15; // محاكاة - 15% احتمال الانقطاع
  }

  private async calculateSatisfactionScore(customerId: string): Promise<number> {
    return 8.5; // محاكاة
  }

  private async calculateLoyaltyScore(customerId: string): Promise<number> {
    return 7.8; // محاكاة
  }

  private async calculateEngagementScore(customerId: string): Promise<number> {
    return 6.5; // محاكاة
  }

  private async calculateProfitabilityScore(customerId: string): Promise<number> {
    return 8.2; // محاكاة
  }

  private async calculateRiskScore(customerId: string): Promise<number> {
    return 2.3; // محاكاة
  }

  private async determineNextBestAction(customerId: string): Promise<string> {
    return 'Send promotional offer for premium services';
  }

  private async predictCustomerActions(customerId: string): Promise<PredictedAction[]> {
    return [
      {
        action: 'Upgrade to premium package',
        probability: 0.65,
        value: 2000,
        timeframe: 'next_30_days',
        confidence: 0.78
      }
    ];
  }

  private async analyzeBehaviorPatterns(customerId: string): Promise<BehaviorPattern[]> {
    return [
      {
        pattern_name: 'Weekend Rental Preference',
        description: 'Customer prefers to rent vehicles on weekends',
        frequency: 0.8,
        last_occurrence: new Date(),
        impact: 'positive',
        suggestions: ['Offer weekend packages', 'Send weekend reminders']
      }
    ];
  }

  private async getCustomerOverviewData(filters: any): Promise<any> {
    // بيانات نظرة عامة على العملاء
    return {};
  }

  private async getCustomerOverviewCharts(data: any): Promise<ChartData[]> {
    // رسوم بيانية لنظرة عامة على العملاء
    return [];
  }

  private async getSalesPerformanceData(filters: any): Promise<any> {
    return {};
  }

  private async getSalesPerformanceCharts(data: any): Promise<ChartData[]> {
    return [];
  }

  private async getMarketingEffectivenessData(filters: any): Promise<any> {
    return {};
  }

  private async getMarketingEffectivenessCharts(data: any): Promise<ChartData[]> {
    return [];
  }

  private getReportTitle(reportType: CRMReportType): string {
    const titles = {
      [CRMReportType.CUSTOMER_OVERVIEW]: 'Customer Overview Report',
      [CRMReportType.SALES_PERFORMANCE]: 'Sales Performance Report',
      [CRMReportType.MARKETING_EFFECTIVENESS]: 'Marketing Effectiveness Report',
      [CRMReportType.CUSTOMER_SATISFACTION]: 'Customer Satisfaction Report',
      [CRMReportType.REVENUE_ANALYSIS]: 'Revenue Analysis Report',
      [CRMReportType.CUSTOMER_RETENTION]: 'Customer Retention Report',
      [CRMReportType.LEAD_CONVERSION]: 'Lead Conversion Report',
      [CRMReportType.ACTIVITY_SUMMARY]: 'Activity Summary Report',
      [CRMReportType.SUPPORT_METRICS]: 'Support Metrics Report'
    };

    return titles[reportType] || 'CRM Report';
  }

  private getReportDescription(reportType: CRMReportType): string {
    const descriptions = {
      [CRMReportType.CUSTOMER_OVERVIEW]: 'Comprehensive overview of customer base and demographics',
      [CRMReportType.SALES_PERFORMANCE]: 'Analysis of sales performance and revenue trends',
      [CRMReportType.MARKETING_EFFECTIVENESS]: 'Evaluation of marketing campaign effectiveness',
      [CRMReportType.CUSTOMER_SATISFACTION]: 'Customer satisfaction metrics and feedback analysis',
      [CRMReportType.REVENUE_ANALYSIS]: 'Detailed revenue analysis and profitability insights',
      [CRMReportType.CUSTOMER_RETENTION]: 'Customer retention rates and churn analysis',
      [CRMReportType.LEAD_CONVERSION]: 'Lead conversion rates and sales funnel analysis',
      [CRMReportType.ACTIVITY_SUMMARY]: 'Summary of customer activities and interactions',
      [CRMReportType.SUPPORT_METRICS]: 'Support ticket metrics and resolution analysis'
    };

    return descriptions[reportType] || 'CRM analytics report';
  }
}

// إنشاء مثيل مشترك
export const crmService = new CRMService(); 