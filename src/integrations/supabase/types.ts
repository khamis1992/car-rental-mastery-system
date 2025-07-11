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
          account_name_en: string | null
          account_type: string
          allow_posting: boolean | null
          created_at: string
          created_by: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          level: number
          notes: string | null
          opening_balance: number | null
          parent_account_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_category: string
          account_code: string
          account_name: string
          account_name_en?: string | null
          account_type: string
          allow_posting?: boolean | null
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          level?: number
          notes?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_category?: string
          account_code?: string
          account_name?: string
          account_name_en?: string | null
          account_type?: string
          allow_posting?: boolean | null
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          level?: number
          notes?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
          tenant_id: string
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
          budget_amount: number | null
          cost_center_code: string
          cost_center_name: string
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
          parent_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_spent?: number | null
          budget_amount?: number | null
          cost_center_code: string
          cost_center_name: string
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
          parent_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_spent?: number | null
          budget_amount?: number | null
          cost_center_code?: string
          cost_center_name?: string
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
          parent_id?: string | null
          tenant_id?: string
          updated_at?: string
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
            foreignKeyName: "cost_centers_tenant_id_fkey"
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
          tenant_id: string
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
          tenant_id: string
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
          created_at: string
          created_by: string | null
          end_date: string
          fiscal_year: number
          id: string
          is_closed: boolean | null
          period_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          fiscal_year: number
          id?: string
          is_closed?: boolean | null
          period_name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          fiscal_year?: number
          id?: string
          is_closed?: boolean | null
          period_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixed_assets: {
        Row: {
          account_id: string | null
          accumulated_depreciation: number | null
          accumulated_depreciation_account_id: string | null
          asset_category: string
          asset_code: string
          asset_name: string
          book_value: number
          created_at: string
          created_by: string | null
          depreciation_expense_account_id: string | null
          depreciation_method: string
          description: string | null
          disposal_amount: number | null
          disposal_date: string | null
          disposal_reason: string | null
          id: string
          invoice_number: string | null
          location: string | null
          purchase_cost: number
          purchase_date: string
          residual_value: number | null
          serial_number: string | null
          status: string
          supplier_name: string | null
          tenant_id: string
          updated_at: string
          useful_life_years: number
          warranty_expiry: string | null
        }
        Insert: {
          account_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_category: string
          asset_code: string
          asset_name: string
          book_value: number
          created_at?: string
          created_by?: string | null
          depreciation_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          disposal_reason?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          purchase_cost: number
          purchase_date: string
          residual_value?: number | null
          serial_number?: string | null
          status?: string
          supplier_name?: string | null
          tenant_id: string
          updated_at?: string
          useful_life_years: number
          warranty_expiry?: string | null
        }
        Update: {
          account_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_category?: string
          asset_code?: string
          asset_name?: string
          book_value?: number
          created_at?: string
          created_by?: string | null
          depreciation_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          disposal_reason?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          purchase_cost?: number
          purchase_date?: string
          residual_value?: number | null
          serial_number?: string | null
          status?: string
          supplier_name?: string | null
          tenant_id?: string
          updated_at?: string
          useful_life_years?: number
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
          contract_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          outstanding_amount: number
          paid_amount: number
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          outstanding_amount?: number
          paid_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          outstanding_amount?: number
          paid_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
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
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          financial_period_id: string | null
          id: string
          posted_at: string | null
          posted_by: string | null
          reference_id: string | null
          reference_type: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          status: string
          tenant_id: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          entry_number: string
          financial_period_id?: string | null
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          tenant_id: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          financial_period_id?: string | null
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          tenant_id?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: [
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
      journal_entry_lines: {
        Row: {
          account_id: string
          cost_center_id: string | null
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
          tenant_id: string | null
        }
        Insert: {
          account_id: string
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
          tenant_id?: string | null
        }
        Update: {
          account_id?: string
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
          tenant_id?: string | null
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
          contract_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          invoice_id: string
          journal_entry_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          receipt_url: string | null
          status: string
          tenant_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          auto_generated_invoice?: boolean | null
          bank_name?: string | null
          check_number?: string | null
          contract_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          invoice_id: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number: string
          receipt_url?: string | null
          status?: string
          tenant_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_generated_invoice?: boolean | null
          bank_name?: string | null
          check_number?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          transaction_reference?: string | null
          updated_at?: string
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
          tenant_id: string
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
      analyze_deferred_revenue_account: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      audit_orphaned_entries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calculate_advanced_kpi: {
        Args: { kpi_code_param: string }
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
      calculate_cost_center_actual_costs: {
        Args: { cost_center_id_param: string }
        Returns: number
      }
      calculate_financial_kpis: {
        Args: { for_date?: string }
        Returns: number
      }
      calculate_financial_metrics: {
        Args: { start_date?: string; end_date?: string }
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
      cleanup_duplicate_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_orphaned_journal_entries: {
        Args: Record<PropertyKey, never>
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
      create_comprehensive_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      create_contract_accounting_entry: {
        Args: { contract_id: string; contract_data: Json }
        Returns: string
      }
      create_correct_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      create_depreciation_entries: {
        Args: Record<PropertyKey, never>
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
      create_invoice_receivable_entry: {
        Args: { invoice_id: string; invoice_data: Json }
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
      create_vehicle_asset: {
        Args: { vehicle_id: string; vehicle_data: Json }
        Returns: string
      }
      create_vehicle_asset_with_hierarchy: {
        Args: { vehicle_id: string; vehicle_data: Json }
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
      execute_analytics_query: {
        Args: { query_text: string }
        Returns: Json
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
      generate_asset_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_branch_code: {
        Args: Record<PropertyKey, never>
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
      generate_hierarchical_asset_code: {
        Args: { vehicle_type: string; make: string; model: string }
        Returns: string
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
      get_grouped_system_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      hard_delete_tenant: {
        Args: { tenant_id_param: string; deletion_reason?: string }
        Returns: Json
      }
      has_any_tenant_role: {
        Args: { _roles: string[] }
        Returns: boolean
      }
      has_permission: {
        Args: { _user_id: string; _tenant_id: string; _permission_key: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: { _role: string }
        Returns: boolean
      }
      initiate_domain_verification: {
        Args: {
          p_tenant_id: string
          p_domain: string
          p_verification_type?: string
        }
        Returns: Json
      }
      is_saas_admin: {
        Args: Record<PropertyKey, never>
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
      mark_contract_deleted: {
        Args: { contract_id_param: string; reason?: string }
        Returns: Json
      }
      migrate_to_deferred_revenue_system: {
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
      safe_delete_contract: {
        Args: { contract_id_param: string; delete_related?: boolean }
        Returns: Json
      }
      safe_delete_tenant: {
        Args: { tenant_id_param: string; deletion_reason?: string }
        Returns: Json
      }
      setup_complete_chart_of_accounts: {
        Args: { tenant_id_param: string }
        Returns: boolean
      }
      setup_default_role_permissions: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      setup_tenant_default_accounting_data: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      test_accounting_data_isolation: {
        Args: Record<PropertyKey, never>
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
      validate_chart_of_accounts: {
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
