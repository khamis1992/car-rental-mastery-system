export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_audit_log: {
        Row: {
          account_id: string
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          modification_request_id: string | null
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          modification_request_id?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          modification_request_id?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_audit_log_modification_request_id_fkey"
            columns: ["modification_request_id"]
            isOneToOne: false
            referencedRelation: "account_modification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      account_modification_requests: {
        Row: {
          account_id: string
          approved_at: string | null
          approver_id: string | null
          created_at: string
          current_values: Json
          expires_at: string | null
          id: string
          justification: string
          priority: string
          proposed_values: Json
          rejection_reason: string | null
          request_type: string
          requested_at: string
          requester_id: string
          reviewed_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          current_values?: Json
          expires_at?: string | null
          id?: string
          justification: string
          priority?: string
          proposed_values?: Json
          rejection_reason?: string | null
          request_type: string
          requested_at?: string
          requester_id: string
          reviewed_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          current_values?: Json
          expires_at?: string | null
          id?: string
          justification?: string
          priority?: string
          proposed_values?: Json
          rejection_reason?: string | null
          request_type?: string
          requested_at?: string
          requester_id?: string
          reviewed_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_modification_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_modification_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      account_templates: {
        Row: {
          business_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          template_name: string
          template_name_en: string | null
          template_structure: Json
          updated_at: string
        }
        Insert: {
          business_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_name: string
          template_name_en?: string | null
          template_structure: Json
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_name?: string
          template_name_en?: string | null
          template_structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      accounting_audit_trail: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      accounting_entry_locks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          journal_entry_id: string | null
          lock_type: string
          reference_id: string
          reference_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          lock_type: string
          reference_id: string
          reference_type: string
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          lock_type?: string
          reference_id?: string
          reference_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entry_locks_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_event_monitor: {
        Row: {
          created_at: string
          entity_id: string
          error_message: string | null
          event_type: string
          id: string
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_started_at: string | null
          retry_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          error_message?: string | null
          event_type: string
          id?: string
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          error_message?: string | null
          event_type?: string
          id?: string
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_templates: {
        Row: {
          auto_apply_rules: Json | null
          created_at: string | null
          created_by: string | null
          default_accounts: Json | null
          id: string
          is_active: boolean | null
          template_name: string
          template_structure: Json
          template_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_apply_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_accounts?: Json | null
          id?: string
          is_active?: boolean | null
          template_name: string
          template_structure: Json
          template_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_apply_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_accounts?: Json | null
          id?: string
          is_active?: boolean | null
          template_name?: string
          template_structure?: Json
          template_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          event_types: string[]
          id: string
          is_active: boolean
          name: string
          secret_key: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_types: string[]
          id?: string
          is_active?: boolean
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_types?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      additional_charges: {
        Row: {
          amount: number
          charge_date: string
          charge_type: string
          contract_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          documents: string[] | null
          id: string
          invoice_id: string | null
          notes: string | null
          photos: string[] | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          charge_date?: string
          charge_type: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          documents?: string[] | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          photos?: string[] | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          charge_date?: string
          charge_type?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          documents?: string[] | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          photos?: string[] | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_charges_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_charges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_charges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_accounting_settings: {
        Row: {
          id: string
          last_updated: string | null
          ministry_required: boolean | null
          setting_category: string
          setting_description: string | null
          setting_key: string
          setting_value: Json
          tenant_id: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          ministry_required?: boolean | null
          setting_category: string
          setting_description?: string | null
          setting_key: string
          setting_value: Json
          tenant_id: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          ministry_required?: boolean | null
          setting_category?: string
          setting_description?: string | null
          setting_key?: string
          setting_value?: Json
          tenant_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advanced_accounting_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_kpis: {
        Row: {
          alert_threshold_high: number | null
          alert_threshold_low: number | null
          calculation_formula: string
          calculation_period: string
          category: string
          created_at: string
          created_by: string | null
          current_value: number | null
          department_id: string | null
          id: string
          is_automated: boolean | null
          kpi_code: string
          kpi_name_ar: string
          kpi_name_en: string | null
          last_calculated_at: string | null
          previous_value: number | null
          target_value: number | null
          updated_at: string
        }
        Insert: {
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          calculation_formula: string
          calculation_period?: string
          category: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          department_id?: string | null
          id?: string
          is_automated?: boolean | null
          kpi_code: string
          kpi_name_ar: string
          kpi_name_en?: string | null
          last_calculated_at?: string | null
          previous_value?: number | null
          target_value?: number | null
          updated_at?: string
        }
        Update: {
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          calculation_formula?: string
          calculation_period?: string
          category?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          department_id?: string | null
          id?: string
          is_automated?: boolean | null
          kpi_code?: string
          kpi_name_ar?: string
          kpi_name_en?: string | null
          last_calculated_at?: string | null
          previous_value?: number | null
          target_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_kpis_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_classifications: {
        Row: {
          ai_reasoning: string | null
          approved_at: string | null
          approved_by: string | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          is_approved: boolean | null
          model_version: string | null
          suggested_account_id: string | null
          suggested_category: string
          transaction_id: string
          transaction_type: string
        }
        Insert: {
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean | null
          model_version?: string | null
          suggested_account_id?: string | null
          suggested_category: string
          transaction_id: string
          transaction_type: string
        }
        Update: {
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean | null
          model_version?: string | null
          suggested_account_id?: string | null
          suggested_category?: string
          transaction_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_classifications_suggested_account_id_fkey"
            columns: ["suggested_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          affected_accounts: string[] | null
          created_at: string
          created_by: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          insight_data: Json | null
          insight_description: string
          insight_title: string
          insight_type: string
          is_dismissed: boolean | null
          priority_level: string | null
          recommended_actions: string[] | null
        }
        Insert: {
          affected_accounts?: string[] | null
          created_at?: string
          created_by?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          insight_data?: Json | null
          insight_description: string
          insight_title: string
          insight_type: string
          is_dismissed?: boolean | null
          priority_level?: string | null
          recommended_actions?: string[] | null
        }
        Update: {
          affected_accounts?: string[] | null
          created_at?: string
          created_by?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          insight_data?: Json | null
          insight_description?: string
          insight_title?: string
          insight_type?: string
          is_dismissed?: boolean | null
          priority_level?: string | null
          recommended_actions?: string[] | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          amount: number | null
          approval_comments: string | null
          approval_level: number | null
          approval_type: string
          approved_at: string | null
          approving_department_id: string
          assigned_to: string | null
          current_approver: string | null
          expires_at: string | null
          id: string
          max_approval_level: number | null
          priority: string
          reference_id: string
          reference_table: string
          rejected_at: string | null
          rejection_reason: string | null
          request_details: Json | null
          requested_at: string
          requested_by: string
          requesting_department_id: string
          status: string
        }
        Insert: {
          amount?: number | null
          approval_comments?: string | null
          approval_level?: number | null
          approval_type: string
          approved_at?: string | null
          approving_department_id: string
          assigned_to?: string | null
          current_approver?: string | null
          expires_at?: string | null
          id?: string
          max_approval_level?: number | null
          priority?: string
          reference_id: string
          reference_table: string
          rejected_at?: string | null
          rejection_reason?: string | null
          request_details?: Json | null
          requested_at?: string
          requested_by: string
          requesting_department_id: string
          status?: string
        }
        Update: {
          amount?: number | null
          approval_comments?: string | null
          approval_level?: number | null
          approval_type?: string
          approved_at?: string | null
          approving_department_id?: string
          assigned_to?: string | null
          current_approver?: string | null
          expires_at?: string | null
          id?: string
          max_approval_level?: number | null
          priority?: string
          reference_id?: string
          reference_table?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          request_details?: Json | null
          requested_at?: string
          requested_by?: string
          requesting_department_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approving_department_id_fkey"
            columns: ["approving_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_current_approver_fkey"
            columns: ["current_approver"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_requesting_department_id_fkey"
            columns: ["requesting_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_date: string
          assignment_purpose: string | null
          assignment_status: string
          assignment_type: string
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          return_date: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_date?: string
          assignment_purpose?: string | null
          assignment_status?: string
          assignment_type?: string
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          return_date?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_date?: string
          assignment_purpose?: string | null
          assignment_status?: string
          assignment_type?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          return_date?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          category_name: string
          created_at: string
          default_depreciation_method: string
          default_residual_rate: number | null
          default_useful_life: number
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          default_depreciation_method?: string
          default_residual_rate?: number | null
          default_useful_life: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          default_depreciation_method?: string
          default_residual_rate?: number | null
          default_useful_life?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      asset_code_hierarchy: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          level: number
          name_ar: string
          name_en: string | null
          parent_code: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name_ar: string
          name_en?: string | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name_ar?: string
          name_en?: string | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_code_hierarchy_parent_code_fkey"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "asset_code_hierarchy"
            referencedColumns: ["code"]
          },
        ]
      }
      asset_depreciation: {
        Row: {
          accumulated_depreciation: number
          asset_id: string
          book_value: number
          created_at: string
          created_by: string | null
          depreciation_amount: number
          depreciation_date: string
          id: string
          journal_entry_id: string | null
          method_used: string
          notes: string | null
          period_months: number
          tenant_id: string
        }
        Insert: {
          accumulated_depreciation: number
          asset_id: string
          book_value: number
          created_at?: string
          created_by?: string | null
          depreciation_amount: number
          depreciation_date: string
          id?: string
          journal_entry_id?: string | null
          method_used: string
          notes?: string | null
          period_months?: number
          tenant_id: string
        }
        Update: {
          accumulated_depreciation?: number
          asset_id?: string
          book_value?: number
          created_at?: string
          created_by?: string | null
          depreciation_amount?: number
          depreciation_date?: string
          id?: string
          journal_entry_id?: string | null
          method_used?: string
          notes?: string | null
          period_months?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_disposal_reasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          reason_code: string
          reason_name: string
          requires_approval: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reason_code: string
          reason_name: string
          requires_approval?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reason_code?: string
          reason_name?: string
          requires_approval?: boolean | null
        }
        Relationships: []
      }
      asset_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location_code: string
          location_name: string
          phone: string | null
          responsible_person: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_code: string
          location_name: string
          phone?: string | null
          responsible_person?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_code?: string
          location_name?: string
          phone?: string | null
          responsible_person?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          completed_date: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string
          documents: string[] | null
          external_provider: string | null
          hours_spent: number | null
          id: string
          maintenance_type: string
          notes: string | null
          parts_replaced: string[] | null
          performed_by: string | null
          photos: string[] | null
          priority: string | null
          scheduled_date: string
          status: string
          tenant_id: string
          updated_at: string | null
          warranty_work: boolean | null
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          documents?: string[] | null
          external_provider?: string | null
          hours_spent?: number | null
          id?: string
          maintenance_type: string
          notes?: string | null
          parts_replaced?: string[] | null
          performed_by?: string | null
          photos?: string[] | null
          priority?: string | null
          scheduled_date: string
          status?: string
          tenant_id: string
          updated_at?: string | null
          warranty_work?: boolean | null
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          documents?: string[] | null
          external_provider?: string | null
          hours_spent?: number | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          parts_replaced?: string[] | null
          performed_by?: string | null
          photos?: string[] | null
          priority?: string | null
          scheduled_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
          warranty_work?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_movement_history: {
        Row: {
          approved_by: string | null
          asset_id: string
          created_at: string
          created_by: string | null
          from_location_id: string | null
          id: string
          movement_date: string
          movement_reason: string | null
          notes: string | null
          to_location_id: string | null
        }
        Insert: {
          approved_by?: string | null
          asset_id: string
          created_at?: string
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          movement_date?: string
          movement_reason?: string | null
          notes?: string | null
          to_location_id?: string | null
        }
        Update: {
          approved_by?: string | null
          asset_id?: string
          created_at?: string
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          movement_date?: string
          movement_reason?: string | null
          notes?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_movement_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movement_history_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "asset_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movement_history_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "asset_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transfers: {
        Row: {
          approved_by: string | null
          asset_id: string
          condition_after: string | null
          condition_before: string | null
          created_at: string | null
          created_by: string | null
          documents: string[] | null
          from_employee_id: string | null
          from_location: string | null
          id: string
          notes: string | null
          photos: string[] | null
          tenant_id: string
          to_employee_id: string | null
          to_location: string | null
          transfer_date: string
          transfer_reason: string
          transfer_status: string
        }
        Insert: {
          approved_by?: string | null
          asset_id: string
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: string[] | null
          from_employee_id?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          tenant_id: string
          to_employee_id?: string | null
          to_location?: string | null
          transfer_date: string
          transfer_reason: string
          transfer_status?: string
        }
        Update: {
          approved_by?: string | null
          asset_id?: string
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: string[] | null
          from_employee_id?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          tenant_id?: string
          to_employee_id?: string | null
          to_location?: string | null
          transfer_date?: string
          transfer_reason?: string
          transfer_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_valuations: {
        Row: {
          appraiser_license: string | null
          appraiser_name: string | null
          asset_id: string
          created_at: string | null
          created_by: string | null
          current_market_value: number | null
          id: string
          notes: string | null
          replacement_cost: number | null
          tenant_id: string
          valuation_date: string
          valuation_method: string
          valuation_report_url: string | null
        }
        Insert: {
          appraiser_license?: string | null
          appraiser_name?: string | null
          asset_id: string
          created_at?: string | null
          created_by?: string | null
          current_market_value?: number | null
          id?: string
          notes?: string | null
          replacement_cost?: number | null
          tenant_id: string
          valuation_date: string
          valuation_method: string
          valuation_report_url?: string | null
        }
        Update: {
          appraiser_license?: string | null
          appraiser_name?: string | null
          asset_id?: string
          created_at?: string | null
          created_by?: string | null
          current_market_value?: number | null
          id?: string
          notes?: string | null
          replacement_cost?: number | null
          tenant_id?: string
          valuation_date?: string
          valuation_method?: string
          valuation_report_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_valuations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_valuations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_end_time: string | null
          break_start_time: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          distance_from_office: number | null
          employee_id: string
          id: string
          location_latitude: number | null
          location_longitude: number | null
          manual_override: boolean | null
          notes: string | null
          office_location_id: string | null
          override_reason: string | null
          overtime_hours: number | null
          status: string
          tenant_id: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          distance_from_office?: number | null
          employee_id: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          manual_override?: boolean | null
          notes?: string | null
          office_location_id?: string | null
          override_reason?: string | null
          overtime_hours?: number | null
          status?: string
          tenant_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          distance_from_office?: number | null
          employee_id?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          manual_override?: boolean | null
          notes?: string | null
          office_location_id?: string | null
          override_reason?: string | null
          overtime_hours?: number | null
          status?: string
          tenant_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_settings: {
        Row: {
          allow_manual_override: boolean
          created_at: string
          created_by: string | null
          grace_period_minutes: number
          id: string
          max_distance_meters: number
          require_location: boolean
          updated_at: string
        }
        Insert: {
          allow_manual_override?: boolean
          created_at?: string
          created_by?: string | null
          grace_period_minutes?: number
          id?: string
          max_distance_meters?: number
          require_location?: boolean
          updated_at?: string
        }
        Update: {
          allow_manual_override?: boolean
          created_at?: string
          created_by?: string | null
          grace_period_minutes?: number
          id?: string
          max_distance_meters?: number
          require_location?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      auto_billing_log: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          created_by: string | null
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          tenant_id: string
          total_amount: number
          total_invoices_generated: number
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          tenant_id?: string
          total_amount?: number
          total_invoices_generated?: number
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          tenant_id?: string
          total_amount?: number
          total_invoices_generated?: number
        }
        Relationships: []
      }
      auto_billing_settings: {
        Row: {
          auto_send_invoices: boolean
          auto_send_reminders: boolean
          billing_day: number
          billing_frequency: string
          created_at: string
          created_by: string | null
          due_days: number
          enabled: boolean
          id: string
          late_fee_amount: number | null
          late_fee_enabled: boolean
          late_fee_percentage: number | null
          reminder_days_before: number
          tax_rate: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_send_invoices?: boolean
          auto_send_reminders?: boolean
          billing_day?: number
          billing_frequency?: string
          created_at?: string
          created_by?: string | null
          due_days?: number
          enabled?: boolean
          id?: string
          late_fee_amount?: number | null
          late_fee_enabled?: boolean
          late_fee_percentage?: number | null
          reminder_days_before?: number
          tax_rate?: number
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          auto_send_invoices?: boolean
          auto_send_reminders?: boolean
          billing_day?: number
          billing_frequency?: string
          created_at?: string
          created_by?: string | null
          due_days?: number
          enabled?: boolean
          id?: string
          late_fee_amount?: number | null
          late_fee_enabled?: boolean
          late_fee_percentage?: number | null
          reminder_days_before?: number
          tax_rate?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      automated_entry_executions: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          journal_entry_id: string | null
          processed_at: string | null
          reference_id: string
          reference_type: string
          rule_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          journal_entry_id?: string | null
          processed_at?: string | null
          reference_id: string
          reference_type: string
          rule_id?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          journal_entry_id?: string | null
          processed_at?: string | null
          reference_id?: string
          reference_type?: string
          rule_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_entry_executions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_entry_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automated_entry_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_entry_rules: {
        Row: {
          account_mappings: Json
          conditions: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          template_description: string | null
          tenant_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          account_mappings?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          template_description?: string | null
          tenant_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          account_mappings?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          template_description?: string | null
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_entry_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string | null
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          created_at: string
          created_by: string | null
          currency: string
          current_balance: number | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name: string
          account_number: string
          account_type?: string
          bank_name: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_imports: {
        Row: {
          bank_account_id: string
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          import_date: string
          import_status: string
          imported_by: string | null
          matched_transactions: number | null
          notes: string | null
          tenant_id: string
          total_transactions: number | null
          unmatched_transactions: number | null
          updated_at: string
        }
        Insert: {
          bank_account_id: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_date?: string
          import_status?: string
          imported_by?: string | null
          matched_transactions?: number | null
          notes?: string | null
          tenant_id: string
          total_transactions?: number | null
          unmatched_transactions?: number | null
          updated_at?: string
        }
        Update: {
          bank_account_id?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_date?: string
          import_status?: string
          imported_by?: string | null
          matched_transactions?: number | null
          notes?: string | null
          tenant_id?: string
          total_transactions?: number | null
          unmatched_transactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_imports_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_imports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_matches: {
        Row: {
          created_at: string
          id: string
          imported_transaction_id: string
          is_confirmed: boolean | null
          journal_entry_id: string
          match_amount: number
          match_confidence: number | null
          match_reason: string | null
          match_type: string
          matched_at: string
          matched_by: string
          notes: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imported_transaction_id: string
          is_confirmed?: boolean | null
          journal_entry_id: string
          match_amount: number
          match_confidence?: number | null
          match_reason?: string | null
          match_type?: string
          matched_at?: string
          matched_by: string
          notes?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imported_transaction_id?: string
          is_confirmed?: boolean | null
          journal_entry_id?: string
          match_amount?: number
          match_confidence?: number | null
          match_reason?: string | null
          match_type?: string
          matched_at?: string
          matched_by?: string
          notes?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_matches_imported_transaction_id_fkey"
            columns: ["imported_transaction_id"]
            isOneToOne: false
            referencedRelation: "imported_bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          bank_charges: number
          book_balance: number
          closing_balance: number
          created_at: string
          id: string
          interest_earned: number
          notes: string | null
          opening_balance: number
          outstanding_deposits: number
          outstanding_withdrawals: number
          prepared_by: string
          reconciled_balance: number
          reconciliation_date: string
          reconciliation_status: string
          tenant_id: string
          total_deposits: number
          total_withdrawals: number
          updated_at: string
          variance_amount: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          bank_charges?: number
          book_balance?: number
          closing_balance?: number
          created_at?: string
          id?: string
          interest_earned?: number
          notes?: string | null
          opening_balance?: number
          outstanding_deposits?: number
          outstanding_withdrawals?: number
          prepared_by: string
          reconciled_balance?: number
          reconciliation_date: string
          reconciliation_status?: string
          tenant_id: string
          total_deposits?: number
          total_withdrawals?: number
          updated_at?: string
          variance_amount?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          bank_charges?: number
          book_balance?: number
          closing_balance?: number
          created_at?: string
          id?: string
          interest_earned?: number
          notes?: string | null
          opening_balance?: number
          outstanding_deposits?: number
          outstanding_withdrawals?: number
          prepared_by?: string
          reconciled_balance?: number
          reconciliation_date?: string
          reconciliation_status?: string
          tenant_id?: string
          total_deposits?: number
          total_withdrawals?: number
          updated_at?: string
          variance_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_reports_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          balance_after: number | null
          bank_account_id: string
          created_at: string
          created_by: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          journal_entry_id: string | null
          reference_number: string | null
          status: string
          tenant_id: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          balance_after?: number | null
          bank_account_id: string
          created_at?: string
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          journal_entry_id?: string | null
          reference_number?: string | null
          status?: string
          tenant_id: string
          transaction_date: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          balance_after?: number | null
          bank_account_id?: string
          created_at?: string
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          journal_entry_id?: string | null
          reference_number?: string | null
          status?: string
          tenant_id?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_code: string
          branch_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          manager_name: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_code: string
          branch_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_code?: string
          branch_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          account_id: string
          actual_amount: number | null
          budget_id: string
          budgeted_amount: number
          created_at: string
          id: string
          item_type: string
          notes: string | null
          q1_amount: number | null
          q2_amount: number | null
          q3_amount: number | null
          q4_amount: number | null
          tenant_id: string
          updated_at: string
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          account_id: string
          actual_amount?: number | null
          budget_id: string
          budgeted_amount: number
          created_at?: string
          id?: string
          item_type: string
          notes?: string | null
          q1_amount?: number | null
          q2_amount?: number | null
          q3_amount?: number | null
          q4_amount?: number | null
          tenant_id: string
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          account_id?: string
          actual_amount?: number | null
          budget_id?: string
          budgeted_amount?: number
          created_at?: string
          id?: string
          item_type?: string
          notes?: string | null
          q1_amount?: number | null
          q2_amount?: number | null
          q3_amount?: number | null
          q4_amount?: number | null
          tenant_id?: string
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_name: string
          budget_period: string
          budget_year: number
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: string
          tenant_id: string
          total_expense_budget: number | null
          total_revenue_budget: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_name: string
          budget_period?: string
          budget_year: number
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          status?: string
          tenant_id: string
          total_expense_budget?: number | null
          total_revenue_budget?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_name?: string
          budget_period?: string
          budget_year?: number
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          total_expense_budget?: number | null
          total_revenue_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_category: string
          account_code: string
          account_name: string
          account_name_arabic: string | null
          account_name_en: string | null
          account_name_english: string | null
          account_type: string
          allow_posting: boolean | null
          auto_reconcile: boolean | null
          consolidation_account_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          current_balance: number | null
          default_cost_center_id: string | null
          first_transaction_date: string | null
          id: string
          is_active: boolean | null
          is_locked: boolean | null
          ksaap_compliant: boolean | null
          legal_reference: string | null
          level: number
          locked_at: string | null
          locked_by: string | null
          ministry_commerce_code: string | null
          modification_requires_approval: boolean | null
          notes: string | null
          opening_balance: number | null
          parent_account_id: string | null
          regulatory_code: string | null
          report_position: number | null
          required_documentation: string[] | null
          requires_cost_center: boolean | null
          tenant_id: string
          updated_at: string
          zakat_applicable: boolean | null
        }
        Insert: {
          account_category: string
          account_code: string
          account_name: string
          account_name_arabic?: string | null
          account_name_en?: string | null
          account_name_english?: string | null
          account_type: string
          allow_posting?: boolean | null
          auto_reconcile?: boolean | null
          consolidation_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          default_cost_center_id?: string | null
          first_transaction_date?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          ksaap_compliant?: boolean | null
          legal_reference?: string | null
          level?: number
          locked_at?: string | null
          locked_by?: string | null
          ministry_commerce_code?: string | null
          modification_requires_approval?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          regulatory_code?: string | null
          report_position?: number | null
          required_documentation?: string[] | null
          requires_cost_center?: boolean | null
          tenant_id?: string
          updated_at?: string
          zakat_applicable?: boolean | null
        }
        Update: {
          account_category?: string
          account_code?: string
          account_name?: string
          account_name_arabic?: string | null
          account_name_en?: string | null
          account_name_english?: string | null
          account_type?: string
          allow_posting?: boolean | null
          auto_reconcile?: boolean | null
          consolidation_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          default_cost_center_id?: string | null
          first_transaction_date?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          ksaap_compliant?: boolean | null
          legal_reference?: string | null
          level?: number
          locked_at?: string | null
          locked_by?: string | null
          ministry_commerce_code?: string | null
          modification_requires_approval?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          regulatory_code?: string | null
          report_position?: number | null
          required_documentation?: string[] | null
          requires_cost_center?: boolean | null
          tenant_id?: string
          updated_at?: string
          zakat_applicable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_consolidation_account_id_fkey"
            columns: ["consolidation_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_default_cost_center_id_fkey"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_default_cost_center_id_fkey"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts_settings: {
        Row: {
          account_code_format: Json
          allow_posting_levels: Json
          auto_code_generation: boolean
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          level_naming: Json
          max_account_levels: number
          require_parent_for_level: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_code_format?: Json
          allow_posting_levels?: Json
          auto_code_generation?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          level_naming?: Json
          max_account_levels?: number
          require_parent_for_level?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_code_format?: Json
          allow_posting_levels?: Json
          auto_code_generation?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          level_naming?: Json
          max_account_levels?: number
          require_parent_for_level?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chart_settings_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkbooks: {
        Row: {
          bank_account_id: string
          checkbook_number: string
          created_at: string | null
          created_by: string | null
          end_check_number: number
          id: string
          issue_date: string
          notes: string | null
          remaining_checks: number | null
          start_check_number: number
          status: string
          tenant_id: string
          total_checks: number
          updated_at: string | null
          used_checks: number | null
        }
        Insert: {
          bank_account_id: string
          checkbook_number: string
          created_at?: string | null
          created_by?: string | null
          end_check_number: number
          id?: string
          issue_date: string
          notes?: string | null
          remaining_checks?: number | null
          start_check_number: number
          status?: string
          tenant_id: string
          total_checks: number
          updated_at?: string | null
          used_checks?: number | null
        }
        Update: {
          bank_account_id?: string
          checkbook_number?: string
          created_at?: string | null
          created_by?: string | null
          end_check_number?: number
          id?: string
          issue_date?: string
          notes?: string | null
          remaining_checks?: number | null
          start_check_number?: number
          status?: string
          tenant_id?: string
          total_checks?: number
          updated_at?: string | null
          used_checks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_checkbooks_bank_account"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_checkbooks_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          amount: number
          bank_account_id: string
          bounced_date: string | null
          bounced_reason: string | null
          check_category: string | null
          check_date: string
          check_number: string
          check_type: string
          checkbook_id: string | null
          cleared_date: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          id: string
          journal_entry_id: string | null
          memo: string | null
          payee_account: string | null
          payee_name: string
          reference_id: string | null
          reference_type: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          bounced_date?: string | null
          bounced_reason?: string | null
          check_category?: string | null
          check_date: string
          check_number: string
          check_type?: string
          checkbook_id?: string | null
          cleared_date?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payee_account?: string | null
          payee_name: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bounced_date?: string | null
          bounced_reason?: string | null
          check_category?: string | null
          check_date?: string
          check_number?: string
          check_type?: string
          checkbook_id?: string | null
          cleared_date?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payee_account?: string | null
          payee_name?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_checks_bank_account"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_checks_checkbook"
            columns: ["checkbook_id"]
            isOneToOne: false
            referencedRelation: "checkbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_checks_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_checks_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_records: {
        Row: {
          account_number: string | null
          bank_name: string | null
          check_number: string | null
          collection_amount: number
          collection_date: string
          collection_location: string | null
          collection_notes: string | null
          collection_type: string
          collector_id: string
          created_at: string
          id: string
          payment_id: string
          reference_number: string | null
          tenant_id: string
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          check_number?: string | null
          collection_amount: number
          collection_date?: string
          collection_location?: string | null
          collection_notes?: string | null
          collection_type: string
          collector_id: string
          created_at?: string
          id?: string
          payment_id: string
          reference_number?: string | null
          tenant_id?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          check_number?: string | null
          collection_amount?: number
          collection_date?: string
          collection_location?: string | null
          collection_notes?: string | null
          collection_type?: string
          collector_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          reference_number?: string | null
          tenant_id?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_records_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_invoice_items: {
        Row: {
          additional_charges: number | null
          collective_invoice_id: string
          contract_id: string
          created_at: string
          customer_id: string
          discount_amount: number | null
          id: string
          individual_invoice_id: string | null
          rental_amount: number
          rental_days: number
          tax_amount: number | null
          tenant_id: string
          total_amount: number
        }
        Insert: {
          additional_charges?: number | null
          collective_invoice_id: string
          contract_id: string
          created_at?: string
          customer_id: string
          discount_amount?: number | null
          id?: string
          individual_invoice_id?: string | null
          rental_amount: number
          rental_days: number
          tax_amount?: number | null
          tenant_id?: string
          total_amount: number
        }
        Update: {
          additional_charges?: number | null
          collective_invoice_id?: string
          contract_id?: string
          created_at?: string
          customer_id?: string
          discount_amount?: number | null
          id?: string
          individual_invoice_id?: string | null
          rental_amount?: number
          rental_days?: number
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "collective_invoice_items_collective_invoice_id_fkey"
            columns: ["collective_invoice_id"]
            isOneToOne: false
            referencedRelation: "collective_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_invoice_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_invoice_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_invoice_items_individual_invoice_id_fkey"
            columns: ["individual_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_invoice_payments: {
        Row: {
          allocation_amount: number
          collective_invoice_id: string
          created_at: string
          id: string
          payment_id: string
          tenant_id: string
        }
        Insert: {
          allocation_amount: number
          collective_invoice_id: string
          created_at?: string
          id?: string
          payment_id: string
          tenant_id?: string
        }
        Update: {
          allocation_amount?: number
          collective_invoice_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collective_invoice_payments_collective_invoice_id_fkey"
            columns: ["collective_invoice_id"]
            isOneToOne: false
            referencedRelation: "collective_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_invoice_payments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_invoices: {
        Row: {
          auto_generated: boolean | null
          billing_period_end: string
          billing_period_start: string
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_number: string
          net_amount: number
          notes: string | null
          status: string
          tax_amount: number
          tenant_id: string
          total_amount: number
          total_contracts: number
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean | null
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_number: string
          net_amount?: number
          notes?: string | null
          status?: string
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          total_contracts?: number
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean | null
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          net_amount?: number
          notes?: string | null
          status?: string
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          total_contracts?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_branding: {
        Row: {
          address_ar: string | null
          address_en: string | null
          commercial_registration: string | null
          company_name_ar: string | null
          company_name_en: string | null
          created_at: string
          created_by: string | null
          email: string | null
          footer_height: number | null
          footer_image_url: string | null
          header_height: number | null
          header_image_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          phone: string | null
          show_footer: boolean | null
          show_header: boolean | null
          tax_number: string | null
          tenant_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          commercial_registration?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          footer_height?: number | null
          footer_image_url?: string | null
          header_height?: number | null
          header_image_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          phone?: string | null
          show_footer?: boolean | null
          show_header?: boolean | null
          tax_number?: string | null
          tenant_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          commercial_registration?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          footer_height?: number | null
          footer_image_url?: string | null
          header_height?: number | null
          header_image_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          phone?: string | null
          show_footer?: boolean | null
          show_header?: boolean | null
          tax_number?: string | null
          tenant_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_report_items: {
        Row: {
          account_code: string
          account_id: string
          account_name: string
          analysis_notes: string | null
          comparison_period_amount: number | null
          created_at: string | null
          id: string
          primary_period_amount: number | null
          report_id: string
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          account_code: string
          account_id: string
          account_name: string
          analysis_notes?: string | null
          comparison_period_amount?: number | null
          created_at?: string | null
          id?: string
          primary_period_amount?: number | null
          report_id: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          account_code?: string
          account_id?: string
          account_name?: string
          analysis_notes?: string | null
          comparison_period_amount?: number | null
          created_at?: string | null
          id?: string
          primary_period_amount?: number | null
          report_id?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comparison_report_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "comparison_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_reports: {
        Row: {
          comparison_period_end: string
          comparison_period_start: string
          created_at: string | null
          created_by: string | null
          id: string
          primary_period_end: string
          primary_period_start: string
          report_data: Json
          report_name: string
          report_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          comparison_period_end: string
          comparison_period_start: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          primary_period_end: string
          primary_period_start: string
          report_data?: Json
          report_name: string
          report_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          comparison_period_end?: string
          comparison_period_start?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          primary_period_end?: string
          primary_period_start?: string
          report_data?: Json
          report_name?: string
          report_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_accounting_entries: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          created_by: string | null
          entry_type: string
          id: string
          journal_entry_id: string
          notes: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          entry_type: string
          id?: string
          journal_entry_id: string
          notes?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          entry_type?: string
          id?: string
          journal_entry_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_accounting_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_accounting_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_deletion_log: {
        Row: {
          contract_id: string
          contract_number: string
          created_at: string
          deleted_at: string
          deleted_by: string | null
          deletion_reason: string | null
          deletion_type: string
          id: string
          related_records_deleted: Json | null
        }
        Insert: {
          contract_id: string
          contract_number: string
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_type: string
          id?: string
          related_records_deleted?: Json | null
        }
        Update: {
          contract_id?: string
          contract_number?: string
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_type?: string
          id?: string
          related_records_deleted?: Json | null
        }
        Relationships: []
      }
      contract_extensions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          daily_rate: number
          extension_amount: number
          extension_days: number
          id: string
          new_end_date: string
          original_end_date: string
          reason: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          daily_rate: number
          extension_amount: number
          extension_days: number
          id?: string
          new_end_date: string
          original_end_date: string
          reason?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          daily_rate?: number
          extension_amount?: number
          extension_days?: number
          id?: string
          new_end_date?: string
          original_end_date?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_extensions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_incidents: {
        Row: {
          contract_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          customer_liable: boolean | null
          description: string
          id: string
          incident_date: string
          incident_type: string
          insurance_claim_number: string | null
          insurance_covered: boolean | null
          location: string | null
          photos: string[] | null
          police_report_number: string | null
          resolution_notes: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          customer_liable?: boolean | null
          description: string
          id?: string
          incident_date: string
          incident_type: string
          insurance_claim_number?: string | null
          insurance_covered?: boolean | null
          location?: string | null
          photos?: string[] | null
          police_report_number?: string | null
          resolution_notes?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          customer_liable?: boolean | null
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          insurance_claim_number?: string | null
          insurance_covered?: boolean | null
          location?: string | null
          photos?: string[] | null
          police_report_number?: string | null
          resolution_notes?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_incidents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          company_signature: string | null
          company_signed_at: string | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_signature: string | null
          customer_signed_at: string | null
          daily_rate: number
          delivery_completed_at: string | null
          discount_amount: number | null
          end_date: string
          final_amount: number
          fuel_level_pickup: string | null
          fuel_level_return: string | null
          id: string
          insurance_amount: number | null
          journal_entry_id: string | null
          notes: string | null
          payment_registered_at: string | null
          pickup_condition_notes: string | null
          pickup_damages: Json | null
          pickup_location: string | null
          pickup_mileage: number | null
          pickup_photos: string[] | null
          quotation_id: string | null
          rental_days: number
          return_condition_notes: string | null
          return_damages: Json | null
          return_location: string | null
          return_mileage: number | null
          return_photos: string[] | null
          sales_person_id: string | null
          security_deposit: number | null
          special_conditions: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          tax_amount: number | null
          tenant_id: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          company_signature?: string | null
          company_signed_at?: string | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_signature?: string | null
          customer_signed_at?: string | null
          daily_rate: number
          delivery_completed_at?: string | null
          discount_amount?: number | null
          end_date: string
          final_amount: number
          fuel_level_pickup?: string | null
          fuel_level_return?: string | null
          id?: string
          insurance_amount?: number | null
          journal_entry_id?: string | null
          notes?: string | null
          payment_registered_at?: string | null
          pickup_condition_notes?: string | null
          pickup_damages?: Json | null
          pickup_location?: string | null
          pickup_mileage?: number | null
          pickup_photos?: string[] | null
          quotation_id?: string | null
          rental_days: number
          return_condition_notes?: string | null
          return_damages?: Json | null
          return_location?: string | null
          return_mileage?: number | null
          return_photos?: string[] | null
          sales_person_id?: string | null
          security_deposit?: number | null
          special_conditions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          tax_amount?: number | null
          tenant_id?: string
          terms_and_conditions?: string | null
          total_amount: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          company_signature?: string | null
          company_signed_at?: string | null
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_signature?: string | null
          customer_signed_at?: string | null
          daily_rate?: number
          delivery_completed_at?: string | null
          discount_amount?: number | null
          end_date?: string
          final_amount?: number
          fuel_level_pickup?: string | null
          fuel_level_return?: string | null
          id?: string
          insurance_amount?: number | null
          journal_entry_id?: string | null
          notes?: string | null
          payment_registered_at?: string | null
          pickup_condition_notes?: string | null
          pickup_damages?: Json | null
          pickup_location?: string | null
          pickup_mileage?: number | null
          pickup_photos?: string[] | null
          quotation_id?: string | null
          rental_days?: number
          return_condition_notes?: string | null
          return_damages?: Json | null
          return_location?: string | null
          return_mileage?: number | null
          return_photos?: string[] | null
          sales_person_id?: string | null
          security_deposit?: number | null
          special_conditions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          tax_amount?: number | null
          tenant_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_allocations: {
        Row: {
          allocation_amount: number | null
          allocation_date: string | null
          allocation_percentage: number | null
          cost_center_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          reference_id: string
          reference_type: string
          updated_at: string | null
        }
        Insert: {
          allocation_amount?: number | null
          allocation_date?: string | null
          allocation_percentage?: number | null
          cost_center_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id: string
          reference_type: string
          updated_at?: string | null
        }
        Update: {
          allocation_amount?: number | null
          allocation_date?: string | null
          allocation_percentage?: number | null
          cost_center_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string
          reference_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_budget_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          budget_amount: number
          cost_center_id: string
          created_at: string | null
          current_spent: number
          id: string
          is_read: boolean | null
          read_at: string | null
          read_by: string | null
          tenant_id: string
          threshold_percentage: number
        }
        Insert: {
          alert_message: string
          alert_type: string
          budget_amount: number
          cost_center_id: string
          created_at?: string | null
          current_spent: number
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          tenant_id: string
          threshold_percentage: number
        }
        Update: {
          alert_message?: string
          alert_type?: string
          budget_amount?: number
          cost_center_id?: string
          created_at?: string | null
          current_spent?: number
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          tenant_id?: string
          threshold_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_budget_alerts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_budget_alerts_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_budget_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cost_center_budget_alerts_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_budgets: {
        Row: {
          account_id: string | null
          annual_actual: number | null
          annual_budget: number | null
          approved_at: string | null
          approved_by: string | null
          budget_version: number | null
          budget_year: number
          cost_center_id: string
          created_at: string | null
          created_by: string | null
          id: string
          q1_actual: number | null
          q1_budget: number | null
          q2_actual: number | null
          q2_budget: number | null
          q3_actual: number | null
          q3_budget: number | null
          q4_actual: number | null
          q4_budget: number | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          annual_actual?: number | null
          annual_budget?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_version?: number | null
          budget_year: number
          cost_center_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          q1_actual?: number | null
          q1_budget?: number | null
          q2_actual?: number | null
          q2_budget?: number | null
          q3_actual?: number | null
          q3_budget?: number | null
          q4_actual?: number | null
          q4_budget?: number | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          annual_actual?: number | null
          annual_budget?: number | null
          approved_at?: string | null
          approved_by?: string | null
          budget_version?: number | null
          budget_year?: number
          cost_center_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          q1_actual?: number | null
          q1_budget?: number | null
          q2_actual?: number | null
          q2_budget?: number | null
          q3_actual?: number | null
          q3_budget?: number | null
          q4_actual?: number | null
          q4_budget?: number | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_budgets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_budgets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_budgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_history: {
        Row: {
          action_type: string
          change_date: string | null
          changed_by: string | null
          cost_center_id: string
          id: string
          new_values: Json | null
          notes: string | null
          previous_values: Json | null
        }
        Insert: {
          action_type: string
          change_date?: string | null
          changed_by?: string | null
          cost_center_id: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          previous_values?: Json | null
        }
        Update: {
          action_type?: string
          change_date?: string | null
          changed_by?: string | null
          cost_center_id?: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          previous_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_history_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_history_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          requires_restart: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          actual_spent: number | null
          approval_workflow: Json | null
          auto_alerts: boolean | null
          budget_amount: number | null
          budget_version: number | null
          business_unit: string | null
          cost_center_category: string | null
          cost_center_code: string
          cost_center_name: string
          cost_center_name_en: string | null
          cost_center_type: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          hierarchy_path: string | null
          id: string
          is_active: boolean | null
          level: number | null
          manager_id: string | null
          ministry_classification: string | null
          parent_id: string | null
          profit_center_code: string | null
          reporting_manager_id: string | null
          requires_pre_approval: boolean | null
          tenant_id: string
          updated_at: string
          variance_threshold: number | null
        }
        Insert: {
          actual_spent?: number | null
          approval_workflow?: Json | null
          auto_alerts?: boolean | null
          budget_amount?: number | null
          budget_version?: number | null
          business_unit?: string | null
          cost_center_category?: string | null
          cost_center_code: string
          cost_center_name: string
          cost_center_name_en?: string | null
          cost_center_type?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          hierarchy_path?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          manager_id?: string | null
          ministry_classification?: string | null
          parent_id?: string | null
          profit_center_code?: string | null
          reporting_manager_id?: string | null
          requires_pre_approval?: boolean | null
          tenant_id: string
          updated_at?: string
          variance_threshold?: number | null
        }
        Update: {
          actual_spent?: number | null
          approval_workflow?: Json | null
          auto_alerts?: boolean | null
          budget_amount?: number | null
          budget_version?: number | null
          business_unit?: string | null
          cost_center_category?: string | null
          cost_center_code?: string
          cost_center_name?: string
          cost_center_name_en?: string | null
          cost_center_type?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          hierarchy_path?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          manager_id?: string | null
          ministry_classification?: string | null
          parent_id?: string | null
          profit_center_code?: string | null
          reporting_manager_id?: string | null
          requires_pre_approval?: boolean | null
          tenant_id?: string
          updated_at?: string
          variance_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          base_currency: boolean | null
          central_bank_rate: number | null
          created_at: string | null
          created_by: string | null
          currency_code: string
          currency_name_ar: string
          currency_name_en: string | null
          decimal_places: number | null
          exchange_rate: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          symbol: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          base_currency?: boolean | null
          central_bank_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_code: string
          currency_name_ar: string
          currency_name_en?: string | null
          decimal_places?: number | null
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          symbol: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          base_currency?: boolean | null
          central_bank_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string
          currency_name_ar?: string
          currency_name_en?: string | null
          decimal_places?: number | null
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          symbol?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "currencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_aging_analysis: {
        Row: {
          analysis_date: string
          created_at: string | null
          created_by: string | null
          current_amount: number | null
          customer_id: string
          days_30_60: number | null
          days_61_90: number | null
          days_91_120: number | null
          id: string
          oldest_invoice_date: string | null
          over_120_days: number | null
          tenant_id: string
          total_outstanding: number | null
        }
        Insert: {
          analysis_date: string
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          customer_id: string
          days_30_60?: number | null
          days_61_90?: number | null
          days_91_120?: number | null
          id?: string
          oldest_invoice_date?: string | null
          over_120_days?: number | null
          tenant_id: string
          total_outstanding?: number | null
        }
        Update: {
          analysis_date?: string
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          customer_id?: string
          days_30_60?: number | null
          days_61_90?: number | null
          days_91_120?: number | null
          id?: string
          oldest_invoice_date?: string | null
          over_120_days?: number | null
          tenant_id?: string
          total_outstanding?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_aging_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_aging_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_evaluations: {
        Row: {
          comments: string | null
          communication: number | null
          contract_id: string | null
          created_at: string
          customer_id: string
          evaluated_by: string | null
          id: string
          overall_rating: number | null
          payment_reliability: number | null
          vehicle_care: number | null
        }
        Insert: {
          comments?: string | null
          communication?: number | null
          contract_id?: string | null
          created_at?: string
          customer_id: string
          evaluated_by?: string | null
          id?: string
          overall_rating?: number | null
          payment_reliability?: number | null
          vehicle_care?: number | null
        }
        Update: {
          comments?: string | null
          communication?: number | null
          contract_id?: string | null
          created_at?: string
          customer_id?: string
          evaluated_by?: string | null
          id?: string
          overall_rating?: number | null
          payment_reliability?: number | null
          vehicle_care?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_evaluations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_history: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          notes: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          id?: string
          notes?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_statements: {
        Row: {
          closing_balance: number | null
          customer_id: string
          from_date: string
          generated_at: string | null
          generated_by: string | null
          id: string
          opening_balance: number | null
          statement_data: Json
          statement_date: string
          status: string | null
          tenant_id: string
          to_date: string
          total_credits: number | null
          total_debits: number | null
        }
        Insert: {
          closing_balance?: number | null
          customer_id: string
          from_date: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          opening_balance?: number | null
          statement_data?: Json
          statement_date: string
          status?: string | null
          tenant_id: string
          to_date: string
          total_credits?: number | null
          total_debits?: number | null
        }
        Update: {
          closing_balance?: number | null
          customer_id?: string
          from_date?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          opening_balance?: number | null
          statement_data?: Json
          statement_date?: string
          status?: string | null
          tenant_id?: string
          to_date?: string
          total_credits?: number | null
          total_debits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_statements_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_statements_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subsidiary_ledger: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_amount: number | null
          customer_id: string
          debit_amount: number | null
          description: string
          id: string
          journal_entry_id: string
          reference_id: string | null
          reference_type: string
          running_balance: number | null
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          customer_id: string
          debit_amount?: number | null
          description: string
          id?: string
          journal_entry_id: string
          reference_id?: string | null
          reference_type: string
          running_balance?: number | null
          tenant_id: string
          transaction_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          customer_id?: string
          debit_amount?: number | null
          description?: string
          id?: string
          journal_entry_id?: string
          reference_id?: string | null
          reference_type?: string
          running_balance?: number | null
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_subsidiary_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_subsidiary_journal"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_subsidiary_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tracking_settings: {
        Row: {
          aging_analysis_frequency: string | null
          aging_thresholds: Json | null
          auto_generate_statements: boolean | null
          auto_send_statements: boolean | null
          created_at: string | null
          created_by: string | null
          credit_limit_alerts: boolean | null
          id: string
          overdue_payment_alerts: boolean | null
          statement_email_template: string | null
          statement_frequency: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          aging_analysis_frequency?: string | null
          aging_thresholds?: Json | null
          auto_generate_statements?: boolean | null
          auto_send_statements?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credit_limit_alerts?: boolean | null
          id?: string
          overdue_payment_alerts?: boolean | null
          statement_email_template?: string | null
          statement_frequency?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          aging_analysis_frequency?: string | null
          aging_thresholds?: Json | null
          auto_generate_statements?: boolean | null
          auto_send_statements?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credit_limit_alerts?: boolean | null
          id?: string
          overdue_payment_alerts?: boolean | null
          statement_email_template?: string | null
          statement_frequency?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_tracking_settings_tenant"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_transaction_log: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_by: string | null
          customer_id: string
          description: string
          id: string
          journal_entry_id: string | null
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_by?: string | null
          customer_id: string
          description: string
          id?: string
          journal_entry_id?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          journal_entry_id?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_transaction_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_transaction_journal"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_transaction_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_violations: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          notes: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
          violation_date: string
          violation_type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          notes?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string
          violation_date: string
          violation_type: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          notes?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          violation_date?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_violations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_violations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_contact_person: string | null
          company_registration_number: string | null
          country: string | null
          created_at: string
          created_by: string | null
          customer_number: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string | null
          id: string
          last_contract_date: string | null
          name: string
          national_id: string | null
          notes: string | null
          phone: string
          rating: number | null
          status: Database["public"]["Enums"]["customer_status"]
          tax_number: string | null
          tenant_id: string
          total_contracts: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_contact_person?: string | null
          company_registration_number?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_number: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          last_contract_date?: string | null
          name: string
          national_id?: string | null
          notes?: string | null
          phone: string
          rating?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tenant_id?: string
          total_contracts?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_contact_person?: string | null
          company_registration_number?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_number?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          last_contract_date?: string | null
          name?: string
          national_id?: string | null
          notes?: string | null
          phone?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_number?: string | null
          tenant_id?: string
          total_contracts?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          assigned_to_all: boolean
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          due_time: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_all?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_all?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_access_rules: {
        Row: {
          access_conditions: Json
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          is_active: boolean
          role_name: string | null
          rule_name: string
          table_name: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          access_conditions?: Json
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          role_name?: string | null
          rule_name: string
          table_name: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          access_conditions?: Json
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          role_name?: string | null
          rule_name?: string
          table_name?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_access_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_operation_logs: {
        Row: {
          id: string
          ip_address: string | null
          metadata: Json | null
          operation_type: string
          table_name: string
          tenant_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          operation_type: string
          table_name: string
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          operation_type?: string
          table_name?: string
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_operation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      department_integrations: {
        Row: {
          assigned_employee_id: string | null
          completion_date: string | null
          created_at: string
          created_by: string | null
          department_id: string
          due_date: string | null
          id: string
          integration_type: string
          metadata: Json | null
          notes: string | null
          priority_level: number | null
          reference_id: string
          reference_table: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id: string
          due_date?: string | null
          id?: string
          integration_type: string
          metadata?: Json | null
          notes?: string | null
          priority_level?: number | null
          reference_id: string
          reference_table: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string
          due_date?: string | null
          id?: string
          integration_type?: string
          metadata?: Json | null
          notes?: string | null
          priority_level?: number | null
          reference_id?: string
          reference_table?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_integrations_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_integrations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          created_by: string | null
          department_code: string
          department_name: string
          department_name_en: string | null
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_code: string
          department_name: string
          department_name_en?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_code?: string
          department_name?: string
          department_name_en?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_attachments: {
        Row: {
          created_at: string
          document_category: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_required: boolean | null
          notes: string | null
          reference_id: string
          reference_type: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_category?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          reference_id: string
          reference_type: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_category?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          reference_id?: string
          reference_type?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_review_checklist: {
        Row: {
          approval_workflow: Json | null
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          is_active: boolean | null
          required_documents: Json
          review_points: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_workflow?: Json | null
          created_at?: string
          created_by?: string | null
          entry_type: string
          id?: string
          is_active?: boolean | null
          required_documents?: Json
          review_points?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_workflow?: Json | null
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          is_active?: boolean | null
          required_documents?: Json
          review_points?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_checklist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          branch_id: string | null
          created_at: string | null
          current_number: number | null
          document_type: string
          id: string
          is_active: boolean | null
          last_reset: string | null
          padding_length: number | null
          prefix: string | null
          reset_annually: boolean | null
          reset_monthly: boolean | null
          suffix: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          current_number?: number | null
          document_type: string
          id?: string
          is_active?: boolean | null
          last_reset?: string | null
          padding_length?: number | null
          prefix?: string | null
          reset_annually?: boolean | null
          reset_monthly?: boolean | null
          suffix?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          current_number?: number | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          last_reset?: string | null
          padding_length?: number | null
          prefix?: string | null
          reset_annually?: boolean | null
          reset_monthly?: boolean | null
          suffix?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sequences_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "enhanced_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verifications: {
        Row: {
          created_at: string
          dns_records: Json | null
          domain: string
          error_message: string | null
          expires_at: string
          id: string
          last_checked_at: string | null
          tenant_id: string
          updated_at: string
          verification_type: string
          verification_value: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_records?: Json | null
          domain: string
          error_message?: string | null
          expires_at?: string
          id?: string
          last_checked_at?: string | null
          tenant_id: string
          updated_at?: string
          verification_type?: string
          verification_value: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_records?: Json | null
          domain?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          last_checked_at?: string | null
          tenant_id?: string
          updated_at?: string
          verification_type?: string
          verification_value?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_training_progress: {
        Row: {
          attempts_count: number
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          last_accessed_at: string | null
          material_id: string
          notes: string | null
          progress_percentage: number
          score: number | null
          started_at: string | null
          status: string
          time_spent_minutes: number
          updated_at: string
        }
        Insert: {
          attempts_count?: number
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          last_accessed_at?: string | null
          material_id: string
          notes?: string | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number
          updated_at?: string
        }
        Update: {
          attempts_count?: number
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          last_accessed_at?: string | null
          material_id?: string
          notes?: string | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string
          created_by: string | null
          department: string
          department_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          manager_id: string | null
          national_id: string | null
          phone: string | null
          position: string
          primary_cost_center_id: string | null
          salary: number
          secondary_cost_center_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
          work_location_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          manager_id?: string | null
          national_id?: string | null
          phone?: string | null
          position: string
          primary_cost_center_id?: string | null
          salary: number
          secondary_cost_center_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          work_location_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          national_id?: string | null
          phone?: string | null
          position?: string
          primary_cost_center_id?: string | null
          salary?: number
          secondary_cost_center_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          work_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_primary_cost_center_id_fkey"
            columns: ["primary_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_primary_cost_center_id_fkey"
            columns: ["primary_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_secondary_cost_center_id_fkey"
            columns: ["secondary_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_secondary_cost_center_id_fkey"
            columns: ["secondary_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_branches: {
        Row: {
          address_ar: string | null
          address_en: string | null
          branch_code: string
          branch_name_ar: string
          branch_name_en: string | null
          branch_type: string | null
          city: string | null
          commercial_registration: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          established_date: string | null
          fax: string | null
          financial_year_start: number | null
          governorate: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          parent_branch_id: string | null
          phone: string | null
          po_box: string | null
          postal_code: string | null
          reporting_currency: string | null
          tax_registration: string | null
          tenant_id: string
          updated_at: string | null
          website: string | null
          zakat_number: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          branch_code: string
          branch_name_ar: string
          branch_name_en?: string | null
          branch_type?: string | null
          city?: string | null
          commercial_registration?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          established_date?: string | null
          fax?: string | null
          financial_year_start?: number | null
          governorate?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          parent_branch_id?: string | null
          phone?: string | null
          po_box?: string | null
          postal_code?: string | null
          reporting_currency?: string | null
          tax_registration?: string | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
          zakat_number?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          branch_code?: string
          branch_name_ar?: string
          branch_name_en?: string | null
          branch_type?: string | null
          city?: string | null
          commercial_registration?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          established_date?: string | null
          fax?: string | null
          financial_year_start?: number | null
          governorate?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          parent_branch_id?: string | null
          phone?: string | null
          po_box?: string | null
          postal_code?: string | null
          reporting_currency?: string | null
          tax_registration?: string | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
          zakat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_branches_parent_branch_id_fkey"
            columns: ["parent_branch_id"]
            isOneToOne: false
            referencedRelation: "enhanced_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_date: string
          from_currency: string
          id: string
          rate: number
          source: string | null
          tenant_id: string
          to_currency: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_date: string
          from_currency: string
          id?: string
          rate: number
          source?: string | null
          tenant_id: string
          to_currency: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          from_currency?: string
          id?: string
          rate?: number
          source?: string | null
          tenant_id?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string | null
          expense_voucher_id: string
          id: string
          required_amount_limit: number | null
          status: string | null
        }
        Insert: {
          approval_level?: number
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string | null
          expense_voucher_id: string
          id?: string
          required_amount_limit?: number | null
          status?: string | null
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          expense_voucher_id?: string
          id?: string
          required_amount_limit?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_approvals_approver"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_approvals_voucher"
            columns: ["expense_voucher_id"]
            isOneToOne: false
            referencedRelation: "expense_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          account_id: string | null
          approval_limit: number | null
          category_code: string
          category_name_ar: string
          category_name_en: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_category_id: string | null
          requires_approval: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          approval_limit?: number | null
          category_code: string
          category_name_ar: string
          category_name_en?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          requires_approval?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          approval_limit?: number | null
          category_code?: string
          category_name_ar?: string
          category_name_en?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          requires_approval?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_categories_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_categories_parent"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_categories_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_beneficiary_type: string | null
          default_cost_center_id: string | null
          default_payment_method: string | null
          id: string
          is_active: boolean | null
          template_description: string | null
          template_items: Json
          template_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_beneficiary_type?: string | null
          default_cost_center_id?: string | null
          default_payment_method?: string | null
          id?: string
          is_active?: boolean | null
          template_description?: string | null
          template_items?: Json
          template_name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_beneficiary_type?: string | null
          default_cost_center_id?: string | null
          default_payment_method?: string | null
          id?: string
          is_active?: boolean | null
          template_description?: string | null
          template_items?: Json
          template_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_templates_cost_center"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_templates_cost_center"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_templates_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_voucher_items: {
        Row: {
          account_id: string
          created_at: string
          description: string
          expense_voucher_id: string
          id: string
          quantity: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          account_id: string
          created_at?: string
          description: string
          expense_voucher_id: string
          id?: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string
          expense_voucher_id?: string
          id?: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_voucher_items_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_voucher_items_voucher"
            columns: ["expense_voucher_id"]
            isOneToOne: false
            referencedRelation: "expense_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_vouchers: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachments: string[] | null
          bank_account_id: string | null
          check_date: string | null
          check_number: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_amount: number | null
          expense_category: string
          expense_subcategory: string | null
          id: string
          journal_entry_id: string | null
          net_amount: number
          notes: string | null
          payment_method: string
          supplier_id: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number
          updated_at: string
          voucher_date: string
          voucher_number: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          bank_account_id?: string | null
          check_date?: string | null
          check_number?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          expense_category: string
          expense_subcategory?: string | null
          id?: string
          journal_entry_id?: string | null
          net_amount: number
          notes?: string | null
          payment_method?: string
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
          updated_at?: string
          voucher_date?: string
          voucher_number: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          bank_account_id?: string | null
          check_date?: string | null
          check_number?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          expense_category?: string
          expense_subcategory?: string | null
          id?: string
          journal_entry_id?: string | null
          net_amount?: number
          notes?: string | null
          payment_method?: string
          supplier_id?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_expense_vouchers_bank_account"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_vouchers_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_vouchers_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_vouchers_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_vouchers_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      export_history: {
        Row: {
          export_format: string
          exported_at: string | null
          exported_by: string | null
          file_path: string | null
          file_size: number | null
          id: string
          parameters: Json | null
          report_id: string | null
          report_type: string
          tenant_id: string
        }
        Insert: {
          export_format: string
          exported_at?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          parameters?: Json | null
          report_id?: string | null
          report_type: string
          tenant_id: string
        }
        Update: {
          export_format?: string
          exported_at?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          parameters?: Json | null
          report_id?: string | null
          report_type?: string
          tenant_id?: string
        }
        Relationships: []
      }
      external_integrations: {
        Row: {
          api_key_name: string | null
          configuration: Json | null
          created_at: string
          created_by: string | null
          department_id: string | null
          endpoint_url: string | null
          error_count: number | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean | null
          last_error: string | null
          last_sync_at: string | null
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          api_key_name?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          endpoint_url?: string | null
          error_count?: number | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          api_key_name?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          endpoint_url?: string | null
          error_count?: number | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_comparisons: {
        Row: {
          base_period_end: string
          base_period_start: string
          comparison_data: Json | null
          comparison_name: string
          comparison_period_end: string
          comparison_period_start: string
          created_at: string | null
          created_by: string | null
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          base_period_end: string
          base_period_start: string
          comparison_data?: Json | null
          comparison_name: string
          comparison_period_end: string
          comparison_period_start: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          base_period_end?: string
          base_period_start?: string
          comparison_data?: Json | null
          comparison_name?: string
          comparison_period_end?: string
          comparison_period_start?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_comparisons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_forecasts: {
        Row: {
          accuracy_score: number | null
          confidence_interval_high: number | null
          confidence_interval_low: number | null
          created_at: string
          created_by: string | null
          current_value: number | null
          forecast_period: string
          forecast_type: string
          id: string
          input_features: Json | null
          model_used: string | null
          period_type: string
          predicted_value: number
        }
        Insert: {
          accuracy_score?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          forecast_period: string
          forecast_type: string
          id?: string
          input_features?: Json | null
          model_used?: string | null
          period_type: string
          predicted_value: number
        }
        Update: {
          accuracy_score?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          forecast_period?: string
          forecast_type?: string
          id?: string
          input_features?: Json | null
          model_used?: string | null
          period_type?: string
          predicted_value?: number
        }
        Relationships: []
      }
      financial_kpis: {
        Row: {
          calculation_method: string | null
          created_at: string
          created_by: string | null
          id: string
          kpi_category: string
          kpi_name: string
          kpi_target: number | null
          kpi_unit: string | null
          kpi_value: number
          notes: string | null
          period_date: string
        }
        Insert: {
          calculation_method?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kpi_category: string
          kpi_name: string
          kpi_target?: number | null
          kpi_unit?: string | null
          kpi_value: number
          notes?: string | null
          period_date: string
        }
        Update: {
          calculation_method?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kpi_category?: string
          kpi_name?: string
          kpi_target?: number | null
          kpi_unit?: string | null
          kpi_value?: number
          notes?: string | null
          period_date?: string
        }
        Relationships: []
      }
      financial_performance: {
        Row: {
          calculated_at: string
          created_by: string | null
          expense_ratio: number | null
          gross_profit: number | null
          id: string
          net_profit: number | null
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          profit_margin: number | null
          revenue_growth: number | null
          total_expenses: number | null
          total_revenue: number | null
        }
        Insert: {
          calculated_at?: string
          created_by?: string | null
          expense_ratio?: number | null
          gross_profit?: number | null
          id?: string
          net_profit?: number | null
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          profit_margin?: number | null
          revenue_growth?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
        }
        Update: {
          calculated_at?: string
          created_by?: string | null
          expense_ratio?: number | null
          gross_profit?: number | null
          id?: string
          net_profit?: number | null
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          profit_margin?: number | null
          revenue_growth?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      financial_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_reason: string | null
          created_at: string
          created_by: string | null
          end_date: string
          fiscal_year: number
          id: string
          is_closed: boolean | null
          is_locked: boolean | null
          period_name: string
          reopened_at: string | null
          reopened_by: string | null
          reopening_reason: string | null
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_reason?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          fiscal_year: number
          id?: string
          is_closed?: boolean | null
          is_locked?: boolean | null
          period_name: string
          reopened_at?: string | null
          reopened_by?: string | null
          reopening_reason?: string | null
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_reason?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          fiscal_year?: number
          id?: string
          is_closed?: boolean | null
          is_locked?: boolean | null
          period_name?: string
          reopened_at?: string | null
          reopened_by?: string | null
          reopening_reason?: string | null
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_report_templates: {
        Row: {
          auto_generate: boolean | null
          created_at: string | null
          created_by: string | null
          generation_frequency: string | null
          id: string
          is_active: boolean | null
          last_generated: string | null
          legal_requirement: boolean | null
          ministry_format: boolean | null
          report_name: string
          report_structure: Json
          report_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_generate?: boolean | null
          created_at?: string | null
          created_by?: string | null
          generation_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          legal_requirement?: boolean | null
          ministry_format?: boolean | null
          report_name: string
          report_structure: Json
          report_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_generate?: boolean | null
          created_at?: string | null
          created_by?: string | null
          generation_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          legal_requirement?: boolean | null
          ministry_format?: boolean | null
          report_name?: string
          report_structure?: Json
          report_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_report_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          is_scheduled: boolean | null
          next_generation_date: string | null
          report_data: Json | null
          report_format: string | null
          report_name: string
          report_parameters: Json | null
          report_type: string
          schedule_frequency: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_scheduled?: boolean | null
          next_generation_date?: string | null
          report_data?: Json | null
          report_format?: string | null
          report_name: string
          report_parameters?: Json | null
          report_type: string
          schedule_frequency?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_scheduled?: boolean | null
          next_generation_date?: string | null
          report_data?: Json | null
          report_format?: string | null
          report_name?: string
          report_parameters?: Json | null
          report_type?: string
          schedule_frequency?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          account_id: string | null
          accumulated_depreciation: number | null
          accumulated_depreciation_account_id: string | null
          asset_category: string
          asset_code: string
          asset_name: string
          assigned_employee_id: string | null
          barcode: string | null
          book_value: number
          condition_status: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          depreciation_expense_account_id: string | null
          depreciation_method: string
          description: string | null
          disposal_amount: number | null
          disposal_date: string | null
          disposal_method: string | null
          disposal_proceeds: number | null
          disposal_reason: string | null
          documents: string[] | null
          id: string
          insurance_expiry_date: string | null
          insurance_policy_number: string | null
          invoice_number: string | null
          last_maintenance_date: string | null
          location: string | null
          location_description: string | null
          maintenance_schedule: string | null
          next_maintenance_due: string | null
          photos: string[] | null
          purchase_cost: number
          purchase_date: string
          qr_code: string | null
          residual_value: number | null
          serial_number: string | null
          status: string
          supplier_name: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
          useful_life_years: number
          warranty_end_date: string | null
          warranty_expiry: string | null
        }
        Insert: {
          account_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_category: string
          asset_code: string
          asset_name: string
          assigned_employee_id?: string | null
          barcode?: string | null
          book_value: number
          condition_status?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          depreciation_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_proceeds?: number | null
          disposal_reason?: string | null
          documents?: string[] | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          invoice_number?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          location_description?: string | null
          maintenance_schedule?: string | null
          next_maintenance_due?: string | null
          photos?: string[] | null
          purchase_cost: number
          purchase_date: string
          qr_code?: string | null
          residual_value?: number | null
          serial_number?: string | null
          status?: string
          supplier_name?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          useful_life_years: number
          warranty_end_date?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          account_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_category?: string
          asset_code?: string
          asset_name?: string
          assigned_employee_id?: string | null
          barcode?: string | null
          book_value?: number
          condition_status?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          depreciation_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_proceeds?: number | null
          disposal_reason?: string | null
          documents?: string[] | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          invoice_number?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          location_description?: string | null
          maintenance_schedule?: string | null
          next_maintenance_due?: string | null
          photos?: string[] | null
          purchase_cost?: number
          purchase_date?: string
          qr_code?: string | null
          residual_value?: number | null
          serial_number?: string | null
          status?: string
          supplier_name?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          useful_life_years?: number
          warranty_end_date?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_accumulated_depreciation_account_id_fkey"
            columns: ["accumulated_depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_depreciation_expense_account_id_fkey"
            columns: ["depreciation_expense_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_bank_transactions: {
        Row: {
          balance_after: number | null
          bank_account_id: string
          bank_reference: string | null
          check_number: string | null
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          import_id: string
          is_matched: boolean | null
          match_confidence: number | null
          match_notes: string | null
          match_type: string | null
          matched_at: string | null
          matched_by: string | null
          matched_journal_entry_id: string | null
          reference_number: string | null
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          balance_after?: number | null
          bank_account_id: string
          bank_reference?: string | null
          check_number?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          import_id: string
          is_matched?: boolean | null
          match_confidence?: number | null
          match_notes?: string | null
          match_type?: string | null
          matched_at?: string | null
          matched_by?: string | null
          matched_journal_entry_id?: string | null
          reference_number?: string | null
          tenant_id: string
          transaction_date: string
        }
        Update: {
          balance_after?: number | null
          bank_account_id?: string
          bank_reference?: string | null
          check_number?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          import_id?: string
          is_matched?: boolean | null
          match_confidence?: number | null
          match_notes?: string | null
          match_type?: string | null
          matched_at?: string | null
          matched_by?: string | null
          matched_journal_entry_id?: string | null
          reference_number?: string | null
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_bank_transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliation_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_bank_transactions_matched_journal_entry_id_fkey"
            columns: ["matched_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_alerts: {
        Row: {
          alert_type: string
          created_by: string | null
          id: string
          installment_id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          sent_at: string | null
          severity: string
          tenant_id: string
        }
        Insert: {
          alert_type: string
          created_by?: string | null
          id?: string
          installment_id: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          sent_at?: string | null
          severity?: string
          tenant_id: string
        }
        Update: {
          alert_type?: string
          created_by?: string | null
          id?: string
          installment_id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          sent_at?: string | null
          severity?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_alerts_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_payments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          installment_id: string
          journal_entry_id: string | null
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_reference: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          installment_id: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method: string
          payment_reference?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          installment_id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          down_payment: number | null
          first_installment_date: string
          id: string
          installment_frequency: string
          interest_rate: number | null
          last_installment_date: string
          notes: string | null
          number_of_installments: number
          penalty_rate: number | null
          plan_name: string
          plan_number: string
          remaining_amount: number
          status: string
          supplier_name: string
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          first_installment_date: string
          id?: string
          installment_frequency?: string
          interest_rate?: number | null
          last_installment_date: string
          notes?: string | null
          number_of_installments: number
          penalty_rate?: number | null
          plan_name: string
          plan_number: string
          remaining_amount: number
          status?: string
          supplier_name: string
          tenant_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          first_installment_date?: string
          id?: string
          installment_frequency?: string
          interest_rate?: number | null
          last_installment_date?: string
          notes?: string | null
          number_of_installments?: number
          penalty_rate?: number | null
          plan_name?: string
          plan_number?: string
          remaining_amount?: number
          status?: string
          supplier_name?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          created_at: string | null
          days_overdue: number | null
          due_date: string
          id: string
          installment_number: number
          installment_plan_id: string
          notes: string | null
          original_amount: number
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          penalty_amount: number | null
          remaining_amount: number | null
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_overdue?: number | null
          due_date: string
          id?: string
          installment_number: number
          installment_plan_id: string
          notes?: string | null
          original_amount: number
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          remaining_amount?: number | null
          status?: string
          tenant_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_overdue?: number | null
          due_date?: string
          id?: string
          installment_number?: number
          installment_plan_id?: string
          notes?: string | null
          original_amount?: number
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          penalty_amount?: number | null
          remaining_amount?: number | null
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_accounting: {
        Row: {
          account_id: string | null
          category: string
          cost_center_id: string | null
          created_at: string | null
          id: string
          item_code: string
          item_name: string
          last_updated: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          supplier_id: string | null
          tenant_id: string
          total_value: number | null
          unit_cost: number
          valuation_method: string | null
          warehouse_location: string | null
        }
        Insert: {
          account_id?: string | null
          category: string
          cost_center_id?: string | null
          created_at?: string | null
          id?: string
          item_code: string
          item_name: string
          last_updated?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          supplier_id?: string | null
          tenant_id: string
          total_value?: number | null
          unit_cost: number
          valuation_method?: string | null
          warehouse_location?: string | null
        }
        Update: {
          account_id?: string | null
          category?: string
          cost_center_id?: string | null
          created_at?: string | null
          id?: string
          item_code?: string
          item_name?: string
          last_updated?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          supplier_id?: string | null
          tenant_id?: string
          total_value?: number | null
          unit_cost?: number
          valuation_method?: string | null
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          inventory_item_id: string
          journal_entry_id: string | null
          movement_date: string
          movement_type: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          total_amount: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          inventory_item_id: string
          journal_entry_id?: string | null
          movement_date: string
          movement_type: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          total_amount?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          inventory_item_id?: string
          journal_entry_id?: string | null
          movement_date?: string
          movement_type?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          total_amount?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_movement_inventory"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_accounting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_movement_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_movement_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          daily_rate: number | null
          description: string
          end_date: string | null
          id: string
          invoice_id: string
          item_type: string
          quantity: number
          start_date: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          description: string
          end_date?: string | null
          id?: string
          invoice_id: string
          item_type?: string
          quantity?: number
          start_date?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          description?: string
          end_date?: string | null
          id?: string
          invoice_id?: string
          item_type?: string
          quantity?: number
          start_date?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          auto_generated: boolean | null
          billing_period_end: string | null
          billing_period_start: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number
          discount_percentage: number | null
          due_date: string
          id: string
          invoice_category: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          outstanding_amount: number
          paid_amount: number
          paid_at: string | null
          parent_invoice_id: string | null
          payment_method: string | null
          payment_terms: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          tenant_id: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number
          discount_percentage?: number | null
          due_date: string
          id?: string
          invoice_category?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          outstanding_amount?: number
          paid_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          tenant_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          discount_percentage?: number | null
          due_date?: string
          id?: string
          invoice_category?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          outstanding_amount?: number
          paid_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          tenant_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_automation_executions: {
        Row: {
          error_message: string | null
          executed_at: string
          execution_time_ms: number
          id: string
          journal_entry_id: string | null
          reference_id: string
          reference_type: string
          rule_id: string
          status: string
          triggered_by: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number
          id?: string
          journal_entry_id?: string | null
          reference_id: string
          reference_type: string
          rule_id: string
          status: string
          triggered_by: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number
          id?: string
          journal_entry_id?: string | null
          reference_id?: string
          reference_type?: string
          rule_id?: string
          status?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_automation_executions_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_journal_automation_executions_rule"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "journal_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_automation_rules: {
        Row: {
          account_mappings: Json
          conditions: Json
          created_at: string
          created_by: string | null
          execution_count: number
          id: string
          is_active: boolean
          last_executed: string | null
          rule_name: string
          success_rate: number
          tenant_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          account_mappings: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed?: string | null
          rule_name: string
          success_rate?: number
          tenant_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          account_mappings?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed?: string | null
          rule_name?: string
          success_rate?: number
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_automation_rules_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachment_urls: string[] | null
          audit_trail: Json | null
          auto_reverse_date: string | null
          automated_rule_id: string | null
          base_currency: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string
          entry_date: string
          entry_number: string
          entry_source: string | null
          entry_subtype: string | null
          exchange_rate: number | null
          financial_period_id: string | null
          fiscal_period_id: string | null
          id: string
          ministry_compliance_check: boolean | null
          posted_at: string | null
          posted_by: string | null
          project_id: string | null
          recurring_schedule: Json | null
          reference_id: string | null
          reference_type: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          requires_review: boolean | null
          reversal_entry_id: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          reversed_by_entry_id: string | null
          review_status: string | null
          status: string
          supporting_documents: Json | null
          supporting_documents_complete: boolean | null
          tenant_id: string
          total_credit: number
          total_debit: number
          updated_at: string
          zakat_calculated: boolean | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_urls?: string[] | null
          audit_trail?: Json | null
          auto_reverse_date?: string | null
          automated_rule_id?: string | null
          base_currency?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description: string
          entry_date: string
          entry_number: string
          entry_source?: string | null
          entry_subtype?: string | null
          exchange_rate?: number | null
          financial_period_id?: string | null
          fiscal_period_id?: string | null
          id?: string
          ministry_compliance_check?: boolean | null
          posted_at?: string | null
          posted_by?: string | null
          project_id?: string | null
          recurring_schedule?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          requires_review?: boolean | null
          reversal_entry_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          reversed_by_entry_id?: string | null
          review_status?: string | null
          status?: string
          supporting_documents?: Json | null
          supporting_documents_complete?: boolean | null
          tenant_id?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          zakat_calculated?: boolean | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_urls?: string[] | null
          audit_trail?: Json | null
          auto_reverse_date?: string | null
          automated_rule_id?: string | null
          base_currency?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          entry_source?: string | null
          entry_subtype?: string | null
          exchange_rate?: number | null
          financial_period_id?: string | null
          fiscal_period_id?: string | null
          id?: string
          ministry_compliance_check?: boolean | null
          posted_at?: string | null
          posted_by?: string | null
          project_id?: string | null
          recurring_schedule?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          requires_review?: boolean | null
          reversal_entry_id?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          reversed_by_entry_id?: string | null
          review_status?: string | null
          status?: string
          supporting_documents?: Json | null
          supporting_documents_complete?: boolean | null
          tenant_id?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          zakat_calculated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_automated_rule_id_fkey"
            columns: ["automated_rule_id"]
            isOneToOne: false
            referencedRelation: "automated_entry_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          journal_entry_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          approval_level?: number
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          journal_entry_id: string
          status: string
          tenant_id: string
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          journal_entry_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_approvals_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_attachments: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          journal_entry_id: string
          mime_type: string | null
          tenant_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          journal_entry_id: string
          mime_type?: string | null
          tenant_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          journal_entry_id?: string
          mime_type?: string | null
          tenant_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_entry_attachments_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_attachments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_cost_center_allocations: {
        Row: {
          allocation_amount: number | null
          allocation_percentage: number | null
          cost_center_id: string
          created_at: string | null
          created_by: string | null
          id: string
          journal_entry_line_id: string
          notes: string | null
          tenant_id: string
        }
        Insert: {
          allocation_amount?: number | null
          allocation_percentage?: number | null
          cost_center_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          journal_entry_line_id: string
          notes?: string | null
          tenant_id: string
        }
        Update: {
          allocation_amount?: number | null
          allocation_percentage?: number | null
          cost_center_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          journal_entry_line_id?: string
          notes?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_je_cost_center_allocations_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_cost_center_allocation_journal_entry_line_id_fkey"
            columns: ["journal_entry_line_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_cost_center_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_cost_center_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_cost_center_allocations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          allocation_percentage: number | null
          asset_reference: string | null
          contract_reference: string | null
          cost_center_id: string | null
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          detailed_description: string | null
          exchange_rate: number | null
          id: string
          invoice_reference: string | null
          is_reversible: boolean | null
          journal_entry_id: string
          line_notes: string | null
          line_number: number
          line_type: string | null
          original_amount: number | null
          original_currency: string | null
          reference_id: string | null
          reference_type: string | null
          supporting_reference: string | null
          tenant_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          account_id: string
          allocation_percentage?: number | null
          asset_reference?: string | null
          contract_reference?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          detailed_description?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_reference?: string | null
          is_reversible?: boolean | null
          journal_entry_id: string
          line_notes?: string | null
          line_number: number
          line_type?: string | null
          original_amount?: number | null
          original_currency?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supporting_reference?: string | null
          tenant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          account_id?: string
          allocation_percentage?: number | null
          asset_reference?: string | null
          contract_reference?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          detailed_description?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_reference?: string | null
          is_reversible?: boolean | null
          journal_entry_id?: string
          line_notes?: string | null
          line_number?: number
          line_type?: string | null
          original_amount?: number | null
          original_currency?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supporting_reference?: string | null
          tenant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_reviews: {
        Row: {
          created_at: string
          id: string
          journal_entry_id: string
          missing_documents: Json | null
          required_documents: Json | null
          review_checklist: Json | null
          review_comments: string | null
          review_status: string
          reviewed_at: string | null
          reviewer_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          journal_entry_id: string
          missing_documents?: Json | null
          required_documents?: Json | null
          review_checklist?: Json | null
          review_comments?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          journal_entry_id?: string
          missing_documents?: Json | null
          required_documents?: Json | null
          review_checklist?: Json | null
          review_comments?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_accounts: Json | null
          description: string | null
          entry_subtype: string | null
          entry_type: string
          id: string
          is_active: boolean | null
          requires_approval: boolean | null
          template_lines: Json
          template_name: string
          template_name_en: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_accounts?: Json | null
          description?: string | null
          entry_subtype?: string | null
          entry_type: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          template_lines: Json
          template_name: string
          template_name_en?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_accounts?: Json | null
          description?: string | null
          entry_subtype?: string | null
          entry_type?: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          template_lines?: Json
          template_name?: string
          template_name_en?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entry_validations: {
        Row: {
          id: string
          journal_entry_id: string
          tenant_id: string
          validated_at: string | null
          validation_details: Json | null
          validation_message: string | null
          validation_status: string
          validation_type: string
        }
        Insert: {
          id?: string
          journal_entry_id: string
          tenant_id: string
          validated_at?: string | null
          validation_details?: Json | null
          validation_message?: string | null
          validation_status: string
          validation_type: string
        }
        Update: {
          id?: string
          journal_entry_id?: string
          tenant_id?: string
          validated_at?: string | null
          validation_details?: Json | null
          validation_message?: string | null
          validation_status?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_validations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          section_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          section_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          section_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          tenant_id: string | null
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          tenant_id?: string | null
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_categories: {
        Row: {
          category_name: string
          created_at: string
          default_frequency_months: number | null
          description: string | null
          estimated_cost: number | null
          id: string
          is_active: boolean | null
          is_critical: boolean | null
        }
        Insert: {
          category_name: string
          created_at?: string
          default_frequency_months?: number | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
        }
        Update: {
          category_name?: string
          created_at?: string
          default_frequency_months?: number | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          model_name: string
          model_parameters: Json | null
          model_type: string
          model_version: string
          training_data_count: number | null
          updated_at: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_name: string
          model_parameters?: Json | null
          model_type: string
          model_version: string
          training_data_count?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_name?: string
          model_parameters?: Json | null
          model_type?: string
          model_version?: string
          training_data_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      module_cross_references: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          relationship_type: string
          source_id: string
          source_module: string
          target_id: string
          target_module: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          relationship_type: string
          source_id: string
          source_module: string
          target_id: string
          target_module: string
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          relationship_type?: string
          source_id?: string
          source_module?: string
          target_id?: string
          target_module?: string
          tenant_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          notification_type?: string
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      office_locations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          auto_generated_invoice: boolean | null
          bank_name: string | null
          check_number: string | null
          collected_by: string | null
          collection_location: string | null
          contract_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          invoice_id: string
          journal_entry_id: string | null
          notes: string | null
          payment_category: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          receipt_url: string | null
          status: string
          tenant_id: string
          transaction_reference: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          auto_generated_invoice?: boolean | null
          bank_name?: string | null
          check_number?: string | null
          collected_by?: string | null
          collection_location?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          invoice_id: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_category?: string | null
          payment_date?: string
          payment_method?: string
          payment_number: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          auto_generated_invoice?: boolean | null
          bank_name?: string | null
          check_number?: string | null
          collected_by?: string | null
          collection_location?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_category?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          actual_working_days: number | null
          allowances: number | null
          approved_at: string | null
          approved_by: string | null
          basic_salary: number
          bonuses: number | null
          created_at: string
          created_by: string | null
          deductions: number | null
          employee_id: string
          gross_salary: number
          id: string
          journal_entry_id: string | null
          net_salary: number
          notes: string | null
          overtime_amount: number | null
          overtime_hours: number | null
          paid_at: string | null
          pay_period_end: string
          pay_period_start: string
          social_insurance: number | null
          status: string
          tax_deduction: number | null
          total_working_days: number | null
          updated_at: string
        }
        Insert: {
          actual_working_days?: number | null
          allowances?: number | null
          approved_at?: string | null
          approved_by?: string | null
          basic_salary: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id: string
          gross_salary: number
          id?: string
          journal_entry_id?: string | null
          net_salary: number
          notes?: string | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          pay_period_end: string
          pay_period_start: string
          social_insurance?: number | null
          status?: string
          tax_deduction?: number | null
          total_working_days?: number | null
          updated_at?: string
        }
        Update: {
          actual_working_days?: number | null
          allowances?: number | null
          approved_at?: string | null
          approved_by?: string | null
          basic_salary?: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id?: string
          gross_salary?: number
          id?: string
          journal_entry_id?: string | null
          net_salary?: number
          notes?: string | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          pay_period_end?: string
          pay_period_start?: string
          social_insurance?: number | null
          status?: string
          tax_deduction?: number | null
          total_working_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_accounting_entries: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          entry_type: string
          id: string
          journal_entry_id: string
          notes: string | null
          payroll_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          entry_type: string
          id?: string
          journal_entry_id: string
          notes?: string | null
          payroll_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          entry_type?: string
          id?: string
          journal_entry_id?: string
          notes?: string | null
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_accounting_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_accounting_entries_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          item_name: string
          item_type: string
          payroll_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          item_type: string
          payroll_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          item_type?: string
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      period_closing_audit: {
        Row: {
          action_type: string
          additional_data: Json | null
          created_at: string | null
          id: string
          ip_address: string | null
          performed_at: string
          performed_by: string
          period_id: string
          reason: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by: string
          period_id: string
          reason?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by?: string
          period_id?: string
          reason?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "period_closing_audit_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_closing_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          permission_key: string
          reason: string | null
          target_role: string | null
          target_user_id: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          permission_key: string
          reason?: string | null
          target_role?: string | null
          target_user_id?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          permission_key?: string
          reason?: string | null
          target_role?: string | null
          target_user_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_group_permissions: {
        Row: {
          granted: boolean
          group_id: string
          id: string
          permission_id: string
        }
        Insert: {
          granted?: boolean
          group_id: string
          id?: string
          permission_id: string
        }
        Update: {
          granted?: boolean
          group_id?: string
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_groups: {
        Row: {
          created_at: string
          created_by: string | null
          group_description: string | null
          group_name: string
          id: string
          is_active: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_description?: string | null
          group_name: string
          id?: string
          is_active?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_description?: string | null
          group_name?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          is_system_permission: boolean
          module_name: string
          permission_description: string | null
          permission_key: string
          permission_name: string
          resource_level: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_permission?: boolean
          module_name: string
          permission_description?: string | null
          permission_key: string
          permission_name: string
          resource_level?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_permission?: boolean
          module_name?: string
          permission_description?: string | null
          permission_key?: string
          permission_name?: string
          resource_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_templates: {
        Row: {
          base_price: number
          created_at: string
          created_by: string | null
          daily_rate: number
          discount_rules: Json
          id: string
          is_active: boolean
          monthly_rate: number | null
          seasonal_multiplier: number
          surge_pricing_rules: Json
          template_name: string
          tenant_id: string
          updated_at: string
          vehicle_category: string
          weekly_rate: number | null
        }
        Insert: {
          base_price: number
          created_at?: string
          created_by?: string | null
          daily_rate: number
          discount_rules?: Json
          id?: string
          is_active?: boolean
          monthly_rate?: number | null
          seasonal_multiplier?: number
          surge_pricing_rules?: Json
          template_name: string
          tenant_id: string
          updated_at?: string
          vehicle_category: string
          weekly_rate?: number | null
        }
        Update: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          daily_rate?: number
          discount_rules?: Json
          id?: string
          is_active?: boolean
          monthly_rate?: number | null
          seasonal_multiplier?: number
          surge_pricing_rules?: Json
          template_name?: string
          tenant_id?: string
          updated_at?: string
          vehicle_category?: string
          weekly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          client_notes: string | null
          client_response_at: string | null
          client_viewed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          final_amount: number
          id: string
          public_link_expires_at: string | null
          public_token: string | null
          quotation_number: string
          rental_days: number
          sales_person_id: string | null
          special_conditions: string | null
          start_date: string
          status: string | null
          tax_amount: number | null
          tenant_id: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
          vehicle_id: string
        }
        Insert: {
          client_notes?: string | null
          client_response_at?: string | null
          client_viewed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          daily_rate: number
          discount_amount?: number | null
          end_date: string
          final_amount: number
          id?: string
          public_link_expires_at?: string | null
          public_token?: string | null
          quotation_number: string
          rental_days: number
          sales_person_id?: string | null
          special_conditions?: string | null
          start_date: string
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          terms_and_conditions?: string | null
          total_amount: number
          updated_at?: string
          valid_until?: string | null
          vehicle_id: string
        }
        Update: {
          client_notes?: string | null
          client_response_at?: string | null
          client_viewed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          daily_rate?: number
          discount_amount?: number | null
          end_date?: string
          final_amount?: number
          id?: string
          public_link_expires_at?: string | null
          public_token?: string | null
          quotation_number?: string
          rental_days?: number
          sales_person_id?: string | null
          special_conditions?: string | null
          start_date?: string
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      received_checks: {
        Row: {
          amount: number
          bank_name: string
          bounce_reason: string | null
          bounced_at: string | null
          check_date: string
          check_number: string
          cleared_at: string | null
          created_at: string | null
          created_by: string | null
          deposit_bank_account_id: string | null
          deposited_at: string | null
          drawer_account: string | null
          drawer_name: string
          due_date: string | null
          id: string
          journal_entry_id: string | null
          memo: string | null
          received_date: string
          reference_id: string | null
          reference_type: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_name: string
          bounce_reason?: string | null
          bounced_at?: string | null
          check_date: string
          check_number: string
          cleared_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_bank_account_id?: string | null
          deposited_at?: string | null
          drawer_account?: string | null
          drawer_name: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          received_date?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string
          bounce_reason?: string | null
          bounced_at?: string | null
          check_date?: string
          check_number?: string
          cleared_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_bank_account_id?: string | null
          deposited_at?: string | null
          drawer_account?: string | null
          drawer_name?: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          received_date?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_received_checks_bank_account"
            columns: ["deposit_bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_received_checks_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_received_checks_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          granted: boolean
          id: string
          permission_id: string
          role_name: string
          tenant_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted?: boolean
          id?: string
          permission_id: string
          role_name: string
          tenant_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted?: boolean
          id?: string
          permission_id?: string
          role_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          period_end: string | null
          period_start: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "saas_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "saas_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          amount_remaining: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          metadata: Json | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          amount_remaining?: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          amount_remaining?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          status: string
          stripe_payment_intent_id: string | null
          subscription_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subscription_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "saas_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          pause_collection: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          id?: string
          pause_collection?: Json | null
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          pause_collection?: Json | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sadad_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_url: string | null
          saas_invoice_id: string | null
          sadad_reference_number: string | null
          sadad_response: Json | null
          sadad_status: string
          sadad_transaction_id: string | null
          subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_url?: string | null
          saas_invoice_id?: string | null
          sadad_reference_number?: string | null
          sadad_response?: Json | null
          sadad_status?: string
          sadad_transaction_id?: string | null
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_url?: string | null
          saas_invoice_id?: string | null
          sadad_reference_number?: string | null
          sadad_response?: Json | null
          sadad_status?: string
          sadad_transaction_id?: string | null
          subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sadad_payments_saas_invoice_id_fkey"
            columns: ["saas_invoice_id"]
            isOneToOne: false
            referencedRelation: "saas_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sadad_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "saas_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sadad_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sadad_settings: {
        Row: {
          api_url: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_sandbox: boolean
          merchant_id: string
          merchant_key: string
          updated_at: string
        }
        Insert: {
          api_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          merchant_id: string
          merchant_key: string
          updated_at?: string
        }
        Update: {
          api_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          merchant_id?: string
          merchant_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      sadad_transaction_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          payment_id: string
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          payment_id: string
          request_data?: Json | null
          response_data?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payment_id?: string
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sadad_transaction_log_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "sadad_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      sadad_webhook_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          payment_id: string | null
          processed: boolean
          sadad_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          event_data: Json
          event_type: string
          id?: string
          payment_id?: string | null
          processed?: boolean
          sadad_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          payment_id?: string | null
          processed?: boolean
          sadad_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sadad_webhook_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "sadad_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_financial_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          parameters: Json | null
          report_data: Json | null
          report_name: string
          report_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters?: Json | null
          report_data?: Json | null
          report_name: string
          report_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters?: Json | null
          report_data?: Json | null
          report_name?: string
          report_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_financial_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          message: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          table_name: string | null
          tenant_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          table_name?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          table_name?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ssl_certificates: {
        Row: {
          auto_renew: boolean
          certificate_data: string | null
          chain_data: string | null
          created_at: string
          domain: string
          expires_at: string | null
          id: string
          issued_at: string | null
          last_renewed_at: string | null
          private_key_data: string | null
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          certificate_data?: string | null
          chain_data?: string | null
          created_at?: string
          domain: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_renewed_at?: string | null
          private_key_data?: string | null
          provider?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          certificate_data?: string | null
          chain_data?: string | null
          created_at?: string
          domain?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_renewed_at?: string | null
          private_key_data?: string | null
          provider?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssl_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number | null
          billing_period: string | null
          created_at: string | null
          currency: string | null
          ended_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          ended_at?: string | null
          id?: string
          plan: string
          started_at: string
          status: string
          tenant_id: string
        }
        Update: {
          amount?: number | null
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          ended_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean
          is_popular: boolean
          max_contracts: number | null
          max_tenants: number | null
          max_users_per_tenant: number | null
          max_vehicles: number | null
          plan_code: string
          plan_name: string
          plan_name_en: string | null
          price_monthly: number
          price_yearly: number
          sort_order: number
          storage_limit_gb: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_contracts?: number | null
          max_tenants?: number | null
          max_users_per_tenant?: number | null
          max_vehicles?: number | null
          plan_code: string
          plan_name: string
          plan_name_en?: string | null
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          storage_limit_gb?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_contracts?: number | null
          max_tenants?: number | null
          max_users_per_tenant?: number | null
          max_vehicles?: number | null
          plan_code?: string
          plan_name?: string
          plan_name_en?: string | null
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          storage_limit_gb?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_accounting: {
        Row: {
          account_id: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          payment_terms: string | null
          preferred_payment_method: string | null
          supplier_code: string
          supplier_name: string
          tax_number: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          preferred_payment_method?: string | null
          supplier_code: string
          supplier_name: string
          tax_number?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          preferred_payment_method?: string | null
          supplier_code?: string
          supplier_name?: string
          tax_number?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_ledger: {
        Row: {
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          journal_entry_id: string | null
          reference_id: string | null
          reference_type: string | null
          running_balance: number | null
          supplier_id: string
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          journal_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number | null
          supplier_id: string
          tenant_id: string
          transaction_date: string
        }
        Update: {
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          journal_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number | null
          supplier_id?: string
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_ledger_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_ledger_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_accounting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_ledger_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          requires_restart: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          requires_restart?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_access_log: {
        Row: {
          action: string | null
          attempted_tenant_id: string | null
          created_at: string | null
          id: string
          success: boolean | null
          table_name: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          attempted_tenant_id?: string | null
          created_at?: string | null
          id?: string
          success?: boolean | null
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          attempted_tenant_id?: string | null
          created_at?: string | null
          id?: string
          success?: boolean | null
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_access_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_access_logs: {
        Row: {
          action: string
          actual_tenant_id: string | null
          attempted_tenant_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          success: boolean
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actual_tenant_id?: string | null
          attempted_tenant_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success: boolean
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actual_tenant_id?: string | null
          attempted_tenant_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_assets: {
        Row: {
          alt_text: string | null
          asset_name: string
          asset_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          is_current: boolean | null
          mime_type: string | null
          parent_asset_id: string | null
          tenant_id: string
          updated_at: string | null
          usage_context: Json | null
          version: number | null
        }
        Insert: {
          alt_text?: string | null
          asset_name: string
          asset_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          mime_type?: string | null
          parent_asset_id?: string | null
          tenant_id: string
          updated_at?: string | null
          usage_context?: Json | null
          version?: number | null
        }
        Update: {
          alt_text?: string | null
          asset_name?: string
          asset_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          mime_type?: string | null
          parent_asset_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          usage_context?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "tenant_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customizations: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_body_scripts: string | null
          custom_css: string | null
          custom_head_scripts: string | null
          custom_pages: Json | null
          dashboard_layout: string | null
          dashboard_widgets: Json | null
          default_language: string | null
          disabled_features: Json | null
          email_templates: Json | null
          enabled_features: Json | null
          id: string
          is_active: boolean | null
          navigation_collapsed: boolean | null
          navigation_items: Json | null
          navigation_style: string | null
          rtl_enabled: boolean | null
          supported_languages: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_body_scripts?: string | null
          custom_css?: string | null
          custom_head_scripts?: string | null
          custom_pages?: Json | null
          dashboard_layout?: string | null
          dashboard_widgets?: Json | null
          default_language?: string | null
          disabled_features?: Json | null
          email_templates?: Json | null
          enabled_features?: Json | null
          id?: string
          is_active?: boolean | null
          navigation_collapsed?: boolean | null
          navigation_items?: Json | null
          navigation_style?: string | null
          rtl_enabled?: boolean | null
          supported_languages?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_body_scripts?: string | null
          custom_css?: string | null
          custom_head_scripts?: string | null
          custom_pages?: Json | null
          dashboard_layout?: string | null
          dashboard_widgets?: Json | null
          default_language?: string | null
          disabled_features?: Json | null
          email_templates?: Json | null
          enabled_features?: Json | null
          id?: string
          is_active?: boolean | null
          navigation_collapsed?: boolean | null
          navigation_items?: Json | null
          navigation_style?: string | null
          rtl_enabled?: boolean | null
          supported_languages?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_deletion_log: {
        Row: {
          created_at: string
          deleted_at: string
          deleted_by: string | null
          deletion_reason: string | null
          deletion_type: string
          id: string
          tenant_id: string
          tenant_name: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_type?: string
          id?: string
          tenant_id: string
          tenant_name: string
        }
        Update: {
          created_at?: string
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_type?: string
          id?: string
          tenant_id?: string
          tenant_name?: string
        }
        Relationships: []
      }
      tenant_domains: {
        Row: {
          created_at: string | null
          created_by: string | null
          domain: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          redirect_to_primary: boolean | null
          ssl_certificate_id: string | null
          ssl_expires_at: string | null
          ssl_status: string | null
          subdomain: string | null
          tenant_id: string
          updated_at: string | null
          verification_method: string | null
          verification_status: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          redirect_to_primary?: boolean | null
          ssl_certificate_id?: string | null
          ssl_expires_at?: string | null
          ssl_status?: string | null
          subdomain?: string | null
          tenant_id: string
          updated_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          redirect_to_primary?: boolean | null
          ssl_certificate_id?: string | null
          ssl_expires_at?: string | null
          ssl_status?: string | null
          subdomain?: string | null
          tenant_id?: string
          updated_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_themes: {
        Row: {
          accent_color: string | null
          background_color: string | null
          border_radius: string | null
          created_at: string | null
          created_by: string | null
          custom_css: Json | null
          error_color: string | null
          font_family: string | null
          font_size_base: string | null
          font_weight_base: string | null
          id: string
          info_color: string | null
          is_active: boolean | null
          is_default: boolean | null
          primary_color: string | null
          secondary_color: string | null
          spacing_unit: string | null
          success_color: string | null
          surface_color: string | null
          tenant_id: string
          text_primary: string | null
          text_secondary: string | null
          theme_name: string
          updated_at: string | null
          warning_color: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: Json | null
          error_color?: string | null
          font_family?: string | null
          font_size_base?: string | null
          font_weight_base?: string | null
          id?: string
          info_color?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          spacing_unit?: string | null
          success_color?: string | null
          surface_color?: string | null
          tenant_id: string
          text_primary?: string | null
          text_secondary?: string | null
          theme_name?: string
          updated_at?: string | null
          warning_color?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: Json | null
          error_color?: string | null
          font_family?: string | null
          font_size_base?: string | null
          font_weight_base?: string | null
          id?: string
          info_color?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          spacing_unit?: string | null
          success_color?: string | null
          surface_color?: string | null
          tenant_id?: string
          text_primary?: string | null
          text_secondary?: string | null
          theme_name?: string
          updated_at?: string | null
          warning_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_themes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          contracts_count: number | null
          created_at: string
          id: string
          storage_used_gb: number | null
          tenant_id: string
          updated_at: string
          usage_date: string
          users_count: number | null
          vehicles_count: number | null
        }
        Insert: {
          contracts_count?: number | null
          created_at?: string
          id?: string
          storage_used_gb?: number | null
          tenant_id: string
          updated_at?: string
          usage_date?: string
          users_count?: number | null
          vehicles_count?: number | null
        }
        Update: {
          contracts_count?: number | null
          created_at?: string
          id?: string
          storage_used_gb?: number | null
          tenant_id?: string
          updated_at?: string
          usage_date?: string
          users_count?: number | null
          vehicles_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          domain: string | null
          id: string
          logo_url: string | null
          max_contracts: number | null
          max_users: number | null
          max_vehicles: number | null
          name: string
          settings: Json | null
          slug: string
          status: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_starts_at: string | null
          subscription_status: string | null
          tenant_type: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_contracts?: number | null
          max_users?: number | null
          max_vehicles?: number | null
          name: string
          settings?: Json | null
          slug: string
          status?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          tenant_type?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_contracts?: number | null
          max_users?: number | null
          max_vehicles?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          tenant_type?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      traffic_violations: {
        Row: {
          closed_at: string | null
          contract_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_notified_at: string | null
          description: string | null
          documents: string[] | null
          evidence_photos: string[] | null
          fine_amount: number
          follow_up_date: string | null
          id: string
          issuing_authority: string | null
          liability_determination: string | null
          liability_determined_at: string | null
          liability_determined_by: string | null
          liability_percentage: number | null
          liability_reason: string | null
          location: string | null
          notes: string | null
          officer_name: string | null
          official_violation_number: string | null
          paid_amount: number | null
          payment_due_date: string | null
          payment_status: string | null
          processing_fee: number | null
          status: string | null
          tenant_id: string | null
          total_amount: number
          updated_at: string
          vehicle_id: string
          violation_date: string
          violation_number: string
          violation_time: string | null
          violation_type_id: string
        }
        Insert: {
          closed_at?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_notified_at?: string | null
          description?: string | null
          documents?: string[] | null
          evidence_photos?: string[] | null
          fine_amount: number
          follow_up_date?: string | null
          id?: string
          issuing_authority?: string | null
          liability_determination?: string | null
          liability_determined_at?: string | null
          liability_determined_by?: string | null
          liability_percentage?: number | null
          liability_reason?: string | null
          location?: string | null
          notes?: string | null
          officer_name?: string | null
          official_violation_number?: string | null
          paid_amount?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          processing_fee?: number | null
          status?: string | null
          tenant_id?: string | null
          total_amount: number
          updated_at?: string
          vehicle_id: string
          violation_date: string
          violation_number: string
          violation_time?: string | null
          violation_type_id: string
        }
        Update: {
          closed_at?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_notified_at?: string | null
          description?: string | null
          documents?: string[] | null
          evidence_photos?: string[] | null
          fine_amount?: number
          follow_up_date?: string | null
          id?: string
          issuing_authority?: string | null
          liability_determination?: string | null
          liability_determined_at?: string | null
          liability_determined_by?: string | null
          liability_percentage?: number | null
          liability_reason?: string | null
          location?: string | null
          notes?: string | null
          officer_name?: string | null
          official_violation_number?: string | null
          paid_amount?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          processing_fee?: number | null
          status?: string | null
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
          violation_date?: string
          violation_number?: string
          violation_time?: string | null
          violation_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traffic_violations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_violations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_violations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_violations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_violations_violation_type_id_fkey"
            columns: ["violation_type_id"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      training_data: {
        Row: {
          actual_output: Json | null
          created_at: string
          expected_output: Json
          id: string
          input_features: Json
          is_validated: boolean | null
          model_id: string
          validation_score: number | null
        }
        Insert: {
          actual_output?: Json | null
          created_at?: string
          expected_output: Json
          id?: string
          input_features: Json
          is_validated?: boolean | null
          model_id: string
          validation_score?: number | null
        }
        Update: {
          actual_output?: Json | null
          created_at?: string
          expected_output?: Json
          id?: string
          input_features?: Json
          is_validated?: boolean | null
          model_id?: string
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_data_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          category: string
          content_data: Json | null
          content_type: string
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          learning_objectives: string[] | null
          order_index: number
          prerequisites: string[] | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content_data?: Json | null
          content_type: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          learning_objectives?: string[] | null
          order_index?: number
          prerequisites?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_data?: Json | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          learning_objectives?: string[] | null
          order_index?: number
          prerequisites?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_log: {
        Row: {
          amount: number | null
          created_at: string
          customer_id: string | null
          department_id: string | null
          description: string
          details: Json | null
          employee_id: string | null
          error_message: string | null
          id: string
          priority: string
          processed_at: string | null
          source_id: string
          source_table: string
          status: string
          target_id: string | null
          target_table: string | null
          tenant_id: string | null
          transaction_type: string
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          department_id?: string | null
          description: string
          details?: Json | null
          employee_id?: string | null
          error_message?: string | null
          id?: string
          priority?: string
          processed_at?: string | null
          source_id: string
          source_table: string
          status?: string
          target_id?: string | null
          target_table?: string | null
          tenant_id?: string | null
          transaction_type: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          department_id?: string | null
          description?: string
          details?: Json | null
          employee_id?: string | null
          error_message?: string | null
          id?: string
          priority?: string
          processed_at?: string | null
          source_id?: string
          source_table?: string
          status?: string
          target_id?: string | null
          target_table?: string | null
          tenant_id?: string | null
          transaction_type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_log_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          session_id: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_at?: string
          invited_by?: string | null
          role: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string | null
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          granted: boolean
          id: string
          permission_id: string
          reason: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted?: boolean
          id?: string
          permission_id: string
          reason?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          granted?: boolean
          id?: string
          permission_id?: string
          reason?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          location: string | null
          session_token: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          session_token: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          session_token?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_costs: {
        Row: {
          amount: number
          cost_center_id: string | null
          cost_date: string
          cost_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          invoice_number: string | null
          journal_entry_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          supplier_id: string | null
          tenant_id: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          amount: number
          cost_center_id?: string | null
          cost_date: string
          cost_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          journal_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          cost_center_id?: string | null
          cost_date?: string
          cost_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          journal_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicle_costs_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle_costs_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle_costs_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_depreciation_schedule: {
        Row: {
          accumulated_depreciation: number
          book_value: number
          created_at: string | null
          depreciation_date: string
          id: string
          is_processed: boolean | null
          journal_entry_id: string | null
          monthly_depreciation: number
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          accumulated_depreciation: number
          book_value: number
          created_at?: string | null
          depreciation_date: string
          id?: string
          is_processed?: boolean | null
          journal_entry_id?: string | null
          monthly_depreciation: number
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          accumulated_depreciation?: number
          book_value?: number
          created_at?: string | null
          depreciation_date?: string
          id?: string
          is_processed?: boolean | null
          journal_entry_id?: string | null
          monthly_depreciation?: number
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_depreciation_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_depreciation_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_depreciation_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_insurance: {
        Row: {
          coverage_amount: number | null
          created_at: string | null
          created_by: string | null
          deductible_amount: number | null
          expiry_date: string | null
          id: string
          insurance_company: string | null
          insurance_type: string
          is_active: boolean | null
          notes: string | null
          policy_number: string | null
          premium_amount: number | null
          start_date: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          coverage_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          deductible_amount?: number | null
          expiry_date?: string | null
          id?: string
          insurance_company?: string | null
          insurance_type: string
          is_active?: boolean | null
          notes?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          start_date?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          coverage_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          deductible_amount?: number | null
          expiry_date?: string | null
          id?: string
          insurance_company?: string | null
          insurance_type?: string
          is_active?: boolean | null
          notes?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          start_date?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_insurance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          invoice_number: string | null
          maintenance_type: string
          mileage_at_service: number | null
          next_service_date: string | null
          scheduled_date: string | null
          service_provider: string | null
          status: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          invoice_number?: string | null
          maintenance_type: string
          mileage_at_service?: number | null
          next_service_date?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_number?: string | null
          maintenance_type?: string
          mileage_at_service?: number | null
          next_service_date?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          asset_code_hierarchy: string | null
          asset_id: string | null
          asset_sequence_number: number | null
          body_type: string | null
          color: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          daily_rate: number
          depreciation_method: string | null
          depreciation_rate: number | null
          engine_size: string | null
          excess_mileage_cost: number | null
          fuel_type: string | null
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_type: string | null
          last_maintenance_date: string | null
          license_plate: string
          make: string
          max_daily_rate: number | null
          mileage: number | null
          mileage_limit: number | null
          min_daily_rate: number | null
          model: string
          monthly_rate: number | null
          next_maintenance_due: string | null
          notes: string | null
          owner_type: string | null
          previous_accumulated_depreciation: number | null
          purchase_cost: number | null
          purchase_date: string | null
          registration_expiry: string | null
          residual_value: number | null
          status: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          transmission: string | null
          updated_at: string
          useful_life_years: number | null
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vin_number: string | null
          weekly_rate: number | null
          year: number
        }
        Insert: {
          asset_code_hierarchy?: string | null
          asset_id?: string | null
          asset_sequence_number?: number | null
          body_type?: string | null
          color: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate: number
          depreciation_method?: string | null
          depreciation_rate?: number | null
          engine_size?: string | null
          excess_mileage_cost?: number | null
          fuel_type?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_type?: string | null
          last_maintenance_date?: string | null
          license_plate: string
          make: string
          max_daily_rate?: number | null
          mileage?: number | null
          mileage_limit?: number | null
          min_daily_rate?: number | null
          model: string
          monthly_rate?: number | null
          next_maintenance_due?: string | null
          notes?: string | null
          owner_type?: string | null
          previous_accumulated_depreciation?: number | null
          purchase_cost?: number | null
          purchase_date?: string | null
          registration_expiry?: string | null
          residual_value?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id?: string
          transmission?: string | null
          updated_at?: string
          useful_life_years?: number | null
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vin_number?: string | null
          weekly_rate?: number | null
          year: number
        }
        Update: {
          asset_code_hierarchy?: string | null
          asset_id?: string | null
          asset_sequence_number?: number | null
          body_type?: string | null
          color?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate?: number
          depreciation_method?: string | null
          depreciation_rate?: number | null
          engine_size?: string | null
          excess_mileage_cost?: number | null
          fuel_type?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_type?: string | null
          last_maintenance_date?: string | null
          license_plate?: string
          make?: string
          max_daily_rate?: number | null
          mileage?: number | null
          mileage_limit?: number | null
          min_daily_rate?: number | null
          model?: string
          monthly_rate?: number | null
          next_maintenance_due?: string | null
          notes?: string | null
          owner_type?: string | null
          previous_accumulated_depreciation?: number | null
          purchase_cost?: number | null
          purchase_date?: string | null
          registration_expiry?: string | null
          residual_value?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id?: string
          transmission?: string | null
          updated_at?: string
          useful_life_years?: number | null
          vehicle_number?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vin_number?: string | null
          weekly_rate?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_asset_code_hierarchy_fkey"
            columns: ["asset_code_hierarchy"]
            isOneToOne: false
            referencedRelation: "asset_code_hierarchy"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "vehicles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_center_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_accounting_entries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string
          violation_payment_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id: string
          violation_payment_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string
          violation_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_accounting_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violation_accounting_entries_violation_payment_id_fkey"
            columns: ["violation_payment_id"]
            isOneToOne: false
            referencedRelation: "violation_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_history: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
          violation_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          violation_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_history_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "traffic_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_payments: {
        Row: {
          amount: number
          bank_name: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          receipt_url: string | null
          status: string | null
          tenant_id: string | null
          transaction_reference: string | null
          updated_at: string
          violation_id: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receipt_url?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          violation_id: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receipt_url?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violation_payments_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "traffic_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_types: {
        Row: {
          base_fine_amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          points: number | null
          severity_level: string | null
          updated_at: string
          violation_code: string
          violation_name_ar: string
          violation_name_en: string | null
        }
        Insert: {
          base_fine_amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          severity_level?: string | null
          updated_at?: string
          violation_code: string
          violation_name_ar: string
          violation_name_en?: string | null
        }
        Update: {
          base_fine_amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          severity_level?: string | null
          updated_at?: string
          violation_code?: string
          violation_name_ar?: string
          violation_name_en?: string | null
        }
        Relationships: []
      }
      work_locations: {
        Row: {
          address: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          radius_meters: number | null
          updated_at: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          radius_meters?: number | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius_meters?: number | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          created_at: string
          department_id: string
          estimated_duration_hours: number | null
          id: string
          is_active: boolean | null
          is_approval_required: boolean | null
          responsible_role: string | null
          step_name: string
          step_order: number
          workflow_name: string
        }
        Insert: {
          created_at?: string
          department_id: string
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_approval_required?: boolean | null
          responsible_role?: string | null
          step_name: string
          step_order: number
          workflow_name: string
        }
        Update: {
          created_at?: string
          department_id?: string
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_approval_required?: boolean | null
          responsible_role?: string | null
          step_name?: string
          step_order?: number
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cost_center_report: {
        Row: {
          actual_spent: number | null
          budget_amount: number | null
          budget_utilization_percentage: number | null
          contract_count: number | null
          cost_center_code: string | null
          cost_center_name: string | null
          cost_center_type: string | null
          department_name: string | null
          employee_count: number | null
          hierarchy_path: string | null
          id: string | null
          level: number | null
          manager_name: string | null
          variance: number | null
          vehicle_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_specialized_rental_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      analyze_deferred_revenue_account: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      apply_comprehensive_default_chart: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      audit_orphaned_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_distribute_costs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      auto_generate_journal_entry_smart: {
        Args: {
          trigger_event: string
          reference_id: string
          reference_data: Json
        }
        Returns: string
      }
      batch_post_journal_entries: {
        Args: { entry_ids: string[]; posted_by?: string }
        Returns: {
          success_count: number
          failed_count: number
          failed_entries: Json
          total_debit: number
          total_credit: number
        }[]
      }
      calculate_advanced_depreciation: {
        Args: { asset_id_param: string; calculation_date?: string }
        Returns: {
          depreciation_amount: number
          accumulated_depreciation: number
          book_value: number
          method_used: string
        }[]
      }
      calculate_advanced_kpi: {
        Args:
          | { kpi_code_param: string }
          | { kpi_code_param: string; tenant_id_param: string }
        Returns: number
      }
      calculate_all_kpis: {
        Args: Record<PropertyKey, never>
        Returns: {
          kpi_code: string
          calculated_value: number
          status: string
        }[]
      }
      calculate_book_value: {
        Args: { asset_cost: number; accumulated_depreciation: number }
        Returns: number
      }
      calculate_budget_variance: {
        Args: { budget_id: string }
        Returns: undefined
      }
      calculate_cash_flow: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      calculate_cash_ratio: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      calculate_cost_center_actual_costs: {
        Args: { cost_center_id_param: string }
        Returns: number
      }
      calculate_cost_center_performance: {
        Args: {
          p_tenant_id: string
          p_cost_center_id?: string
          p_year?: number
        }
        Returns: {
          cost_center_id: string
          cost_center_name: string
          annual_budget: number
          annual_actual: number
          variance: number
          variance_percentage: number
          utilization_rate: number
          performance_status: string
        }[]
      }
      calculate_customer_aging: {
        Args: { customer_id_param: string; analysis_date_param?: string }
        Returns: Json
      }
      calculate_customer_aging_fast: {
        Args: { customer_id_param: string }
        Returns: Json
      }
      calculate_financial_kpis: {
        Args: { for_date?: string }
        Returns: number
      }
      calculate_financial_metrics: {
        Args: { start_date?: string; end_date?: string }
        Returns: Json
      }
      calculate_financial_variance: {
        Args: {
          tenant_id_param: string
          base_start_date: string
          base_end_date: string
          comparison_start_date: string
          comparison_end_date: string
        }
        Returns: Json
      }
      calculate_forecast_accuracy: {
        Args: Record<PropertyKey, never>
        Returns: {
          forecast_type: string
          avg_accuracy: number
          forecast_count: number
        }[]
      }
      calculate_installment_summary: {
        Args: { tenant_id_param: string }
        Returns: Json
      }
      calculate_liquidity_ratios: {
        Args: Record<PropertyKey, never> | { tenant_id_param: string }
        Returns: Json
      }
      calculate_monthly_depreciation: {
        Args: {
          asset_cost: number
          residual_value: number
          useful_life_years: number
          method?: string
        }
        Returns: number
      }
      calculate_monthly_performance: {
        Args: { target_year: number; target_month: number }
        Returns: string
      }
      calculate_monthly_revenue: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      calculate_monthly_vehicle_depreciation: {
        Args: { target_month?: string }
        Returns: number
      }
      calculate_outstanding_receivables: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      calculate_profitability_ratios: {
        Args: {
          tenant_id_param: string
          period_start: string
          period_end: string
        }
        Returns: Json
      }
      can_modify_account: {
        Args: { account_id_param: string; user_id_param: string }
        Returns: Json
      }
      check_budget_overruns: {
        Args: Record<PropertyKey, never>
        Returns: {
          cost_center_id: string
          cost_center_name: string
          cost_center_code: string
          budget_amount: number
          actual_spent: number
          overrun_amount: number
          overrun_percentage: number
        }[]
      }
      check_contract_related_records: {
        Args: { contract_id_param: string }
        Returns: Json
      }
      check_period_closure_readiness: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_period_status: {
        Args: { period_date: string }
        Returns: Json
      }
      check_tenant_isolation_compliance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_tenant_roles: {
        Args: { roles_param: string[] }
        Returns: boolean
      }
      check_user_multiple_roles: {
        Args: { roles_param: string[] }
        Returns: boolean
      }
      check_user_permission: {
        Args: { required_permission: string }
        Returns: boolean
      }
      check_user_role: {
        Args: {
          user_id_param: string
          role_param: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      check_user_role_secure: {
        Args: { role_param: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      cleanup_duplicate_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_orphaned_journal_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      close_financial_period: {
        Args: {
          period_id_param: string
          closing_reason_param?: string
          user_ip?: string
          user_agent_param?: string
        }
        Returns: Json
      }
      complete_chart_of_accounts_part2: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      complete_chart_of_accounts_part3: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      complete_chart_of_accounts_part4: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      complete_liabilities_equity_revenue_expenses: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      convert_currency: {
        Args: {
          p_amount: number
          p_from_currency: string
          p_to_currency: string
          p_tenant_id: string
          p_date?: string
        }
        Returns: number
      }
      copy_default_branches: {
        Args: { target_tenant_id: string }
        Returns: number
      }
      copy_default_chart_of_accounts: {
        Args: { target_tenant_id: string }
        Returns: number
      }
      copy_default_company_branding: {
        Args: { target_tenant_id: string }
        Returns: number
      }
      copy_default_cost_centers: {
        Args: { target_tenant_id: string }
        Returns: number
      }
      copy_default_financial_periods: {
        Args: { target_tenant_id: string }
        Returns: number
      }
      correct_account_balance: {
        Args: { account_code_param: string }
        Returns: Json
      }
      correct_account_balance_enhanced: {
        Args: { account_code_param: string }
        Returns: Json
      }
      create_accounting_lock: {
        Args: {
          p_reference_type: string
          p_reference_id: string
          p_journal_entry_id: string
          p_lock_type: string
        }
        Returns: string
      }
      create_approval_request: {
        Args: {
          p_approval_type: string
          p_reference_table: string
          p_reference_id: string
          p_requesting_dept_id: string
          p_approving_dept_id: string
          p_requested_by: string
          p_amount?: number
          p_details?: Json
          p_priority?: string
        }
        Returns: string
      }
      create_attendance_accounting_entry: {
        Args: { attendance_data: Json }
        Returns: string
      }
      create_automated_journal_entry: {
        Args: {
          rule_id: string
          reference_type: string
          reference_id: string
          transaction_data: Json
        }
        Returns: string
      }
      create_automatic_journal_entry: {
        Args: {
          p_tenant_id: string
          p_reference_type: string
          p_reference_id: string
          p_description: string
          p_entry_lines: Json
        }
        Returns: string
      }
      create_comprehensive_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      create_contract_accounting_entry: {
        Args: { contract_id: string; contract_data: Json }
        Returns: string
      }
      create_contract_customer_accounting_entry: {
        Args: {
          contract_id_param: string
          customer_id_param: string
          contract_data: Json
        }
        Returns: string
      }
      create_correct_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      create_default_test_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_depreciation_entries: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_depreciation_journal_entries: {
        Args: { target_month?: string }
        Returns: number
      }
      create_final_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      create_installment_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_invoice_accounting_entry: {
        Args: { invoice_id: string; invoice_data: Json }
        Returns: string
      }
      create_invoice_customer_accounting_entry: {
        Args: {
          invoice_id_param: string
          customer_id_param: string
          invoice_data: Json
        }
        Returns: string
      }
      create_invoice_receivable_entry: {
        Args: { invoice_id: string; invoice_data: Json }
        Returns: string
      }
      create_journal_entry_for_received_check: {
        Args: { received_check_id: string }
        Returns: string
      }
      create_journal_entry_from_check: {
        Args: { check_id: string }
        Returns: string
      }
      create_journal_entry_from_expense_voucher: {
        Args: { voucher_id: string }
        Returns: string
      }
      create_maintenance_accounting_entry: {
        Args: { maintenance_id: string; maintenance_data: Json }
        Returns: string
      }
      create_payment_accounting_entry: {
        Args: { payment_id: string; payment_data: Json }
        Returns: string
      }
      create_payment_customer_accounting_entry: {
        Args: {
          payment_id_param: string
          customer_id_param: string
          invoice_id_param: string
          payment_data: Json
        }
        Returns: string
      }
      create_payment_revenue_entry: {
        Args: { payment_id: string; payment_data: Json }
        Returns: string
      }
      create_payroll_accounting_entry: {
        Args: { payroll_id: string; payroll_data: Json }
        Returns: string
      }
      create_tenant_with_admin: {
        Args: { tenant_data: Json; admin_user_id?: string }
        Returns: Json
      }
      create_tenant_with_admin_user: {
        Args: {
          tenant_data: Json
          admin_email: string
          admin_password: string
          admin_full_name: string
        }
        Returns: Json
      }
      create_user_invitation: {
        Args: { email_param: string; role_param: string }
        Returns: Json
      }
      create_vehicle_asset: {
        Args: { vehicle_id: string; vehicle_data: Json }
        Returns: string
      }
      create_vehicle_asset_with_hierarchy: {
        Args: { vehicle_id: string; vehicle_data: Json }
        Returns: string
      }
      create_vehicle_cost_journal_entry: {
        Args: { vehicle_cost_id: string }
        Returns: string
      }
      create_violation_accounting_entry: {
        Args: {
          payment_id: string
          payment_amount: number
          payment_date: string
          violation_number: string
          customer_name: string
        }
        Returns: string
      }
      create_violation_receivable_entry: {
        Args: {
          violation_id: string
          violation_amount: number
          violation_date: string
          violation_number: string
          customer_name: string
        }
        Returns: string
      }
      debug_user_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_user_tenant_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      enhanced_security_monitor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      evaluate_journal_entry_review: {
        Args: {
          entry_id: string
          reviewer_id: string
          review_status: string
          comments?: string
        }
        Returns: Json
      }
      execute_analytics_query: {
        Args: { query_text: string }
        Returns: Json
      }
      execute_automation_rule: {
        Args: {
          p_rule_id: string
          p_reference_type: string
          p_reference_id: string
          p_event_data: Json
        }
        Returns: string
      }
      extract_transaction_features: {
        Args: { description: string; amount: number; transaction_date?: string }
        Returns: Json
      }
      find_duplicate_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_name: string
          account_type: string
          count_duplicates: number
          account_codes: string[]
        }[]
      }
      fix_double_revenue_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_existing_contract_accounting: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_unbalanced_accounting_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_account_code: {
        Args: {
          p_tenant_id: string
          p_parent_account_id?: string
          p_account_type?: string
        }
        Returns: string
      }
      generate_asset_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_asset_report: {
        Args: { report_date?: string; report_tenant_id?: string }
        Returns: {
          asset_id: string
          asset_name: string
          asset_code: string
          category: string
          purchase_cost: number
          accumulated_depreciation: number
          book_value: number
          assigned_employee: string
          location_description: string
          condition_status: string
          last_maintenance: string
          next_maintenance: string
          age_years: number
          depreciation_rate_percent: number
        }[]
      }
      generate_balance_sheet_report: {
        Args: { tenant_id_param: string; report_date: string }
        Returns: Json
      }
      generate_basic_financial_report: {
        Args: {
          p_tenant_id: string
          p_report_type: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      generate_branch_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_collective_invoice: {
        Args: { period_start: string; period_end: string; due_days?: number }
        Returns: string
      }
      generate_contract_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_cost_center_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_customer_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_customer_number_simple: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_data_isolation_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_department_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_domain_verification_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_employee_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_financial_summary: {
        Args: { as_of_date?: string }
        Returns: Json
      }
      generate_hierarchical_asset_code: {
        Args: { vehicle_type: string; make: string; model: string }
        Returns: string
      }
      generate_income_statement: {
        Args: {
          tenant_id_param: string
          period_start: string
          period_end: string
        }
        Returns: Json
      }
      generate_installment_plan_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_journal_entry_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_orphaned_entries_impact_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_payment_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_period_comparison: {
        Args: {
          tenant_id_param: string
          primary_start_date: string
          primary_end_date: string
          comparison_start_date: string
          comparison_end_date: string
          account_types?: string[]
        }
        Returns: {
          account_id: string
          account_code: string
          account_name: string
          account_type: string
          primary_amount: number
          comparison_amount: number
          variance_amount: number
          variance_percentage: number
        }[]
      }
      generate_public_quotation_link: {
        Args: { quotation_id: string; expires_in_days?: number }
        Returns: string
      }
      generate_quotation_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_saas_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_vehicle_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_violation_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_violation_payment_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_account_balance_optimized: {
        Args: { account_id_param: string; as_of_date?: string }
        Returns: number
      }
      get_account_summary: {
        Args: {
          account_id_param: string
          start_date_param: string
          end_date_param: string
        }
        Returns: {
          total_debit: number
          total_credit: number
          final_balance: number
          entries_count: number
          opening_balance: number
        }[]
      }
      get_accounting_entries_summary: {
        Args: { filters?: Json }
        Returns: Json
      }
      get_cost_center_setting: {
        Args: { setting_key_param: string }
        Returns: Json
      }
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_customer_accounting_summary: {
        Args: {
          customer_id_param?: string
          date_from?: string
          date_to?: string
        }
        Returns: Json
      }
      get_customer_current_balance: {
        Args: { customer_id_param: string }
        Returns: number
      }
      get_general_ledger_entries_enhanced: {
        Args: {
          account_id_param: string
          start_date_param: string
          end_date_param: string
        }
        Returns: {
          id: string
          entry_date: string
          entry_number: string
          description: string
          debit_amount: number
          credit_amount: number
          running_balance: number
          reference_id: string
          reference_type: string
        }[]
      }
      get_grouped_system_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_next_document_number: {
        Args: {
          p_tenant_id: string
          p_document_type: string
          p_branch_id?: string
        }
        Returns: string
      }
      get_optimized_dashboard_stats: {
        Args: { tenant_id_param: string }
        Returns: Json
      }
      get_related_modules: {
        Args: { module_name: string; entity_id: string }
        Returns: {
          related_module: string
          related_id: string
          relationship_type: string
          notes: string
        }[]
      }
      get_safe_default_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_secure_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_system_setting: {
        Args: { setting_key_param: string }
        Returns: Json
      }
      get_tenant_theme: {
        Args: { p_tenant_id?: string }
        Returns: Json
      }
      get_user_permissions: {
        Args: { _user_id: string; _tenant_id: string }
        Returns: {
          permission_key: string
          permission_name: string
          module_name: string
          action_type: string
          granted: boolean
          source: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      hard_delete_tenant: {
        Args: { tenant_id_param: string; deletion_reason?: string }
        Returns: Json
      }
      has_any_role: {
        Args: {
          user_id_param: string
          roles_param: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      has_any_tenant_role: {
        Args: { roles_param: string[] }
        Returns: boolean
      }
      has_existing_accounting_entry: {
        Args: {
          p_reference_type: string
          p_reference_id: string
          p_lock_type: string
        }
        Returns: boolean
      }
      has_financial_transactions: {
        Args: { account_id_param: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _user_id: string; _tenant_id: string; _permission_key: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id_param: string
          role_param: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: { _role: string }
        Returns: boolean
      }
      implement_comprehensive_chart_improvements: {
        Args: { tenant_id_param: string }
        Returns: Json
      }
      initiate_domain_verification: {
        Args: {
          p_tenant_id: string
          p_domain: string
          p_verification_type?: string
        }
        Returns: Json
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_saas_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tenant_valid: {
        Args: { tenant_id_param: string }
        Returns: boolean
      }
      log_tenant_access: {
        Args: {
          p_tenant_id: string
          p_attempted_tenant_id: string
          p_table_name: string
          p_action: string
          p_success: boolean
        }
        Returns: undefined
      }
      log_tenant_access_attempt: {
        Args: {
          attempted_tenant_id: string
          table_name: string
          action: string
          success: boolean
        }
        Returns: undefined
      }
      log_transaction: {
        Args:
          | {
              p_transaction_type: string
              p_source_table: string
              p_source_id: string
              p_department_id?: string
              p_employee_id?: string
              p_customer_id?: string
              p_vehicle_id?: string
              p_amount?: number
              p_description?: string
              p_details?: Json
            }
          | {
              p_transaction_type: string
              p_source_table: string
              p_source_id: string
              p_department_id?: string
              p_employee_id?: string
              p_customer_id?: string
              p_vehicle_id?: string
              p_amount?: number
              p_description?: string
              p_details?: Json
            }
        Returns: string
      }
      log_user_activity: {
        Args: {
          action_type_param: string
          action_description_param?: string
          ip_address_param?: string
          user_agent_param?: string
        }
        Returns: undefined
      }
      mark_contract_deleted: {
        Args: { contract_id_param: string; reason?: string }
        Returns: Json
      }
      migrate_account_balances: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_to_deferred_revenue_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_financial_kpis_smart: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_tenant_data_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      periodic_accounting_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_automated_accounting_event: {
        Args: {
          p_event_type: string
          p_reference_type: string
          p_reference_id: string
          p_event_data: Json
        }
        Returns: Json
      }
      quick_security_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reopen_financial_period: {
        Args: {
          period_id_param: string
          reopening_reason_param: string
          user_ip?: string
          user_agent_param?: string
        }
        Returns: Json
      }
      reorganize_account_codes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reprocess_missing_invoice_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reprocess_missing_payment_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      restore_cancelled_tenant: {
        Args: { tenant_id_param: string; restore_reason?: string }
        Returns: Json
      }
      run_journal_entry_validations: {
        Args: { entry_id: string }
        Returns: undefined
      }
      run_monthly_depreciation: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      safe_delete_contract: {
        Args: { contract_id_param: string; delete_related?: boolean }
        Returns: Json
      }
      safe_delete_tenant: {
        Args: { tenant_id_param: string; deletion_reason?: string }
        Returns: Json
      }
      save_comparison_report: {
        Args: {
          tenant_id_param: string
          report_name_param: string
          report_type_param: string
          primary_start_date: string
          primary_end_date: string
          comparison_start_date: string
          comparison_end_date: string
          created_by_param?: string
        }
        Returns: string
      }
      save_financial_comparison: {
        Args: {
          tenant_id_param: string
          comparison_name_param: string
          base_start: string
          base_end: string
          comp_start: string
          comp_end: string
          created_by_param: string
        }
        Returns: string
      }
      secure_tenant_operation: {
        Args: {
          operation_type: string
          table_name: string
          required_role?: string
        }
        Returns: boolean
      }
      security_audit_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      security_maintenance_routine: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      setup_complete_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: boolean
      }
      setup_comprehensive_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      setup_default_role_permissions: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      setup_enhanced_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      setup_tenant_default_accounting_data: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      test_accounting_data_isolation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_tenant_data_isolation: {
        Args: { test_tenant_id: string }
        Returns: Json
      }
      update_account_balances: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_all_cost_center_costs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_cost_center_actual_cost: {
        Args: { cost_center_id: string }
        Returns: undefined
      }
      update_cost_center_setting: {
        Args: {
          setting_key_param: string
          new_value: Json
          updated_by_param?: string
        }
        Returns: boolean
      }
      update_overdue_installments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_system_setting: {
        Args: {
          setting_key_param: string
          new_value: Json
          updated_by_param?: string
        }
        Returns: boolean
      }
      update_user_last_activity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_account_structure: {
        Args: {
          p_tenant_id: string
          p_account_code: string
          p_parent_account_id?: string
          p_level?: number
        }
        Returns: Json
      }
      validate_accounting_access: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      validate_accounting_balance: {
        Args: { journal_entry_id: string }
        Returns: Json
      }
      validate_accounting_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_chart_consistency: {
        Args: { tenant_id_param: string }
        Returns: Json
      }
      validate_chart_of_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_journal_entry_accounts: {
        Args: { entry_id: string }
        Returns: boolean
      }
      validate_journal_entry_balance: {
        Args: { entry_id: string }
        Returns: boolean
      }
      validate_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_tenant_access: {
        Args: { table_tenant_id: string }
        Returns: boolean
      }
      validate_tenant_isolation_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_trial_balance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_domain: {
        Args: { p_verification_id: string }
        Returns: boolean
      }
      verify_tenant_accounting_data: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
    }
    Enums: {
      contract_status:
        | "draft"
        | "pending"
        | "active"
        | "completed"
        | "cancelled"
      contract_type: "daily" | "weekly" | "monthly" | "custom"
      customer_status: "active" | "inactive" | "blocked"
      customer_type: "individual" | "company"
      user_role:
        | "admin"
        | "manager"
        | "accountant"
        | "technician"
        | "receptionist"
        | "super_admin"
      vehicle_status: "available" | "rented" | "maintenance" | "out_of_service"
      vehicle_type:
        | "sedan"
        | "suv"
        | "hatchback"
        | "coupe"
        | "pickup"
        | "van"
        | "luxury"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_status: ["draft", "pending", "active", "completed", "cancelled"],
      contract_type: ["daily", "weekly", "monthly", "custom"],
      customer_status: ["active", "inactive", "blocked"],
      customer_type: ["individual", "company"],
      user_role: [
        "admin",
        "manager",
        "accountant",
        "technician",
        "receptionist",
        "super_admin",
      ],
      vehicle_status: ["available", "rented", "maintenance", "out_of_service"],
      vehicle_type: [
        "sedan",
        "suv",
        "hatchback",
        "coupe",
        "pickup",
        "van",
        "luxury",
      ],
    },
  },
} as const
