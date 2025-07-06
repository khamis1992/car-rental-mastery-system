export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          updated_at?: string
        }
        Relationships: []
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
          total_expense_budget?: number | null
          total_revenue_budget?: number | null
          updated_at?: string
        }
        Relationships: []
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
          updated_at?: string
          website?: string | null
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
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
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
            foreignKeyName: "contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          cost_center_code: string
          cost_center_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          cost_center_code: string
          cost_center_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          cost_center_code?: string
          cost_center_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
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
          total_contracts?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: []
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
          salary: number
          status: string
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
          salary: number
          status?: string
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
          salary?: number
          status?: string
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
            foreignKeyName: "employees_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
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
        ]
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
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "quotations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          transaction_reference?: string | null
          updated_at?: string
          violation_id?: string
        }
        Relationships: [
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_book_value: {
        Args: { asset_cost: number; accumulated_depreciation: number }
        Returns: number
      }
      calculate_budget_variance: {
        Args: { budget_id: string }
        Returns: undefined
      }
      calculate_financial_kpis: {
        Args: { for_date?: string }
        Returns: number
      }
      calculate_forecast_accuracy: {
        Args: Record<PropertyKey, never>
        Returns: {
          forecast_type: string
          avg_accuracy: number
          forecast_count: number
        }[]
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
      check_contract_related_records: {
        Args: { contract_id_param: string }
        Returns: Json
      }
      cleanup_duplicate_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_attendance_accounting_entry: {
        Args: { attendance_data: Json }
        Returns: string
      }
      create_contract_accounting_entry: {
        Args: { contract_id: string; contract_data: Json }
        Returns: string
      }
      create_depreciation_entries: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      generate_department_code: {
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
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_journal_entry_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      mark_contract_deleted: {
        Args: { contract_id_param: string; reason?: string }
        Returns: Json
      }
      migrate_to_deferred_revenue_system: {
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
      safe_delete_contract: {
        Args: { contract_id_param: string; delete_related?: boolean }
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
